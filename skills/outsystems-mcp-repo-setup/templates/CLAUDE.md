# {{PROJECT_NAME}}

{{DESCRIPTION}}

Platform: {{PLATFORM}}. The app is built through the **Service Studio MCP** (`mcp__servicestudio__*`, at `{{MCP_URL}}`). The modules themselves live in the OutSystems platform. This repository is where the work is planned, recorded and reviewed.

## Environments

{{ENVIRONMENTS_TABLE}}

## Modules

{{MODULES_TABLE}}

Architecture, references and layer rules: [docs/architecture.md](docs/architecture.md).

## Repository map

| Path | What it holds | Who writes it |
|---|---|---|
| `stories/` | One file per user story or technical task: what to build, acceptance criteria, status | Claude + team |
| `changes/<date>/` | Every `applyModelApiCode` lambda that saved an OML, with module, story and outcome | Hook (see below) |
| `snapshots/<Module>/` | Model API code of each module as of the last publish | `outsystems-snapshot-refresh` skill |
| `reviews/<Module>/` | Review rounds from `outsystems-mcp-code-review` | Claude |
| `PUBLISHES.md` | Every `omlPublish` call and its result | Hook |
| `docs/` | Architecture, conventions, decisions (ADRs) | Claude + team |
| `queries/` | Reusable ModelQL queries for `runQuery` | Claude + team |
| `.claude/` | Settings, hooks and project skills | Setup |

## Workflow for every story or task

1. **Story file.** Find or create `stories/<ID>-<slug>.md` from `stories/TEMPLATE.md`. Write the ID (e.g. `US-012`) to `.claude/state/current-story` so the hooks can tag changes and publishes with it. Clear that file when the story is done.
2. **Context.** Read `docs/conventions.md` and the relevant files in `snapshots/<Module>/` before touching the module. Snapshots can be out of date: confirm what you're about to change with the live read tools.
3. **Implement** with `applyModelApiCode`, following the `servicestudio-mcp-oml` skill. {{CHANGELOG_RULE}}
4. **Merge** with `omlMerge` once the last mutation is clean.
5. **Review** with the `outsystems-mcp-code-review` skill. Save review logs to `reviews/<Module>/<story-id>.md` in this repo, not in `~/.claude/outsystems-reviews/`.
6. **Publish** only after the review approves everything. `omlPublish` always asks for confirmation. The hook records the result in `PUBLISHES.md`.
7. **Snapshot.** After a successful publish, refresh the snapshots of the published module with the `outsystems-snapshot-refresh` skill.
8. **Close out.** Update the story's status and implementation notes. If a design choice was made, add a decision in `docs/decisions/`. Offer to commit; don't commit without asking.

## Rules

- Never write session tokens, passwords or LifeTime credentials to any file in this repo.
- Call `createSessionToken` once per session and reuse the token.
- Make Service Studio read calls one at a time. Parallel reads fail with "OML not found".
- A module must be open in Service Studio to be read or changed. `listApps` shows only the open module and its references.
- `omlPublish` publishes the live module in Service Studio, not an unmerged chain, so merge first.
- `docs/conventions.md` is the naming and design standard. If the user asks for something that contradicts it, point that out before doing it.
