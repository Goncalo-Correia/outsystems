# EsriMapImage — Build Plan

An ODC External Library that turns the `MapGeoJson` already stored by the `Esri_Maps` blocks into
the `Web_Map_as_JSON` payload the ArcGIS *Export Web Map* service needs. Pure transformation — no
network, no rendering.

| | |
| --- | --- |
| **Location** | `odc-outsystems-extensions/EsriMapImage/` |
| **Target** | `net10.0` |
| **Dependencies** | Newtonsoft.Json 13.0.4 · OutSystems SDK 1.5.0 (compile-only) |
| **Input** | `MapGeoJson` (Text) |
| **Output** | `Web_Map_as_JSON` (Text) |
| **Consumed by** | `ArcGISPrint` REST → `ExportWebMap` |

## Scope

**In scope**

- Parse the GeoJSON `FeatureCollection`
- Unwrap `coordinates` from its JSON string
- Flatten `MultiPolygon` to a flat ring array
- Compute a padded, aspect-corrected extent
- Emit the Esri web-map envelope

## 1. Scaffold the project

`odc-outsystems-extensions/EsriMapImage/EsriMapImage.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>disable</Nullable>
    <CopyLocalLockFileAssemblies>true</CopyLocalLockFileAssemblies>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.4" />
    <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="9.0.0" />
    <PackageReference Include="OutSystems.ExternalLibraries.SDK" Version="1.5.0">
      <PrivateAssets>all</PrivateAssets>
      <ExcludeAssets>runtime</ExcludeAssets>
    </PackageReference>
  </ItemGroup>

</Project>
```

Four files, mirroring the two existing extensions:

| File | Contents |
| --- | --- |
| `MapImage.csproj` | Above |
| `IWebMapBuilder.cs` | The `[OSInterface]` and its action |
| `WebMapBuilder.cs` | Implementation |
| `RELEASE_NOTES.md` | Per-asset docs, as the repo requires |

---

## 2. Define the public surface

No `[OSStructure]` is needed — the action returns plain Text, so the output drops straight into the
`Web_Map_as_JSON` input of the REST method.

```csharp
[OSInterface(
    Name = "MapImage",
    Description = "Converts a stored MapGeoJson FeatureCollection into the "
                + "Esri Web_Map_as_JSON payload for the ArcGIS Export Web Map service.")]
public interface IWebMapBuilder
{
    [OSAction(
        Description = "Builds the Web_Map_as_JSON string for a GeoJSON FeatureCollection. "
                    + "Returns empty text when there is no geometry to draw.",
        ReturnName = "WebMapJson",
        ReturnDescription = "Compact Web_Map_as_JSON, or empty text if there are no rings.")]
    string BuildWebMapJson(
        [OSParameter(Description = "MapGeoJson FeatureCollection as text. Each geometry's "
            + "coordinates may be a JSON array or a JSON array encoded as a string.")]
        string geoJson,

        [OSParameter(Description = "Output width in pixels. 0 or less falls back to 800.")]
        int width,

        [OSParameter(Description = "Output height in pixels. 0 or less falls back to 600.")]
        int height,

        [OSParameter(Description = "Breathing room around the geometry as a fraction, "
            + "e.g. 0.15 for 15%. Negative values fall back to 0.15.")]
        decimal paddingPercent,

        [OSParameter(Description = "Basemap MapServer URL. Empty falls back to Esri World Imagery.")]
        string basemapUrl);
}
```

> **ODC ignores C# default parameter values.** Every parameter appears as a required input in ODC
> Studio, so handle fallbacks inside the method with sentinels (`width <= 0`, blank `basemapUrl`)
> rather than `= 800` in the signature.

---

## 3. Implement the transformation

Four steps: read, collect, frame, emit.

### Collect the rings

A `Polygon`'s `coordinates` is *already* Esri's `rings` — depth 3, no restructuring. A
`MultiPolygon` is one level deeper and must be flattened. Both types appear in the data, so both
branches are required.

```csharp
private static JArray CollectRings(JObject root)
{
    if (root["features"] is not JArray features)
        throw new ArgumentException("GeoJSON has no 'features' array; expected a FeatureCollection.");

    var rings = new JArray();

    foreach (JToken token in features)
    {
        if (token is not JObject feature) continue;
        if (feature["geometry"] is not JObject geometry) continue;

        string type = (string)geometry["type"];
        JArray coords = ReadCoordinates(geometry["coordinates"]);

        switch (type)
        {
            case "Polygon":                       // coordinates IS rings
                foreach (JToken ring in coords)
                    rings.Add(ring.DeepClone());
                break;

            case "MultiPolygon":                  // flatten one level
                foreach (JToken polygon in coords)
                    foreach (JToken ring in (JArray)polygon)
                        rings.Add(ring.DeepClone());
                break;

            default:
                throw new ArgumentException(
                    $"Unsupported geometry type '{type}'. Only Polygon and MultiPolygon are supported.");
        }
    }

    return rings;
}
```

### Unwrap the coordinates string

Lift this straight from `ShapefileConverter.ReadCoordinates` — same input quirk, same fix.

```csharp
private static JArray ReadCoordinates(JToken token)
{
    if (token is null)
        throw new ArgumentException("Geometry is missing 'coordinates'.");

    if (token.Type == JTokenType.String)
    {
        string raw = (string)token;
        return string.IsNullOrWhiteSpace(raw) ? new JArray() : JArray.Parse(raw);
    }

    if (token is JArray array) return array;

    throw new ArgumentException("'coordinates' is neither an array nor a JSON array string.");
}
```

### Frame the extent

`mapOptions.extent` is **mandatory** — the service will not fit to your graphics, confirmed by
testing both an absent and an empty `mapOptions`. Compute it in WGS84; the only subtlety is that a
degree of longitude covers less ground than a degree of latitude away from the equator, so scale by
`cos(latitude)` before matching the output aspect ratio.

```csharp
private static JObject BuildExtent(JArray rings, int width, int height, double padding)
{
    double xmin = double.MaxValue, xmax = double.MinValue;
    double ymin = double.MaxValue, ymax = double.MinValue;

    foreach (JToken ringToken in rings)
        foreach (JToken pointToken in (JArray)ringToken)
        {
            var p = (JArray)pointToken;
            double lon = (double)p[0], lat = (double)p[1];
            if (lon < xmin) xmin = lon;
            if (lon > xmax) xmax = lon;
            if (lat < ymin) ymin = lat;
            if (lat > ymax) ymax = lat;
        }

    double cx = (xmin + xmax) / 2.0;
    double cy = (ymin + ymax) / 2.0;
    double k  = Math.Cos(cy * Math.PI / 180.0);   // longitude compression at this latitude

    double w = Math.Max(xmax - xmin, 1e-6) * (1.0 + padding);
    double h = Math.Max(ymax - ymin, 1e-6) * (1.0 + padding);

    double target = (double)width / height;
    if ((w * k) / h > target) h = (w * k) / target;
    else                      w = (h * target) / k;

    return new JObject
    {
        ["xmin"] = cx - w / 2.0, ["ymin"] = cy - h / 2.0,
        ["xmax"] = cx + w / 2.0, ["ymax"] = cy + h / 2.0,
        ["spatialReference"] = new JObject { ["wkid"] = 4326 }
    };
}
```

### Emit the envelope

The polygon symbol reproduces the map's own styling from the frame's `global.js` — fill `[198,0,0]`
at 30% (alpha 77 on the 0–255 scale Esri uses), white outline — so the generated image matches what
the user drew on screen.

```csharp
var webMap = new JObject
{
    ["mapOptions"] = new JObject { ["extent"] = extent },
    ["operationalLayers"] = new JArray { new JObject {
        ["id"] = "drawing",
        ["opacity"] = 1,
        ["featureCollection"] = new JObject {
            ["layers"] = new JArray { new JObject {
                ["layerDefinition"] = new JObject {
                    ["name"] = "polygonLayer",
                    ["geometryType"] = "esriGeometryPolygon" },
                ["featureSet"] = new JObject {
                    ["geometryType"] = "esriGeometryPolygon",
                    ["features"] = new JArray { new JObject {
                        ["geometry"] = new JObject {
                            ["rings"] = rings,
                            ["spatialReference"] = new JObject { ["wkid"] = 4326 } },
                        ["symbol"] = Symbol() } } } } } } } },
    ["baseMap"] = new JObject {
        ["title"] = "World Imagery",
        ["baseMapLayers"] = new JArray { new JObject { ["url"] = basemapUrl } } },
    ["exportOptions"] = new JObject {
        ["outputSize"] = new JArray { width, height },
        ["dpi"] = 96 }
};

return webMap.ToString(Formatting.None);
```

> **Build with `JObject`, never string concatenation.** A `pt-PT` server locale formats doubles as
> `-8,610`. Newtonsoft always writes numbers invariantly; hand-built strings would produce a payload
> the service rejects. This is the single most likely production-only failure in the library.

---

## 4. Edge cases

Follow the precedent set by commit `6bc3a3b`, "Treat empty CSV/JSON as data, not an error". An empty
return means *nothing to draw*, so the ODC flow branches on a string test instead of catching
exceptions. Reserve exceptions for genuinely broken input.

| Input | Behaviour | Why |
| --- | --- | --- |
| Null or blank `geoJson` | Return `""` | Record with no drawing yet |
| `features: []` | Return `""` | The map's documented "geometry deleted" signal |
| `coordinates: ""` | Contributes no rings | Same delete case, one level down |
| Rings collected, count 0 | Return `""` | Zero rings errors the print service |
| `coordinates` already an array | Accepted | Tolerates non-ODC producers |
| Not valid JSON | `ArgumentException` | Corrupt data must surface |
| No `features` key | `ArgumentException` | Not a FeatureCollection |
| `Point` / `LineString` | `ArgumentException` | Only polygons render as areas |
| Degenerate single-vertex ring | Rendered via the `1e-6` span floor | Prevents divide-by-zero |

> **`validGeoref` is not this library's job.** It sits at the root of the stored payload and records
> whether the map accepted the drawing. Check it in the ODC flow *before* calling the extension —
> you generally do not want a stored image for a drawing that failed validation.

---

## 5. Build and package

```bash
dotnet build -c Release
dotnet publish -c Release --no-self-contained
```

Zip the **contents** of `bin/Release/net10.0/publish/` so `MapImage.dll` sits at the ZIP root, name
it `MapImage.zip`, and commit it in the project folder alongside the two existing release artifacts.
Zipping the `publish` folder itself puts the assembly one level down and ODC rejects it.

Confirm `Newtonsoft.Json.dll` is present in the ZIP and `OutSystems.ExternalLibraries.SDK.dll` is
**absent** — ODC supplies the SDK at runtime, and shipping it causes a conflict.

---

## 6. Wire it into ODC

```
GenerateMapImage(GeoJsonBinary) : (Image : Binary Data, FileName : Text)

  1  BinaryToText(GeoJsonBinary)                    ->  geoJson
  2  If  validGeoref is false                       ->  return empty
  3  MapImage.BuildWebMapJson(geoJson, 800, 600,
                              0.15, MapConfig.BasemapUrl)
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

> **Step 6 is not optional.** The print service returns HTTP 200 even on failure, with the real
> status buried in an `error` object. ODC raises nothing, so without this check a failed print reads
> as success and surfaces later as a null reference with no useful trace.

Two configuration points, both belonging in `MapConfig` beside the nine URLs already there:
`PrintServiceUrl` and `BasemapUrl`. ICNF will likely move to their own ArcGIS printing service;
keeping both in config makes that a data change rather than a redeploy.

Finally, **generate on save and persist the bytes**. The `arcgisoutput` URLs live in a temp
directory Esri clears periodically, so a stored URL will 404 later — and a declaration filed last
year should render the same image it rendered when it was filed.

---

## Reference — the request contract

The wire request is **form-urlencoded**, not JSON. One of its four fields *contains* a JSON document
as a percent-encoded value.

```
Content-Type: application/x-www-form-urlencoded

f=json&Format=PNG32&Layout_Template=MAP_ONLY&Web_Map_as_JSON=%7B%22mapOptions%22...
```

Sending the same content as a real JSON body with `Content-Type: application/json` is rejected — the
service replies with its HTML services-directory page.

| Field | Value | Notes |
| --- | --- | --- |
| `Web_Map_as_JSON` | the built JSON, URL-encoded | Required |
| `Format` | `PNG32` | Optional, but the default is `PDF` — must be passed |
| `Layout_Template` | `MAP_ONLY` | Optional; already the default |
| `f` | `json` | Required, else the response is HTML |

`Format` accepts `PDF`, `PNG32`, `PNG8`, `JPG`, `GIF`, `EPS`, `SVG`, `SVGZ`, `AIX`, `TIFF`.
`Layout_Template` accepts `MAP_ONLY` plus A3/A4/Letter ANSI A/Tabloid ANSI B in landscape and
portrait. With a page template, `exportOptions.outputSize` is ignored and `layoutOptions`
(title, legend, scale bar) becomes available.

**Success response**

```json
{
  "results": [
    { "paramName": "Output_File", "dataType": "GPDataFile",
      "value": { "url": "https://utility.arcgisonline.com/.../….png" } }
  ],
  "messages": []
}
```

**Error response — note the HTTP status is still 200**

```json
{
  "error": {
    "code": 400,
    "extendedCode": -2147467261,
    "message": "Unable to complete operation.",
    "details": ["Error executing tool. Export Web Map Task : ERROR 000590: WebMap_as_JSON is empty. …"]
  }
}
```

ODC response structure:

```
PrintResponse   results : List<PrintResult>, messages : List<Text>, error : PrintError
PrintResult     paramName : Text, dataType : Text, value : PrintValue
PrintValue      url : Text
PrintError      code : Integer, extendedCode : Long Integer,
                message : Text, details : List<Text>
```

---

Endpoint behaviour, error shapes and the golden extent above were verified against the live ArcGIS
Export Web Map service.
