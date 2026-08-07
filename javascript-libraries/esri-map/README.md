# Esri Map

Client-side integration that embeds the ICNF Esri map (an `<iframe>`) into ODC screens, exchanges parameters and drawing results with it over `postMessage`, and converts between the map's Esri GeoJSON and the app's stored `MapGeoJson` shape.

## Web blocks

The `Esri_Maps` module exposes two web blocks, each backed by one of the scripts in this folder:

### `EsriMap` — editable

Full drawing/editing experience: draw, edit, upload shapefiles, and post results back to the app.

- **Input parameters:** `MapGeo`, `RestrictionTypeId`, `GeometryTypes`
- **Data action:** `GetMapConfig` — supplies the map endpoint URLs (see [MapConfig](#mapconfig))
- **Client action:** `InitMap` — runs [esri-map.js](esri-map.js)
- **Client action / handler:** `OnUpdate_GeoJSON` — receives the map's result payload
- **Event:** `Event_OnGeometryUpdate` — raised when the drawing changes

### `EsriMap_ReadOnly` — display-only

Preloads and displays geometries; no drawing, editing, or result callback.

- **Input parameter:** `MapGeo`
- **Data action:** `GetMapConfig` — here only `MapiFrameUrl` is needed
- **Client action:** `InitMap` — runs [esri-map-readonly.js](esri-map-readonly.js)

### Initialization

In both blocks, `InitMap` is triggered on the **`OnAfterFetch`** of the `GetMapConfig` data action — so the script runs only once the map config URLs are available. Setting the iframe `src` then makes the map request its parameters back over `postMessage`.

## MapConfig

`GetMapConfig` returns the endpoint URLs the scripts pass through to the map via `$parameters.MapConfig_*`.

| Name | Description | URL |
| --- | --- | --- |
| MapiFrameUrl | URL of the Esri map HTML page loaded into the iframe. Also defines the trusted origin used to validate all postMessage communication between the app and the map. | [frame.html](https://sig.icnf.pt/esriMapRUBUSDEV/frame/frame.html) |
| AreaValidationUrl | ArcGIS query endpoint used by the map to validate whether a user-drawn area is allowed before accepting it. | [FeatureServer/1/query](https://services9.arcgis.com/yDJ0v2H03rmzNPRm/ArcGIS/rest/services/esriMapAreaDrawValidateWM/FeatureServer/1/query) |
| LabelPointsUrl | ArcGIS Geometry Server (labelPoints) endpoint the map uses to calculate where to place labels inside drawn polygons. | [GeometryServer/labelPoints](https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/labelPoints) |
| ProtectedAreasUrl | ArcGIS layer of protected areas (Áreas Protegidas). Rendered on the map and queried to return which protected areas overlap the user's drawing. | [rubusAP/FeatureServer/3/query](https://services9.arcgis.com/yDJ0v2H03rmzNPRm/arcgis/rest/services/rubusAP/FeatureServer/3/query) |
| CaopUrl | CAOP administrative-boundaries endpoint. Used to return the drawing's official administrative location and to restrict drawing to a single parish (freguesia). | [esriMapCAOPWM/FeatureServer/1/query](https://services9.arcgis.com/yDJ0v2H03rmzNPRm/arcgis/rest/services/esriMapCAOPWM/FeatureServer/1/query) |
| MunicipalityUrl | ArcGIS layer of municipalities (concelhos), rendered on the map and clipped to mainland Portugal's extent. | [esriMapCAOPWM/FeatureServer/0/](https://services9.arcgis.com/yDJ0v2H03rmzNPRm/arcgis/rest/services/esriMapCAOPWM/FeatureServer/0/) |
| ParishUrl | ArcGIS layer of parishes (freguesias), rendered on the map and clipped to mainland Portugal's extent. | [esriMapCAOPWM/FeatureServer/1/](https://services9.arcgis.com/yDJ0v2H03rmzNPRm/arcgis/rest/services/esriMapCAOPWM/FeatureServer/1/) |
| DrcnfUrl | ArcGIS query endpoint for the DRCNF forestry-region layer. When set, the drawing's regional forestry department (DRCNF) is returned in the result. Optional; must be an HTTPS /query URL. | [DRCNF/FeatureServer/1/query](https://services9.arcgis.com/yDJ0v2H03rmzNPRm/arcgis/rest/services/DRCNF/FeatureServer/1/query) |
| BaciasHidroUrl | ArcGIS query endpoint for the hydrographic-basins (watershed) layer. When set, the drawing's watershed is returned in the result. Optional; must be an HTTPS /query URL. | [BaciasHidrograficas/FeatureServer/0/query](https://services9.arcgis.com/yDJ0v2H03rmzNPRm/arcgis/rest/services/BaciasHidrograficas/FeatureServer/0/query) |
