---
name: outsystems-snapshot-refresh
description: Refreshes snapshots/<Module>/ in this repository from the live OutSystems module through the Service Studio MCP read tools, so git shows how the module changed. Use after every successful publish, when the publish hook reminds you, when the user says "refresh the snapshot", "update snapshots", "snapshot the module", or before starting work on a module whose snapshot is missing or old. Modes - light (default), full, or targeted (the elements changed in one story).
---

# Refresh module snapshots

Snapshots are the text record of each module. The Service Studio read tools return Model API C# code, and that is saved as-is so `git diff` shows real changes.

## How files get written

While `.claude/state/snapshot-mode` exists, the `capture-snapshot.mjs` hook saves the result of every `mcp__servicestudio__get*` call to `snapshots/<Module>/` (mapping in `snapshots/README.md`). You only make the read calls; you don't re-type their output.

1. Create `.claude/state/snapshot-mode` (any content).
2. Make the first read call and check that its file appeared, e.g. `snapshots/<Module>/data-model.cs`.
   - If it appeared, the hook is active. Continue with read calls only.
   - If it didn't, the hook isn't loaded (Claude Code wasn't restarted after setup, or Node is missing). Write each result yourself with the Write tool, using the same paths.
3. **Always delete `.claude/state/snapshot-mode` at the end**, including when something fails. Otherwise ordinary reads keep overwriting snapshots.

## Rules

- The module must be open in Service Studio. Check with `listApps`, and use `moduleType` to choose the Reactive/Mobile or `*Traditional` UI tools.
- Reuse the session token. Make read calls **one at a time**.
- Pass `includeJson: "Never"` to every read tool that accepts it.
- Skip `getImage` (binary), `getSerializedObject*` and `getValidationMessages`.

## Modes

### Light (default, and after every publish)

Module-wide reads, one call each:

- `getDataModel`, `getStructures`, `getSettings`, `getTimers`, `getIntegrations`, `getUserExceptions`, `getClientVariables`, `getSessionVariables`
- `getActionNames` with `objectType` `server`, then `client`, then `service`
- `getRoleNames`, `getScreenNames`, `getWebBlockNames`, `getThemeNames`, `getResourceNames`, `getScriptNames`. For Traditional modules, use the `*NamesTraditional` variants.

### Targeted (after a story)

Light mode, plus a single-object read (`getServerAction`, `getClientAction`, `getScreen`, `getWebBlock`, `getRole`, `getTheme`, …) for every element the story created or changed. The story file and its `changes/` files list them.

### Full (on request)

Light mode, plus a single-object read for **every** name in the `names/*.json` lists. Before starting, say how many calls that is, and confirm first if it's more than 50.

## Removing deleted elements

After the name lists are refreshed, compare each per-object folder (`server-actions/`, `screens/`, …) with its list in `names/`. Delete the files whose element no longer exists, and mention them in the summary.

## Finish

1. Delete `.claude/state/snapshot-mode`.
2. Rewrite `snapshots/<Module>/README.md`:
   - Module name, type and version from `listApps`.
   - Refresh date, mode, and story (if any).
   - Counts of entities, structures, server, client and service actions, screens, blocks and roles.
3. Run `git diff --stat -- snapshots/<Module>/` and summarise what changed in a few lines. Point out anything that changed but isn't in this story's `changes/`: it was probably edited by hand in Service Studio.
