# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A multi-asset monorepo of OutSystems assets — not a single application. Each top-level folder is an
independent *category* of asset with its own build (or no build at all) and its own documentation:

- **ODC external libraries** (`odc-outsystems-extensions/`) — C#/.NET class libraries compiled and
  uploaded to ODC.
- **Client-side JavaScript** (`javascript-libraries/`) — script bodies pasted into ODC client
  actions; no build step, no bundler, no npm.
- **Reference data** (`countries.md` and future siblings) — markdown datasets meant to be loaded
  into ODC entities.

Expect new categories over time. When adding one, give it a top-level folder, its own README/notes,
and a section in the root `README.md`.

## Layout

- `odc-outsystems-extensions/` — one folder per ODC external library, each an independent `.csproj`
  (there is **no root solution**):
  - `CompareObjects/` — compares two JSON objects property-by-property, returns a typed
    `List<PropertyDifference>`. Migrated from the O11 `CompareObjs` extension.
  - `Shapefile/` — converts a GeoJSON `FeatureCollection` (WGS84) into a zipped ESRI shapefile
    reprojected to ETRS89 / PT-TM06 (EPSG:3763).
- `javascript-libraries/` — one folder per client-side asset, each with its own `README.md`:
  - `esri-map/` — `esri-map.js` (editable) and `esri-map-readonly.js` (display-only), the two
    client actions behind the `Esri_Maps` web blocks.
  - `input-scripts/` — `input-phonenumber.js`, an input-filtering client action.
- `countries.md` — the 249 ISO 3166-1 countries as a markdown table ready to load into a `Country`
  entity (includes the `CountryTypeId` GUIDs for the intracommunity/extracommunity split).
- `.claude/skills/deploy/` — the `deploy` skill (git-based release flow; see below).

Each extension carries its own `RELEASE_NOTES.md` and each JavaScript folder its own `README.md` —
those are the **authoritative per-asset documentation**. Keep behavioral detail there, not here.

## Building & packaging an ODC extension

Each extension is built and packaged independently from its own project folder.

```bash
dotnet build -c Release           # verification gate
dotnet test -c Release            # runs unit tests if the project has any
dotnet publish -c Release --no-self-contained
```

The **upload ZIP is the contents of the publish output** (`bin/Release/net10.0/publish/`), zipped so
the main assembly is at the ZIP root — named `<Project>.zip` and placed in the project folder,
replacing the previous one. Zipping the `publish` *folder* (assembly one level down) produces a ZIP
ODC rejects. If the `odc-extension` / `odc-extension-zip` skills are available, defer to them for the
build/validate/package procedure rather than reinventing it.

Key `.csproj` conventions that make packaging correct — preserve them on any new extension:

- `TargetFramework` is `net10.0`, `ImplicitUsings` enabled, `Nullable` disabled.
- `CopyLocalLockFileAssemblies=true` so NuGet runtime dependencies land in the publish output and get
  packaged into the ZIP.
- The `OutSystems.ExternalLibraries.SDK` reference is **compile-time only** (`PrivateAssets=all`,
  `ExcludeAssets=runtime`) — ODC provides it at runtime, so it must never be copied to output or
  included in the ZIP.

## ODC external-library authoring model

The public surface of each library is a single decorated interface (`ICompareObjects`,
`IShapefileConverter`) plus the structs it returns:

- `[OSInterface]` on the entry-point interface, `[OSAction]` on each exposed method, `[OSParameter]`
  on parameters — these become the ODC server action and its inputs.
- `[OSStructure]` / `[OSStructureField]` on returned structs — these become ODC Structures, so
  actions return typed lists/records instead of JSON strings.
- The `Description` text on these attributes is user-facing in ODC Studio; keep it precise and
  behavior-accurate (edge cases, null handling, ordering) — it is the contract app developers read.

## Client-side JavaScript model

These files are **not modules and are never imported**. Each file is the entire body of one ODC
client action, pasted into ODC Studio. That constrains how they are written:

- Inputs arrive as `$parameters.<Name>`; outputs / callbacks go out through `$actions.<Name>(...)`.
  There are no imports, exports, or `require` — an added dependency has to be inlined.
- Written as ES5-style IIFEs (`var`, `function`) so they run unmodified inside ODC's runtime.
- Scripts must be **idempotent across re-renders**: ODC re-runs client actions when a block
  re-renders, so handlers and listeners are attached behind a guard rather than stacked. `esri-map`
  keeps a `window.__esriMapBridge` registry with a single shared `message` listener
  (`__listenerAttached`) serving every map on the page; `input-phonenumber` guards its own binding
  the same way.
- Cross-origin work validates `event.origin` against the origin derived from the configured URL —
  keep that guard when editing the map scripts.

The `esri-map` pair is one design in two variants: identical bridge/listener/inbound-conversion code,
differing only in the parameters sent to the iframe and whether an `onResult` handler is registered
(read-only has none). **A change to the shared part must be applied to both files.** Note the storage
shape they translate between: the app stores `MapGeoJson`, where each `geometry.coordinates` is a
JSON *string*; the map speaks standard Esri GeoJSON with real arrays. An empty `features` array is
the unambiguous "geometry deleted" signal and must keep flowing through to the app.

## Deploy / release flow

Deployment is git-based and driven by the `deploy` skill (`/deploy`): refresh `CLAUDE.md` (via
`/init`) and a folder-structured `README.md`, then commit everything, push the current branch, merge
into `main` if not already there, and push `main`. Pushing to `main` is pre-authorized by
`.claude/settings.json` (`Bash(git push origin main:*)`); force-push and `--no-verify` are never used
without explicit approval. Publishing an extension (upload → publish → release the revision) is a
manual step performed by the user in the ODC Portal; JavaScript assets are copied into ODC Studio by
hand.

## Notes

- Windows host: the filesystem is case-insensitive (`README.md` == `readme.md`).
- Build artifacts (`bin/`, `obj/`, `.vs/`) are git-ignored via the root `.gitignore`. The committed
  upload `<Project>.zip` in each extension folder is intentionally tracked (it is the release
  artifact) and is not ignored.
