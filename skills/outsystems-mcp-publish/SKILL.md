---
name: outsystems-mcp-publish
description: Publishes an OutSystems 11 module through the Service Studio MCP (omlPublish) and records it in the project repository - a row in PUBLISHES.md and, after a successful publish, every applyModelApiCode lambda applied to the module in this session written to changes/<date>/. Checks the module is merged, reviewed and free of validation errors first, then refreshes snapshots/<Module>/ (the module's Model API code) from the live module. Use whenever a module is about to be published - "publish", "publish the module", "1-click publish", "deploy to dev", "ship it", after outsystems-mcp-code-review approves everything - and in repositories set up with outsystems-mcp-repo-setup. Also use it on its own to refresh or take module snapshots - "refresh the snapshot", "update snapshots", "snapshot the module", "full snapshot" - or when a snapshot is missing or old. Always publish through this skill rather than calling omlPublish directly, because the change log is written by this skill's hook.
hooks:
  PostToolUse:
    - matcher: "mcp__servicestudio__omlPublish"
      hooks:
        - type: command
          command: 'node "${CLAUDE_SKILL_DIR:-$HOME/.claude/skills/outsystems-mcp-publish}/scripts/log-publish.mjs"'
          timeout: 30
---

# Publish an OutSystems module

Files in this skill:

- `scripts/log-publish.mjs`: the publish hook described below.
- `references/snapshot.md`: how to refresh `snapshots/<Module>/`, after a publish or on its own.
- `scripts/extract-snapshot.mjs`: copies the read-tool results from the session transcript into `snapshots/`, used by that procedure.

This skill owns the publish step of a repository set up with `outsystems-mcp-repo-setup`. Invoking it registers a `PostToolUse` hook on `mcp__servicestudio__omlPublish` (`scripts/log-publish.mjs`) that stays active for the rest of the session. After each publish the hook:

- appends a row to `PUBLISHES.md`: when, module, status, story, notes;
- **only if the publish succeeded**, reads this session's transcript and writes every successful `applyModelApiCode` lambda for that module since its previous successful publish or `omlReset` to `changes/<yyyy-mm-dd>/<HHmmss>-<Module>[-<story>].cs`. The date and time are when the change was made, and the header says when it was published. Session tokens are never written;
- tells you in its output how many lambdas it logged.

A failed or blocked publish logs nothing to `changes/`. Those lambdas are picked up by the next successful publish in the same session.

## Before publishing

Stop and tell the user if any of these fail. Don't publish around them.

1. **Repository.** `PUBLISHES.md` and `changes/` exist in the project. If they don't, offer `outsystems-mcp-repo-setup` first. The hook won't log anything without them.
2. **Session token.** Reuse the one from this conversation. Call `createSessionToken` only if there is none.
3. **Module.** `listApps` shows the module open (`isOpen: true`).
4. **Merged.** `omlPublish` publishes the live module in Service Studio, not an unmerged chain. If there were `applyModelApiCode` calls since the last `omlMerge`, merge first with the last `mutatedOmlPath`.
5. **Validation.** `getValidationMessages` returns no errors. Warnings are fine, but list them.
6. **Review.** `reviews/<Module>/<story-id>.md` exists for the current story and approves everything (see `outsystems-mcp-code-review`). If there is no review, ask the user whether to publish anyway.
7. **Story.** If the work belongs to a story, `.claude/state/current-story` holds its ID so the logs are tagged with it.

## Publish

Call `mcp__servicestudio__omlPublish` with `{ "eSpaceName": "<Module>" }`. Project settings put it behind a confirmation prompt, and the user may also have to grant the write permission in the Service Studio MCP dialog. If the call returns `status: "blocked"`, say so and stop.

Make one publish call at a time, one module at a time. If several modules changed, publish producers before consumers: Foundation, then Core, then End-user. Refresh references in the consumers in between with `omlRefreshReferences`.

## After publishing

1. **Check the hook ran.** `PUBLISHES.md` has a new last row for this publish, and on success the hook's output says how many lambdas went to `changes/`.
   - **No new row:** the hook isn't active, for example because Node is missing or the hook command didn't resolve. Append the row yourself in the same format, and list the lambdas from this session for the user instead of writing them. Then point them to *Troubleshooting* below.
   - **Hook reports 0 lambdas although changes were made:** they were made in another session, by a subagent, or by hand in Service Studio. Say so. The snapshot diff will still show them.
2. **Failure.** Report the status and reason. Fix the cause (usually validation errors or outdated references), then go back to *Before publishing*.
3. **Success:**
   - refresh the module's snapshots by following [references/snapshot.md](references/snapshot.md): targeted mode for the story's elements, otherwise light;
   - update the story file: status, publish date and the `changes/` files;
   - offer to commit `PUBLISHES.md`, `changes/`, `snapshots/` and the story together. Don't commit without asking.

## Refreshing snapshots without publishing

When the user only wants a snapshot, for example after hand edits in Service Studio, a first snapshot, or a full snapshot, follow [references/snapshot.md](references/snapshot.md) directly. Don't publish.

## Troubleshooting

- **The hook writes nothing.** Run Claude Code with `OS_REPO_HOOK_DEBUG=1` set. The hook then saves its input, without the session token, to `.claude/state/last-log-publish.json`, and errors go to `.claude/state/error-log-publish.log`.
- **The hook command can't find the script.** It uses `CLAUDE_SKILL_DIR`, falling back to `~/.claude/skills/outsystems-mcp-publish`. If the skill lives somewhere else, for example vendored into a repo's `.claude/skills/`, and the variable isn't set, change the fallback path in the frontmatter.
- **Lambdas are missing.** The transcript format is internal to Claude Code and may change between versions. Check `.claude/state/error-log-publish.log`, and compare a line of `~/.claude/projects/<project>/<session>.jsonl` with `collectChanges` in `scripts/log-publish.mjs`.
- **Testing the hook.** Pipe a fake `PostToolUse` event into the script with `CLAUDE_PROJECT_DIR` pointing to a scratch copy of the repo, never the real one. The event needs `tool_input.input.eSpaceName`, `tool_response` text `{"published":true}`, a `tool_use_id`, and a `transcript_path` to a JSONL file holding an `applyModelApiCode` `tool_use` block and its `tool_result`.
