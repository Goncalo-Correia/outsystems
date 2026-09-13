# EsriMapImage — v1.0.0

First release of the **EsriMapImage** ODC External Library, exposed in ODC Studio as
**`MapImage`**. Turns the `MapGeoJson` already stored by the `Esri_Maps` blocks into
the `Web_Map_as_JSON` payload the ArcGIS *Export Web Map* service needs
(OutSystems Developer Cloud, .NET 10).

Pure transformation: no network calls, no rendering. Fetching the image is the
ODC flow's job (see *Wiring it into ODC* below).

## Action

```
BuildWebMapJson(GeoJson : Text, BasemapUrl : Text) : WebMapJson (Text)
```

Reads a GeoJSON `FeatureCollection` of polygons (WGS84 lon/lat), collects every
ring, frames a padded Web Mercator extent matched to the output aspect ratio, and
returns the compact `Web_Map_as_JSON` document — or **empty text** when there is no
geometry to draw.

**Two inputs, and one of them is optional in practice.** Output size and padding
are fixed in the implementation — `800x600` at 96 dpi with 15% breathing room —
because nothing on the ODC side has a reason to vary them. Changing either is a
code change and a redeploy.

`BasemapUrl` stays an input precisely because it is the one that moves: ICNF is
likely to switch to their own ArcGIS service, and that should be a data change.
Keep it in `MapConfig` alongside `PrintServiceUrl`. It carries a C# default value,
which is what makes it an **optional** input in ODC Studio:

| Input | Behaviour |
| --- | --- |
| `BasemapUrl` omitted | Esri World Imagery `MapServer` |
| `BasemapUrl` blank (e.g. an unset site property) | same default; surrounding whitespace is trimmed |

## Highlights

- **Ring collection** — a `Polygon`'s `coordinates` *is* already Esri's `rings`
  (depth 3) and is passed through untouched; a `MultiPolygon` is one level deeper
  and is flattened to the same flat ring array. Both shapes occur in the stored
  data.
- **Vertices are never moved** — coordinates are deep-cloned, not recomputed, so
  the emitted rings are character-identical to the input.
- **Lenient input** — each feature's `geometry.coordinates` may be a JSON array
  **or** a JSON array encoded as a string (the shape the app stores). Quoted
  ordinates are parsed invariantly.
- **Mandatory extent, in Web Mercator** — `mapOptions.extent` is required; the
  service will not fit itself to the graphics. It is emitted in **Web Mercator
  metres** (`wkid 102100`, `latestWkid 3857`), padded, and then matched *exactly*
  to the output aspect ratio, so metres-per-pixel comes out identical on both axes.
  It stays centred on the geometry, and a 1 metre span floor keeps a degenerate
  single-vertex ring from dividing by zero.
- **The extent's spatial reference decides the render projection** — and that is
  why it is not WGS84. Hand the service `wkid 4326` and it draws equirectangular,
  giving a degree of longitude and a degree of latitude the same number of pixels;
  at latitude 40 every shape then comes out horizontally stretched by
  `1 / cos(40°) = 1.31`. That distortion belongs to the projection rather than to
  the framing, so no choice of WGS84 extent can undo it — scaling the horizontal
  span by `cos(latitude)` (the obvious fix) only corrects for a Mercator render
  that never happens. Web Mercator moves the latitude scaling into the projection
  and matches the basemap's own spatial reference.
- **Mixed spatial references are deliberate** — the extent is Web Mercator while
  the `featureSet` rings stay WGS84. Each Esri geometry carries its own
  `spatialReference`, so the service reprojects the rings itself and no vertex has
  to be recomputed here.
- **Matching styling** — the polygon symbol reproduces the map frame's own styling
  (fill `[198,0,0]` at 30% — alpha 77 on the 0–255 scale Esri uses — with a white
  outline), so the exported image matches what the user drew on screen.
- **Culture-proof numbers** — the payload is built with `JObject`, never string
  concatenation. A `pt-PT` server locale formats doubles as `-8,610`; Newtonsoft
  always writes numbers invariantly. This is the single most likely
  production-only failure mode in a library like this.

## Empty input is data, not an error

An empty return means *nothing to draw*, so the ODC flow branches on a string test
instead of catching exceptions. Exceptions are reserved for genuinely broken input.

| Input | Behaviour |
| --- | --- |
| Null or blank `GeoJson` | returns `""` — record with no drawing yet |
| `features: []` | returns `""` — the map's "geometry deleted" signal |
| `coordinates: ""` or `[]` | contributes no rings → `""` |
| Zero rings collected | returns `""` — zero rings errors the print service |
| `coordinates` already an array | accepted (tolerates non-ODC producers) |
| Not valid JSON | `ArgumentException` |
| No `features` key | `ArgumentException` |
| `Point` / `LineString` | `ArgumentException` — only polygons render as areas |
| Vertex that is not `[lon, lat]` | `ArgumentException` |
| Degenerate single-vertex ring | rendered, via the 1 metre span floor |

**`validGeoref` is not this library's job.** It sits at the root of the stored
payload and records whether the map accepted the drawing. Check it in the ODC flow
*before* calling this action — you generally do not want a stored image for a
drawing that failed validation.

## Wiring it into ODC

```
GenerateMapImage(GeoJsonBinary) : (Image : Binary Data, FileName : Text)

  1  BinaryToText(GeoJsonBinary)                    ->  geoJson
  2  If  validGeoref is false                       ->  return empty
  3  MapImage.BuildWebMapJson(geoJson, MapConfig.BasemapUrl)
  4  If  WebMapJson = ""                            ->  return empty  (no geometry)
  5  ArcGISPrint.ExportWebMap(
        f = "json", Format = "PNG32",
        Layout_Template = "MAP_ONLY",
        Web_Map_as_JSON = WebMapJson)
  6  If  Response.error <> NullObject()             ->  raise with error.details
  7  ArcGISPrint.DownloadImage(
        Response.results.Current.value.url)         ->  Binary Data
  8  FileName = "Mapa_" + FormatDateTime(CurrDateTime(), "dd-MM-yyyy_HH-mm") + ".png"
```

**Step 6 is not optional.** The print service returns HTTP 200 even on failure,
with the real status buried in an `error` object. ODC raises nothing, so without
this check a failed print reads as success and surfaces later as a null reference
with no useful trace.

Keep `PrintServiceUrl` and `BasemapUrl` in `MapConfig` beside the URLs already
there — ICNF will likely move to their own ArcGIS printing service, and config
makes that a data change rather than a redeploy.

**Generate on save and persist the bytes.** The `arcgisoutput` URLs live in a temp
directory Esri clears periodically, so a stored URL will 404 later — and a
declaration filed last year should render the same image it rendered when it was
filed.

## The request contract

The wire request is **form-urlencoded**, not JSON. One of its four fields
*contains* a JSON document as a percent-encoded value.

```
Content-Type: application/x-www-form-urlencoded

f=json&Format=PNG32&Layout_Template=MAP_ONLY&Web_Map_as_JSON=%7B%22mapOptions%22...
```

Sending the same content as a real JSON body with `Content-Type: application/json`
is rejected — the service replies with its HTML services-directory page.

| Field | Value | Notes |
| --- | --- | --- |
| `Web_Map_as_JSON` | the built JSON, URL-encoded | Required |
| `Format` | `PNG32` | Optional, but the default is `PDF` — must be passed |
| `Layout_Template` | `MAP_ONLY` | Optional; already the default |
| `f` | `json` | Required, else the response is HTML |

`Format` accepts `PDF`, `PNG32`, `PNG8`, `JPG`, `GIF`, `EPS`, `SVG`, `SVGZ`,
`AIX`, `TIFF`. `Layout_Template` accepts `MAP_ONLY` plus A3/A4/Letter ANSI
A/Tabloid ANSI B in landscape and portrait. With a page template,
`exportOptions.outputSize` is ignored and `layoutOptions` (title, legend, scale
bar) becomes available.

ODC response structure:

```
PrintResponse   results : List<PrintResult>, messages : List<Text>, error : PrintError
PrintResult     paramName : Text, dataType : Text, value : PrintValue
PrintValue      url : Text
PrintError      code : Integer, extendedCode : Long Integer,
                message : Text, details : List<Text>
```

## Notes

- The ODC-facing library name is **`MapImage`** (`[OSInterface(Name = "MapImage")]`),
  while the project, assembly and upload ZIP are **`EsriMapImage`** — matching the
  folder and this repo's `<Project>.zip` convention.
- The code is split by pipeline stage: `IWebMapBuilder.cs` is the ODC-facing
  contract, `WebMapBuilder.cs` applies the input fallbacks and diagnostics, and
  the three `internal` helpers do the work — `GeoJsonReader` (read),
  `MapExtent` (frame), `WebMapEnvelope` (emit). Only the interface and its
  implementation are public; ODC sees nothing else.
- No `[OSStructure]` is defined: the action returns plain Text, so its output drops
  straight into the `Web_Map_as_JSON` input of the REST method.
- The upload `EsriMapImage.zip` bundles the extension DLL and its runtime
  dependencies (Newtonsoft.Json, the logging abstractions). The OutSystems SDK is
  compile-time only and is provided by ODC at runtime.
- **ODC caps all inputs of one call at 5.5 MB.** `GeoJson` is text, so a very
  dense drawing is the only way to approach that — a two-parcel
  `FeatureCollection` runs around 1 KB. If it ever becomes a concern, the fix is
  to pass a URL and fetch the bytes in the library, not to split the call.
- If a future version renames the interface, the action or a parameter, set
  `OriginalName` on the attribute to the previous name so published consumers keep
  resolving. Nothing needs it yet — v1.0.0 has never been released, so the current
  two-parameter signature is the first anyone sees.
