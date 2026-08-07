(function () {
  "use strict";

  /* ---- Static config ------------------------------------------------------ */

  var IFRAME_NAME = $parameters.ContainerId;
  var mapUrl = $parameters.MapConfig_MapiFrameUrl;

  // Only accept messages coming from the map's own origin.
  var ALLOWED_ORIGIN = (function () {
    try { return new URL(mapUrl, window.location.href).origin; }
    catch (e) { return window.location.origin; }
  })();

  // Portugal bounding box (WGS84 / EPSG:4326) used to clip the CAOP layer so
  // the map only loads/queries features inside mainland Portugal.
  var PORTUGAL_EXTENT = {
    xmin: -13, ymin: 38, xmax: -2, ymax: 41, spatialReference: 4326
  };

  // A urlRests entry becomes an Esri FeatureLayer, which needs the base layer
  // URL (…/FeatureServer/3), NOT the /query operation. Strip a trailing
  // "/query" and any trailing slash so the layer instantiates correctly.
  function toLayerUrl(url) {
    return String(url || "").replace(/\/query\/?$/i, "").replace(/\/+$/, "");
  }

  // Build a urlRests entry with the full field set the map expects.
  function restLayer(url, withExtent) {
    var o = {
      url: url,
      identify: "false",
      identifytitle: "",
      identifyurl: "",
      identifytemplate: "",
      showpopup: "false",
      fieldreturn: "",
      fieldreturnmultiresults: "false",
      colfilter: "",
      idsfilter: "",
      idshighlight: ""
    };
    if (withExtent) { o.extentUrl = PORTUGAL_EXTENT; }
    return o;
  }

  /* ---- Parameters sent to the iframe (READ-ONLY) -------------------------- */
  // Display-only: geometries are preloaded and shown, but the map cannot draw,
  // edit, or return anything. No draw constraints (singleGeometry, geomIntersects,
  // drawPolygonMin, onlyDrawInOneFreguesia, maxGeometries) and no return* flags
  // are set — this bridge entry has no onResult handler, so any result the map
  // might post back would be dropped anyway.

  var mapParameters = {
    zoomMapBegin: 7,
    areaAdmin: "C",
    staticMap: false,               // keep pan/zoom; geometries are display-only
    basemapMain: "hybrid",
    basemapSecond: "streets-navigation-vector",
    // GeoLocationJSON is a stored MapGeoJson string (coordinates as Text).
    // Convert it back to standard Esri GeoJSON before preloading for display.
    geojsonGeometries: toEsriGeometriesString($parameters.GeoLocationJSON),
    // entrada em graus (WGS84 ≡ ETRS89 geográfico)
    transformFromETRS89: false,
    // no drawing or editing
    editable: "false",
    showLabelsGeoJSON: $parameters.MapConfig_LabelPointsUrl,
    caopURL: $parameters.MapConfig_CaopUrl,
    urlRests: JSON.stringify([
      restLayer(toLayerUrl($parameters.MapConfig_MunicipalityUrl), true),
      restLayer(toLayerUrl($parameters.MapConfig_ParishUrl), true),
      restLayer(toLayerUrl($parameters.MapConfig_ProtectedAreasUrl), false)
    ])
  };

  /* ---- Shared bridge (survives re-renders) -------------------------------- */

  var bridge = window.__esriMapBridge || (window.__esriMapBridge = {});

  // READ-ONLY entry: no onResult handler. This map never sends geometry back,
  // so the shared listener's result branch simply finds nothing to dispatch to.
  bridge[IFRAME_NAME] = {
    params: mapParameters,
    allowedOrigin: ALLOWED_ORIGIN
  };

  /* ---- Helpers: inbound (MapGeoJson string -> Esri GeoJSON string) --------- */
  // GeoLocationJSON comes in as a stored MapGeoJson string where each
  // geometry.coordinates is itself a JSON string. Parse those back into arrays
  // so the map receives standard Esri GeoJSON. Empty / already-standard /
  // non-JSON input is passed through untouched.
  function toEsriGeometriesString(input) {
    var s = String(input || "");
    if (s === "") return "";

    var obj;
    try { obj = JSON.parse(s); }
    catch (e) { return s; }

    if (!obj || !Array.isArray(obj.features)) return s;

    return JSON.stringify({
      type: obj.type || "FeatureCollection",
      features: obj.features.map(function (f) {
        var g = f.geometry || {};
        var coords = g.coordinates;
        // Coordinates stored as Text -> parse back to the nested array.
        if (typeof coords === "string") {
          try { coords = coords === "" ? [] : JSON.parse(coords); }
          catch (e) { coords = []; }
        }
        return {
          type: f.type || "Feature",
          geometry: { type: g.type, coordinates: coords },
          properties: f.properties || {}
        };
      })
    });
  }

  /* ---- Single global message listener (generic, version-agnostic) --------- */
  // This exact function lives in both the read and edit blocks. Whichever block
  // runs first installs it; it then serves BOTH maps by dispatching results to
  // each entry's own onResult handler (read-only entries simply have none).
  function onWindowMessage(event) {
    var data = event.data;
    if (data === undefined || data === null) return;

    // 1) Map asking the parent for its parameters.
    //    Payload is the string "esriMapRequestParentData" + <iframeName>.
    if (typeof data === "string") {
      var PREFIX = "esriMapRequestParentData";
      if (data.indexOf(PREFIX) !== 0) return;

      var requestedName = data.slice(PREFIX.length);
      var reqEntry = bridge[requestedName];
      if (!reqEntry || !event.source) return;
      if (event.origin !== reqEntry.allowedOrigin) return; // origin guard

      event.source.postMessage(reqEntry.params, reqEntry.allowedOrigin);
      return;
    }

    // 2) Map returning a result payload -> dispatch to that map's handler.
    //    A read-only entry has no onResult, so nothing happens (by design).
    if (data.iframeName && bridge[data.iframeName]) {
      var resEntry = bridge[data.iframeName];
      if (event.origin !== resEntry.allowedOrigin) return; // origin guard
      if (typeof resEntry.onResult === "function") resEntry.onResult(data);
    }
  }

  if (!bridge.__listenerAttached) {
    window.addEventListener("message", onWindowMessage, false);
    bridge.__listenerAttached = true;
  }

  /* ---- Kick off: setting src makes the iframe request its parameters ------ */

  var iframe = document.getElementById($parameters.ContainerId);
  if (iframe) {
    iframe.src = mapUrl;
  } else {
    console.warn("EsriMap: iframe '" + $parameters.ContainerId + "' not found.");
  }
})();
