# OutSystems Assets

A monorepo of OutSystems-related assets: ODC (OutSystems Developer Cloud) external libraries,
client-side JavaScript for ODC screens, and reference datasets — with room for more kinds of content
over time.

Documentation below is organized by the repository's folder structure — one section per top-level
area. As new top-level folders are added, give each its own section here.

## `odc-outsystems-extensions/`

ODC **external libraries** — C#/.NET class libraries that expose server actions and structures to ODC
apps via `OutSystems.ExternalLibraries.SDK`. Each subfolder is an independent project with its own
`RELEASE_NOTES.md` (the authoritative reference for that library) and a committed upload
`<Project>.zip`.

| Extension | What it does |
| --- | --- |
| [`CompareObjects/`](odc-outsystems-extensions/CompareObjects/RELEASE_NOTES.md) | Compares two JSON objects property-by-property and returns a typed `List` of `PropertyDifference` (`Key`, `ValueOld`, `ValueNew`, `IsEqual`). Migrated from the OutSystems 11 `CompareObjs` extension. |
| [`Shapefile/`](odc-outsystems-extensions/Shapefile/RELEASE_NOTES.md) | Converts a GeoJSON `FeatureCollection` (WGS84) into a zipped ESRI shapefile (`.shp`/`.shx`/`.dbf`/`.prj`), reprojected to ETRS89 / PT-TM06 (EPSG:3763). |

Build, package, and publish instructions for these libraries live in `CLAUDE.md`.

## `javascript-libraries/`

Client-side scripts for ODC screens and blocks. Each file is the **body of a single client action**
pasted into ODC Studio — no build step, no bundler, no npm. Inputs come in as `$parameters.<Name>`
and results go out through `$actions.<Name>(...)`. Each subfolder has its own `README.md` with the
parameters, wiring, and behaviour.

| Asset | What it does |
| --- | --- |
| [`esri-map/`](javascript-libraries/esri-map/README.md) | Embeds the ICNF Esri map in an `<iframe>` and bridges it to the app over `postMessage`: sends map parameters, receives drawing results, and converts between Esri GeoJSON and the app's stored `MapGeoJson` shape. Two variants — `esri-map.js` (draw/edit/upload, posts results back) and `esri-map-readonly.js` (display-only). |
| [`input-scripts/`](javascript-libraries/input-scripts/README.md) | Scripts that constrain what a user can type into an Input widget. `input-phonenumber.js` restricts an input to an optional leading `+` followed by digits, salvaging the valid part of pasted text. |

## Reference data

Datasets kept as markdown tables, ready to load into ODC entities.

| Dataset | What it is |
| --- | --- |
| [`countries.md`](countries.md) | The 249 ISO 3166-1 countries and territories for a `Country` entity — `Id`, `Name`, numeric `Code`, `Alpha2Code`, `Alpha3Code`, `CountryTypeId`, alphabetical `Order`, `Is_Active` — with the intracommunity (EU-27) / extracommunity `CountryType` GUIDs documented alongside. |

## Deploy

This repo is released with the `deploy` skill (`/deploy`): it refreshes documentation (`CLAUDE.md`
via `/init`, and this `README.md`), then commits, pushes the working branch, merges into `main`, and
pushes `main`. Publishing an ODC extension itself (upload → publish → release the revision) is a
manual step performed in the ODC Portal; JavaScript assets are copied into ODC Studio by hand.
