# Shapefile — v1.0.0

First release of the **Shapefile** ODC External Library. Converts a GeoJSON
`FeatureCollection` into a zipped ESRI shapefile, reprojecting from WGS84 to
ETRS89 / Portugal TM06 (OutSystems Developer Cloud, .NET 10).

## Action

`ConvertToShapefile(GeoJson : Text) : Shapefile (ShapefileResult)`

Reads a GeoJSON `FeatureCollection` of polygons (WGS84 lon/lat), reprojects the
geometry to **ETRS89 / PT-TM06 (EPSG:3763)**, and returns a **`ShapefileResult`**
structure:

- `Content` (Binary Data) — a ZIP archive containing `<base name>.shp`, `.shx`,
  `.dbf` and `.prj`.
- `FileName` (Text) — `Shapefile_dd-MM-yyyy_HH-mm.zip`.

The output file name is generated from the current date and time in the format
`Shapefile_dd-MM-yyyy_HH-mm.zip` — for example, `Shapefile_01-02-2026_16-50.zip`.
Its shapefile members share that same base name.

## Highlights

- **Reprojection** — WGS84 (EPSG:4326) → ETRS89 / PT-TM06 (EPSG:3763), in metres,
  via ProjNET. Verified against the CAOP source: for the sample feature the
  polygon's computed area (77 873 m²) matches its recorded `area` attribute
  (77 865) to within 0.01%.
- **Exact CAOP schema** — the `.dbf` reproduces the reference attribute table
  byte-for-byte: 15 fields in order (`id`, `type`, `area`, `length`, `dicofre`,
  `distrito`, `concelho`, `freguesia`, `nuts3`, `nuts2cod`, `nuts2`, `nuts1cod`,
  `ListaCAOP`, `nuts1`, `localidad`), with `area`/`length` as Numeric (18,0) and
  the rest Character. DBF's 10-character name limit maps
  `ListaCAOPIntersetada` → `ListaCAOP` and `localidade` → `localidad`.
- **Matching `.prj`** — emits the exact `ETRS_1989_Portugal_TM06` WKT of the
  reference shapefile.
- **Geometry** — supports `Polygon` and `MultiPolygon`; a `MultiPolygon` becomes a
  single ESRI Polygon record with one part per ring. Ring orientation is
  normalized to the ESRI convention (outer rings clockwise, holes
  counter-clockwise).
- **Lenient input** — each feature's `geometry.coordinates` may be a JSON array
  **or** a JSON array encoded as a string (as in the reference sample).

## Notes

- Only polygonal geometries are supported; other geometry types raise an
  `ArgumentException`.
- The generated `.dbf` ends with the standard dBASE `0x1A` end-of-file marker
  (the reference sample omits it); this is spec-compliant and read by all GIS
  tools.
- The upload `Shapefile.zip` bundles the extension DLL and its runtime
  dependencies (NetTopologySuite, NetTopologySuite.IO.Esri, ProjNET,
  Newtonsoft.Json). The OutSystems SDK is compile-time only and is provided by
  ODC at runtime.
