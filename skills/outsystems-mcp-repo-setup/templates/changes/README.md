# Change log

Every `applyModelApiCode` call that saved an OML is recorded here as `<yyyy-mm-dd>/<HHmmss>-<Module>[-<story>].cs`. Each file holds the exact lambda that was run, after a header:

```csharp
// Module:   ClaudeSheet
// When:     2026-10-14T13:05:22.000Z
// Story:    US-012
// Outcome:  saved
// Imports:  OutSystems.Model.Data
eSpace => { … }
```

Notes:

- A file here means the change was **saved to an OML**, not that it was merged or published. Check `reviews/` and `PUBLISHES.md` for that.
- Compile errors and runs that saved nothing are not recorded.
- `Outcome: saved with N validation error(s)` usually means a later file in the same story fixed it.
- Changes made by hand in Service Studio don't appear here. They show up in the next snapshot diff.
