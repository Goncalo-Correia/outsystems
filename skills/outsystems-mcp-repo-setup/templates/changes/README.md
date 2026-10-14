# Change log

Every `applyModelApiCode` call that saved an OML is recorded here **once the module is published**, by the `outsystems-mcp-publish` skill, as `<yyyy-mm-dd>/<HHmmss>-<Module>[-<story>].cs`. The date and time are when the change was made. Each file holds the exact lambda that was run, after a header:

```csharp
// Published: 2026-10-14T14:40:03.000Z
// Module:   ClaudeSheet
// When:     2026-10-14T13:05:22.000Z
// Story:    US-012
// Outcome:  saved
// Imports:  OutSystems.Model.Data
eSpace => { … }
```

Notes:

- A file here means the change was **published**. Each publish's row in `PUBLISHES.md` says how many change files it logged; `reviews/` has the approval.
- The lambdas are read from the Claude Code session that publishes: every `applyModelApiCode` call for the module since that session's previous publish or `omlReset`. Changes made in an earlier session, or by a subagent, are not logged. They still show up in the next snapshot diff.
- Publishing without the `outsystems-mcp-publish` skill logs nothing.
- Compile errors and runs that saved nothing are not recorded.
- `Outcome: saved with N validation error(s)` usually means a later file in the same story fixed it.
- Changes made by hand in Service Studio don't appear here. They show up in the next snapshot diff.
