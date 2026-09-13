using OutSystems.ExternalLibraries.SDK;

namespace EsriMapImage;

/// <summary>
/// External Library entry point. Turns the <c>MapGeoJson</c> stored by the
/// <c>Esri_Maps</c> blocks into the <c>Web_Map_as_JSON</c> payload the ArcGIS
/// <em>Export Web Map</em> service expects. Pure transformation: no network calls
/// and no rendering.
/// </summary>
[OSInterface(
    Name = "MapImage",
    Description = "Converts a stored MapGeoJson FeatureCollection into the Esri Web_Map_as_JSON payload for the ArcGIS Export Web Map service.")]
public interface IWebMapBuilder
{
    /// <summary>
    /// Builds the <c>Web_Map_as_JSON</c> string for a GeoJSON
    /// <c>FeatureCollection</c> of (multi)polygons.
    /// </summary>
    /// <remarks>
    /// Output size (800x600) and padding (15%) are fixed in the implementation;
    /// changing them is a code change and a redeploy. The basemap stays an input
    /// because it is the one that moves — ICNF is likely to switch to their own
    /// ArcGIS service — so keep it in <c>MapConfig</c> on the ODC side. Its C#
    /// default makes it an <em>optional</em> input in ODC Studio; blank or omitted,
    /// it falls back to Esri World Imagery.
    /// </remarks>
    /// <returns>
    /// The compact <c>Web_Map_as_JSON</c> document, or empty text when the input
    /// carries no geometry to draw.
    /// </returns>
    [OSAction(
        Description = "Builds the Web_Map_as_JSON string for a GeoJSON FeatureCollection, framed for an 800x600 export with 15% padding. Returns empty text when there is no geometry to draw.",
        ReturnName = "WebMapJson",
        ReturnDescription = "Compact Web_Map_as_JSON, or empty text if there are no rings.")]
    string BuildWebMapJson(
        [OSParameter(Description = "MapGeoJson FeatureCollection as text. Each geometry's coordinates may be a JSON array or a JSON array encoded as a string.")]
        string geoJson,

        // The default value is what makes this an optional input in ODC Studio.
        // The blank-text fallback in the implementation covers the case where a
        // caller passes an empty site property rather than omitting the argument.
        [OSParameter(Description = "Basemap MapServer URL. Optional: leave blank or omit to use Esri World Imagery.")]
        string basemapUrl = "");
}
