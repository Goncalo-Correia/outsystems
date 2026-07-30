# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of OutSystems assets. Today it holds **ODC (OutSystems Developer Cloud) external libraries** — C#/.NET class libraries that expose server actions and structures to ODC apps via `OutSystems.ExternalLibraries.SDK`. It is expected to grow to include other kinds of assets (JavaScript, docs, etc.), so treat it as a multi-asset monorepo, not a single application.

## Layout

- `odc-outsystems-extensions/` — one folder per ODC external library, each an independent `.csproj`:
  - `CompareObjects/` — compares two JSON objects property-by-property, returns a typed `List<PropertyDifference>`. Migrated from the O11 `CompareObjs` extension.
  - `Shapefile/` — converts a GeoJSON `FeatureCollection` (WGS84) into a zipped ESRI shapefile reprojected to ETRS89 / PT-TM06 (EPSG:3763).
- `.claude/skills/deploy/` — the `deploy` skill (git-based release flow; see below).

Each extension carries its own `RELEASE_NOTES.md` (the authoritative per-library documentation) and a committed upload `<Project>.zip`.

## Building & packaging an ODC extension

Each extension is built and packaged independently from its own project folder. There is no root solution.

```bash
dotnet build -c Release           # verification gate
dotnet test -c Release            # runs unit tests if the project has any
dotnet publish -c Release --no-self-contained
```

The **upload ZIP is the contents of the publish output** (`bin/Release/net10.0/publish/`), zipped so the main assembly is at the ZIP root — named `<Project>.zip` and placed in the project folder. The `odc-extension` and `odc-extension-zip` skills own the authoritative build/validate/package procedure; defer to them for anything build- or ZIP-related rather than reinventing it.

Key `.csproj` conventions that make packaging correct — preserve them on any new extension:

- `TargetFramework` is `net10.0`, `ImplicitUsings` enabled, `Nullable` disabled.
- `CopyLocalLockFileAssemblies=true` so NuGet runtime dependencies land in the publish output and get packaged into the ZIP.
- The `OutSystems.ExternalLibraries.SDK` reference is **compile-time only** (`PrivateAssets=all`, `ExcludeAssets=runtime`) — ODC provides it at runtime, so it must never be copied to output or included in the ZIP.

## ODC external-library authoring model

The public surface of each library is a single decorated interface (`ICompareObjects`, `IShapefileConverter`) plus the structs it returns:

- `[OSInterface]` on the entry-point interface, `[OSAction]` on each exposed method, `[OSParameter]` on parameters — these become the ODC server action and its inputs.
- `[OSStructure]` / `[OSStructureField]` on returned structs — these become ODC Structures, so actions return typed lists/records instead of JSON strings.
- The `Description` text on these attributes is user-facing in ODC Studio; keep it precise and behavior-accurate (edge cases, null handling, ordering) — it is the contract app developers read.

## Deploy / release flow

Deployment is git-based and driven by the `deploy` skill (`/deploy`): refresh `CLAUDE.md` (via `/init`) and a folder-structured `README.md`, then commit everything, push the current branch, merge into `main` if not already there, and push `main`. Pushing to `main` is pre-authorized by `.claude/settings.json` (`Bash(git push origin main:*)`); force-push and `--no-verify` are never used without explicit approval. The actual publish of an extension (upload → publish → release the revision) is a manual step performed by the user in the ODC Portal.

## Notes

- Windows host: the filesystem is case-insensitive (`README.md` == `readme.md`).
- Build artifacts (`bin/`, `obj/`, `.vs/`) are git-ignored via the root `.gitignore`. The committed upload `<Project>.zip` in each extension folder is intentionally tracked (it is the release artifact) and is not ignored.
