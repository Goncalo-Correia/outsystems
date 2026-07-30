# OutSystems Assets

A monorepo of OutSystems-related assets. It currently holds ODC (OutSystems Developer Cloud) external libraries and a standalone front-end asset, and is intended to grow to include other kinds of content (JavaScript, docs, and more) over time.

Documentation below is organized by the repository's folder structure — one section per top-level area. As new top-level folders are added, give each its own section here.

## `odc-outsystems-extensions/`

ODC **external libraries** — C#/.NET class libraries that expose server actions and structures to ODC apps via `OutSystems.ExternalLibraries.SDK`. Each subfolder is an independent project with its own `RELEASE_NOTES.md` (the authoritative reference for that library) and a committed upload `<Project>.zip`.

| Extension | What it does |
| --- | --- |
| [`CompareObjects/`](odc-outsystems-extensions/CompareObjects/RELEASE_NOTES.md) | Compares two JSON objects property-by-property and returns a typed `List` of `PropertyDifference` (`Key`, `ValueOld`, `ValueNew`, `IsEqual`). Migrated from the OutSystems 11 `CompareObjs` extension. |
| [`Shapefile/`](odc-outsystems-extensions/Shapefile/RELEASE_NOTES.md) | Converts a GeoJSON `FeatureCollection` (WGS84) into a zipped ESRI shapefile (`.shp`/`.shx`/`.dbf`/`.prj`), reprojected to ETRS89 / PT-TM06 (EPSG:3763). |

Build, package, and publish instructions for these libraries live in `CLAUDE.md` and in the `odc-extension` / `odc-extension-zip` skills.

### Front-end assets

- [`CompareObjects/tradovate-ny-atr-levels/`](odc-outsystems-extensions/CompareObjects/tradovate-ny-atr-levels/README.md) — **NY Session ATR Levels**, a Tradovate custom indicator (`nySessionAtrLevels.js`). A standalone browser/JS asset, unrelated to the C# library it currently nests under; see its own README for install and parameters.

## Deploy

This repo is released with the `deploy` skill (`/deploy`): it refreshes documentation (`CLAUDE.md` via `/init`, and this `README.md`), then commits, pushes the working branch, merges into `main`, and pushes `main`. Publishing an ODC extension itself (upload → publish → release the revision) is a manual step performed in the ODC Portal.
