# OutSystems Assets

A monorepo of OutSystems-related assets: ODC (OutSystems Developer Cloud) external libraries,
client-side JavaScript for ODC screens, and shareable Claude Code skills — with room for more kinds
of content over time.

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
| [`EsriMapImage/`](odc-outsystems-extensions/EsriMapImage/RELEASE_NOTES.md) | Turns the `MapGeoJson` stored by the `Esri_Maps` blocks into the `Web_Map_as_JSON` payload the ArcGIS *Export Web Map* service needs — ring collection, a padded aspect-corrected extent, and the Esri envelope. Exposed in ODC as `MapImage`. |
| [`Shapefile/`](odc-outsystems-extensions/Shapefile/RELEASE_NOTES.md) | Converts a GeoJSON `FeatureCollection` (WGS84) into a zipped ESRI shapefile (`.shp`/`.shx`/`.dbf`/`.prj`), reprojected to ETRS89 / PT-TM06 (EPSG:3763). |

Build, package, and publish instructions for these libraries live in `CLAUDE.md`.

## `javascript-libraries/`

Client-side scripts for ODC screens and blocks. Each file is the **body of a single client action**
pasted into ODC Studio — no build step, no bundler, no npm. Inputs come in as `$parameters.<Name>`;
results go back out through `$parameters.<Name>` for a plain transform, or through
`$actions.<Name>(...)` when the result arrives asynchronously. Each subfolder has its own
`README.md` with the parameters, wiring, and behaviour.

| Asset | What it does |
| --- | --- |
| [`csv/`](javascript-libraries/csv/README.md) | RFC 4180 conversion in both directions, each reporting *malformed* input through an `ErrorMessage` output while treating an empty file or a header-only template as an empty result. `csvToJson.js` turns a CSV string into a JSON array of objects for **JSON Deserialize** (delimiter sniffing, quoted fields, ragged rows); `jsonToCsv.js` writes a JSON array back out as CSV for download. |
| [`esri-map/`](javascript-libraries/esri-map/README.md) | Embeds the ICNF Esri map in an `<iframe>` and bridges it to the app over `postMessage`: sends map parameters, receives drawing results, and converts between Esri GeoJSON and the app's stored `MapGeoJson` shape. Two variants — `esri-map.js` (draw/edit/upload, posts results back) and `esri-map-readonly.js` (display-only). |
| [`input-scripts/`](javascript-libraries/input-scripts/README.md) | Scripts that constrain what a user can type into an Input widget. `input-phonenumber.js` restricts an input to an optional leading `+` followed by digits, salvaging the valid part of pasted text. |

## `skills/`

Shareable Claude Code skills for OutSystems work. These are copies kept in version control; to use
one, copy its folder into `~/.claude/skills/` (personal) or a project's `.claude/skills/`. The skills
that drive *this* repo's own workflows live in `.claude/skills/` instead (the two `odc-extension*`
skills live in both places and are kept identical).

| Skill | What it does |
| --- | --- |
| [`odc-extension/`](skills/odc-extension/SKILL.md) | Guide to building an ODC external library: `.csproj` setup, the SDK attributes, .NET ↔ OutSystems type mapping, logging, packaging, and the ODC Portal upload/publish/release lifecycle. |
| [`odc-extension-zip/`](skills/odc-extension-zip/SKILL.md) | Validates an ODC external library (clean Release build, tests, SDK-constraint review) and only then publishes and zips it into the upload `<Project>.zip`, verifying the ZIP is ODC-ready. |
| [`outsystems-mcp-implementation/`](skills/outsystems-mcp-implementation/SKILL.md) | "Implement US X": asks for the story's description, implementation plan and acceptance criteria, writes the story file, applies the plan through the Service Studio MCP, then shows a Yes/No form checking each plan step against the changed module and starts the merge right after it, so the form is answered while the merge is reviewed in Service Studio. Never publishes. |
| [`outsystems-mcp-code-review/`](skills/outsystems-mcp-code-review/SKILL.md) | Review gate for Service Studio MCP changes. Validates each acceptance criterion and lists every changed element in one inline Yes/No form with a reason box for each "No". Publishes only when everything is Yes and there are no validation errors; otherwise fixes the rejected items and shows the form again with the fixed rows in yellow. |
| [`outsystems-mcp-publish/`](skills/outsystems-mcp-publish/SKILL.md) | Publishes a module (`omlPublish`) after checking it is merged, reviewed and error-free, and records it: a `PUBLISHES.md` row and every applied `applyModelApiCode` lambda under `changes/<date>/` (written by the skill's own hook), plus a refreshed `snapshots/<Module>/`. Also refreshes snapshots on its own. |
| [`outsystems-mcp-repo-setup/`](skills/outsystems-mcp-repo-setup/SKILL.md) | Sets up (or upgrades) a git repository as the working home of an OutSystems 11 project developed through the Service Studio MCP. Scaffolds `CLAUDE.md`, README, architecture/conventions/decision docs, stories, `changes/`, `snapshots/`, publish and review logs, `.mcp.json` and permissions, then takes a first snapshot of the open module(s). Installs no hooks (those come from `outsystems-mcp-publish`). Safe to re-run: it never overwrites existing files. Needs Node 18+. |

## Deploy

This repo is released with the `deploy` skill (`/deploy`): it refreshes documentation (`CLAUDE.md`
via `/init`, and this `README.md`), then commits, pushes the working branch, merges into `main`, and
pushes `main`. Publishing an ODC extension itself (upload → publish → release the revision) is a
manual step performed in the ODC Portal; JavaScript assets are copied into ODC Studio by hand.
