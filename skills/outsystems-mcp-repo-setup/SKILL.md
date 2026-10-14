---
name: outsystems-mcp-repo-setup
description: Sets up (or upgrades) a git repository as the working home of an OutSystems 11 project developed through the Service Studio MCP. Scaffolds CLAUDE.md, README, docs (architecture, conventions, decisions), stories, a change log of every applyModelApiCode lambda, text snapshots of each module, publish history, review logs, .mcp.json and permissions, then takes a first snapshot of the open module(s). Use when the user wants to "set up a repo for my OutSystems project", "prepare this repository for OutSystems MCP", "initialize the OutSystems repo", "add source control to my OutSystems app", "bootstrap the project repo", or names outsystems-mcp-repo-setup. Also use when re-running on an already set-up repo to add what is missing. Safe to re-run; it never overwrites existing files. It installs no hooks: publishing and the change log belong to the outsystems-mcp-publish skill.
---

# OutSystems MCP repo setup

OutSystems 11 keeps the app in the platform as binary `.oml` files, so a normal repository can't show what changed. When the work happens through the Service Studio MCP, three text artifacts can stand in for source control:

1. **The Model API lambdas** sent to `applyModelApiCode`: the exact record of every change. The `outsystems-mcp-publish` skill writes them to `changes/` when the module is published.
2. **Snapshots** of each module: the read tools (`getDataModel`, `getServerAction`, `getScreen`, …) return C# Model API code, which is saved to `snapshots/<Module>/` and diffs cleanly in git.
3. **Context for Claude and the team**: CLAUDE.md, architecture, conventions, stories, review logs and publish history.

This skill creates that structure in a target repository, then fills it with real data from the open module.

## Files in this skill

- `scripts/scaffold.mjs`: copies `templates/` into the target, merges config files, and never overwrites. Run it with Node 18+.
- `templates/`: everything the target repo gets. It contains no skills.

This skill only sets up the repository. It installs **no hooks**. The publish step, the `PUBLISHES.md` row, the `changes/` log and snapshot refreshes come from the separate `outsystems-mcp-publish` skill, which registers its own hook when it is invoked.
- `references/config-schema.md`: the config JSON the scaffold script reads.

## Rules

- **Never overwrite or delete an existing file.** The script skips existing files and reports them as `kept` or `kept-differs`. For `kept-differs`, show the user what the template would add and merge by hand only if they agree.
- **Never store secrets.** Session tokens, passwords and LifeTime credentials never go in the repo.
- **Don't commit or push** unless the user asks.
- Service Studio MCP tools are `mcp__servicestudio__*`. Load them with ToolSearch if needed. Every call needs the session token from `createSessionToken`: reuse the one from this conversation and create one only if none exists. **Make read calls one at a time.** Parallel reads have failed with "OML not found" temp-file errors.

## Workflow

### 1. Inspect the target

- The target is the current working directory unless the user names another one.
- Not a git repo: ask whether to run `git init`.
- Check what already exists: `CLAUDE.md`, `README.md`, `.claude/`, `.mcp.json`, `.gitignore`. A repo that already has `snapshots/` and `changes/` is already set up. Say you're running in **update mode**: only missing pieces get added.
- Check `node --version`. Node 18+ is needed for the scaffold script and for the `outsystems-mcp-publish` hook. If Node is missing, stop and tell the user.
- Check that `~/.claude/skills/outsystems-mcp-publish/SKILL.md` exists. If it doesn't, say that publishing won't be logged until it is installed.

### 2. Discover the project from the MCP

If the Service Studio MCP is reachable:

1. `listApps` returns the open module plus its loaded references: `{ apps: [{ name, version, isOpen, isReference, moduleType }] }`.
2. The open module (`isOpen: true`) is the main candidate. References that look like the project's own modules (same prefix, `_CS`, `_IS`, `_Th`, `_Lib`, …) are probably part of it. References like `OutSystemsUI` and `Users` are platform modules, so leave them out.

`listApps` only sees what Service Studio has loaded. Ask about modules it can't see.

Find the MCP URL from the user's existing config: `.mcp.json` in the target, or the `servicestudio` entry under `mcpServers` in `~/.claude.json`. The default is `http://127.0.0.1:41820/mcp`.

If the MCP isn't reachable, continue: everything except the snapshot step works without it. Tell the user to take it later with the `outsystems-mcp-publish` skill ("refresh the snapshot").

### 3. Ask what can't be discovered

Use AskUserQuestion, at most 4 questions in one call, and skip anything already known:

- **Project**: name and one-line description. Suggest a name based on the module and app.
- **Modules**: confirm the list of modules and the architecture layer of each: End-user, Core, Foundation, or Library. Suggest layers from the suffixes.
- **Vendored skills**: copy `servicestudio-mcp-oml` and `outsystems-mcp-code-review` from `~/.claude/skills/` into the repo's `.claude/skills/`?
  - Recommend this when teammates don't have these skills installed.
  - Recommend against it when they already get them from a plugin, because copies drift out of date.
  - Only offer skills that actually exist in `~/.claude/skills/`.

Also ask for the environment URLs (Development, plus Test and Production if they exist) in free text, or leave them as `TODO`.

### 4. Scaffold

1. Write the config JSON (schema in `references/config-schema.md`) to the scratchpad directory, not the repo.
2. Dry run first and show the user the plan:
   ```bash
   node "<this skill dir>/scripts/scaffold.mjs" --target "<repo>" --config "<config.json>" --dry-run
   ```
3. Run it again without `--dry-run`. The script prints a JSON report with `created`, `kept`, `kept-differs` and `merged` entries.
4. For each `kept-differs` file, briefly say what the template would add and offer to merge it.

The script also merges:

- `.gitignore` and `.gitattributes`: adds missing lines.
- `.mcp.json`: adds the `servicestudio` server if it isn't there.
- `.claude/settings.json`:
  - Allows the read-only Service Studio tools without a prompt.
  - Puts `omlPublish` and `omlReset` behind a confirmation prompt.

### 5. Take the first snapshot

Follow `~/.claude/skills/outsystems-mcp-publish/references/snapshot.md` in **light** mode for each open module. It makes the read calls, then extracts their results into `snapshots/` with that skill's `scripts/extract-snapshot.mjs`. A full snapshot of a large module takes many calls, so offer it rather than doing it automatically.

### 6. Fill in the docs

Use what you learned. Don't invent anything: mark unknowns as `TODO`.

- `docs/architecture.md`:
  - The modules table: name, type, layer, version.
  - The open module's references from `listApps`.
  - A Mermaid diagram of the layers.
- `snapshots/<Module>/README.md`: written by the snapshot procedure.
- Leave `docs/conventions.md` with its OutSystems defaults. Mention that the team should adjust it.

### 7. Verify

- Check that no `.claude/hooks/` folder and no `hooks` key in `.claude/settings.json` were created.
- Check that `.claude/settings.json` and `.mcp.json` parse as JSON.
- Run `git status` to show what was added.

### 8. Report

Tell the user:

- What was created, kept and merged, and what is still `TODO`.
- **Restart Claude Code in this repo.** Permissions and `.mcp.json` load at startup. Claude Code will also ask them to approve the project MCP server once.
- The day-to-day workflow is in the new `CLAUDE.md`: stories, then change, merge, review, publish (with `outsystems-mcp-publish`, which logs the lambdas to `changes/`), then snapshot refresh.
- Offer to make the first commit.

