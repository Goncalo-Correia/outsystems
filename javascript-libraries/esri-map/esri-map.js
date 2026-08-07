(function () {
  "use strict";

  /* ---- Static config ------------------------------------------------------ */

  var IFRAME_NAME = $parameters.ContainerId;
  var mapUrl = $parameters.MapConfig_MapiFrameUrl;

  // Only accept result messages coming from the map's own origin.
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

  // The map validates onlyDrawInOne{Freguesia,Concelho} at load time: a
  // non-empty value MUST be an HTTPS ".../query" URL, otherwise the frame
  // aborts with "URL Valida ... inválido". This returns the URL only when it
  // satisfies that contract, and "" (which disables the check) otherwise.
  function ensureQueryUrl(url) {
    var s = String(url || "").trim();
    return (/^https:\/\//i.test(s) && s.indexOf("/query") !== -1) ? s : "";
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

  /* ---- Drawing scope: how far a single drawing may span ------------------- */
  // The map enforces boundary containment via two parameters, each fed the
  // CAOP query URL used to look up the administrative unit under the drawing:
  //   onlyDrawInOneFreguesia -> confine the drawing to a single parish
  //   onlyDrawInOneConcelho  -> confine the drawing to a single municipality
  // An empty string on either one DISABLES that check.
  //
  // RestrictionTypeId selects the behaviour:
  //   1 = None         -> unrestricted: a drawing may cross parish AND
  //                       municipality boundaries.
  //   2 = Municipality -> confined to a single municipality (concelho).
  //   3 = Parish       -> confined to a single parish (freguesia).
  var RESTRICTION = { NONE: 1, MUNICIPALITY: 2, PARISH: 3 };

  // Coerce to a number; anything unrecognised falls back to None (unrestricted).
  var restrictionTypeId = Number($parameters.RestrictionTypeId);
  if (restrictionTypeId !== RESTRICTION.MUNICIPALITY &&
      restrictionTypeId !== RESTRICTION.PARISH) {
    restrictionTypeId = RESTRICTION.NONE;
  }

  var caopQueryUrl = ensureQueryUrl($parameters.MapConfig_CaopUrl);

  var restrictToMunicipality = (restrictionTypeId === RESTRICTION.MUNICIPALITY);
  var restrictToParish = (restrictionTypeId === RESTRICTION.PARISH);

  // A restriction can only be enforced with a valid CAOP /query URL. If one was
  // requested without it, fall back to unrestricted rather than aborting the map.
  if ((restrictToParish || restrictToMunicipality) && caopQueryUrl === "") {
    console.warn(
      "EsriMap: RestrictionTypeId " + restrictionTypeId + " requested but " +
      "MapConfig_CaopUrl is not a valid HTTPS /query URL; drawing left unrestricted."
    );
    restrictToParish = false;
    restrictToMunicipality = false;
  }

  var onlyDrawInOneFreguesia = restrictToParish ? caopQueryUrl : "";
  var onlyDrawInOneConcelho = restrictToMunicipality ? caopQueryUrl : "";

  /* ---- Parameters sent to the iframe -------------------------------------- */

  // Optional intersection layers: only enable the return when a URL is
  // supplied, so an empty config field simply disables the feature instead of
  // triggering the map's "URL obrigatório" validation error.
  var drcnfUrl = $parameters.MapConfig_DrcnfUrl || "";
  var baciasHidroUrl = $parameters.MapConfig_BaciasHidroUrl || "";

  var mapParameters = {
    zoomMapBegin: 7,
    areaAdmin: "C",
    staticMap: false,
    basemapMain: "hybrid",
    basemapSecond: "streets-navigation-vector",
    // GeoLocationJSON is a stored MapGeoJson string (coordinates as Text).
    // Convert it back to standard Esri GeoJSON before preloading.
    geojsonGeometries: toEsriGeometriesString($parameters.GeoLocationJSON),
    // entrada em graus (WGS84 ≡ ETRS89 geográfico)
    transformFromETRS89: false,
    editable: "true",
    singleGeometry: false,
    // Explicit: drawn geometries may NOT overlap each other (map default).
    // Note: this governs overlap BETWEEN drawn shapes, not administrative
    // boundary crossing — that is controlled by onlyDrawInOne* below.
    geomIntersects: false,
    drawGeometryTypes: $parameters.GeometryTypes,
    // Enable the "Adicionar Shapefile (ZIP)" upload button
    addShapefileButton: true,
    myLocation: true,
    drawPolygonMin: 50,
    returnAddress: true,
    returnCAOP: true,
    // Boundary containment driven by RestrictionTypeId (see above). returnCAOP
    // still reports every parish/municipality the drawing touches.
    onlyDrawInOneFreguesia: onlyDrawInOneFreguesia,
    onlyDrawInOneConcelho: onlyDrawInOneConcelho,
    canDrawAreaURL: $parameters.MapConfig_AreaValidationUrl,
    showLabelsGeoJSON: $parameters.MapConfig_LabelPointsUrl,
    caopURL: $parameters.MapConfig_CaopUrl,
    maxGeometries: "100",
    returnAreasProt: true,
    areasprotUrl: $parameters.MapConfig_ProtectedAreasUrl,
    // Enrich the result with forestry region (DRCNF) and watershed (bacia
    // hidrográfica) when the corresponding query URLs are configured. These
    // populate the result's `drcnf` / `bachidro` feature properties.
    returnDRCNF: drcnfUrl !== "",
    drcnfUrl: drcnfUrl,
    returnBACHIDRO: baciasHidroUrl !== "",
    baciashidroUrl: baciasHidroUrl,
    urlRests: JSON.stringify([
      restLayer(toLayerUrl($parameters.MapConfig_MunicipalityUrl), true),
      restLayer(toLayerUrl($parameters.MapConfig_ParishUrl), true),
      restLayer(toLayerUrl($parameters.MapConfig_ProtectedAreasUrl), false)
    ])
  };

  /* ---- Shared bridge (survives re-renders) -------------------------------- */

  var bridge = window.__esriMapBridge || (window.__esriMapBridge = {});

  // Register this map's entry. The result handler lives HERE, on the entry,
  // so the shared listener can dispatch to it no matter which block installed
  // the listener.
  bridge[IFRAME_NAME] = {
    params: mapParameters,
    allowedOrigin: ALLOWED_ORIGIN,
    onResult: function (data) {
      // `validGeoref` is the map's own verdict for the drawing (within allowed
      // area, single freguesia, etc.). It is a TOP-LEVEL field on the payload,
      // captured here — it is not part of the GeoJSON features.
      var valid = data.validGeoref === true;
      var raw = data.geojsonGeometries || "";

      // DELETE SIGNAL: when the user removes the last drawing via "Apagar", the
      // map posts an empty payload (geojsonGeometries = "", validGeoref = false).
      // We MUST forward it as an empty FeatureCollection so the downstream
      // OnUpdate_GeoJSON action can clear the derived fields (distrito, concelho,
      // freguesia, área). Deleting one of several drawings instead arrives as a
      // normal non-empty payload with the remaining features (handled below).
      if (raw === "") {
        emitResult({ type: "FeatureCollection", features: [] }, valid);
        return;
      }

      var geo;
      try {
        geo = JSON.parse(raw);
      } catch (err) {
        console.error("EsriMap: could not parse geojsonGeometries", err);
        emitResult({ type: "FeatureCollection", features: [] }, false);
        return;
      }

      // Only a real concern when a drawing actually exists. An emptied drawing
      // legitimately returns validGeoref=false with zero features, so don't
      // warn in that case (it is the expected delete outcome, not an error).
      if (!valid && geo.features && geo.features.length > 0) {
        console.warn("EsriMap: drawing returned with validGeoref = false.");
      }

      emitResult(geo, valid);
    }
  };

  /* ---- Emit: single exit point to OutSystems ------------------------------ */
  // Every result — a drawing, an edit, OR a delete (empty features) — leaves
  // through here, so the payload shape handed to OnUpdate_GeoJSON is always the
  // same MapGeoJson structure with a top-level `validGeoref`. An empty
  // `features` array is the unambiguous "no geometry" state.
  function emitResult(geo, valid) {
    var mapGeo = toMapGeoJson(geo);
    mapGeo.validGeoref = valid === true;
    $actions.OnUpdate_GeoJSON(JSON.stringify(mapGeo));
  }

  /* ---- Helpers: outbound (map -> MapGeoJson string) ----------------------- */
  // Reshape the raw Esri FeatureCollection into the MapGeoJson shape, storing
  // each geometry's coordinates as a JSON STRING (Text). This keeps the full
  // nesting intact for Polygon and MultiPolygon. An empty features array maps
  // to an empty features array (the delete case).
  function toMapGeoJson(geo) {
    return {
      type: (geo && geo.type) || "FeatureCollection",
      features: ((geo && geo.features) || []).map(function (f) {
        var g = f.geometry || {};
        return {
          type: f.type,
          geometry: {
            type: g.type,
            coordinates: JSON.stringify(g.coordinates == null ? [] : g.coordinates)
          },
          properties: f.properties || {}
        };
      })
    };
  }

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
