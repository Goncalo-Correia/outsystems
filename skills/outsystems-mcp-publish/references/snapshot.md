# Refresh module snapshots

`snapshots/<Module>/` is the text record of each module as of its last publish. The Service Studio read tools return Model API C# code. You make the read calls, then `scripts/extract-snapshot.mjs` copies their results from this session's transcript into `snapshots/` exactly as returned, so large outputs are never retyped and `git diff` shows only real changes.

Use this procedure:

- after every successful publish (step *After publishing* in `SKILL.md`);
- for the first snapshot when `outsystems-mcp-repo-setup` sets up a repository;
- when the user asks to refresh or take a snapshot without publishing, for example after hand edits in Service Studio.

## Rules

- The module must be open in Service Studio. Check with `listApps`, and use `moduleType` to choose the Reactive/Mobile tools or the `*Traditional` UI tools.
- Reuse the session token. Make read calls **one at a time**. Parallel reads fail with "OML not found".
- Pass `includeJson: "Never"` to every read tool that accepts it.
- Skip `getImage` (binary), `getSerializedObject*` and `getValidationMessages`. The script ignores them anyway.
- Don't make the read calls in a subagent. The script reads only the main session's transcript.

## 1. Note the start time

Before the first read call, record the current UTC time, for example with `date -u +%Y-%m-%dT%H:%M:%SZ`. The script only uses reads made after it.

## 2. Make the read calls

### Light (default)

Module-wide reads, one call each:

- `getDataModel`, `getStructures`, `getSettings`, `getTimers`, `getIntegrations`, `getUserExceptions`, `getClientVariables`, `getSessionVariables`
- `getActionNames` with `objectType` `server`, then `client`, then `service`
- `getRoleNames`, `getScreenNames`, `getWebBlockNames`, `getThemeNames`, `getResourceNames`, `getScriptNames`. For Traditional modules, use the `*NamesTraditional` variants.

### Targeted (after publishing a story)

Light mode, plus a single-object read (`getServerAction`, `getClientAction`, `getScreen`, `getWebBlock`, `getRole`, `getTheme`, …) for every element the story created or changed. The story file and its `changes/` files list them.

### Full (on request)

Light mode, plus a single-object read for **every** non-referenced name (`IsReferenced: false`) in `names/*.json`. Before starting, say how many calls that is, and confirm first if it's more than 50.

## 3. Extract

```bash
node "<this skill dir>/scripts/extract-snapshot.mjs" --module <Module> --since <start time> [--repo <repo>] [--transcript <file.jsonl>]
```

- `--repo` defaults to the current directory.
- `--transcript` defaults to the newest `.jsonl` file in `~/.claude/projects/<repo path with every non-alphanumeric character replaced by ->/`, which is the running session. Pass it explicitly if that folder doesn't exist, because Claude Code hashes very long paths.

The script prints JSON: `written` (the files it wrote), `counts` (the module's own elements, references excluded), `stale` (per-object files whose element is no longer in the matching names list), and `missing` (read calls it expected but didn't find).

| Read call | File in `snapshots/<Module>/` |
|---|---|
| `getDataModel` | `data-model.cs` |
| `getActionNames` with `objectType` | `names/<objectType>-actions.json` |
| `get<Kind>Names` / `get<Kind>NamesTraditional` | `names/<kind>s.json`, e.g. `names/screens.json`, `names/web-blocks.json` |
| `get<Kind>` with `objectName` | `<kind>s/<objectName>.cs`, e.g. `server-actions/GetUser.cs` |
| any other `get<Kind>` | `<kind>.cs`, e.g. `structures.cs`, `client-variables.cs` |

Code is written without the Markdown fences, name lists are sorted and pretty-printed, line endings are LF, and session tokens are never written.

If `written` is empty or `missing` isn't, check that `--since` is earlier than the first read and that the right transcript was used. If the script still finds nothing, for example because the transcript format changed, write the files yourself with the Write tool using the table above, and tell the user.

## 4. Finish

1. **Deleted elements.** For each file in `stale`, confirm in the names list that the element is gone, then delete the file and mention it in the summary.
2. **README.** Rewrite `snapshots/<Module>/README.md` with:
   - module name, type and version from `listApps`;
   - refresh date, mode and story (if any);
   - the `counts` from the script, naming the elements when there are only a few.
3. **Diff.** Run `git diff --stat -- snapshots/<Module>/` and summarise what changed in a few lines. Point out anything that changed but isn't in this story's `changes/`: it was probably edited by hand in Service Studio, in another session, or by a subagent.
