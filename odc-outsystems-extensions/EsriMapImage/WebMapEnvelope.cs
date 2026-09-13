using Newtonsoft.Json.Linq;

namespace EsriMapImage;

/// <summary>
/// Assembles the Esri web-map envelope around the collected rings — the output
/// side of the transformation.
/// </summary>
/// <remarks>
/// Built with <see cref="JObject"/> rather than string concatenation on purpose:
/// Newtonsoft always writes numbers invariantly, whereas a hand-built string on a
/// <c>pt-PT</c> server would emit <c>-8,610</c> and the print service would
/// reject the request. That is the single most likely production-only failure
/// mode in this library.
/// </remarks>
internal static class WebMapEnvelope
{
    /// <summary>Title reported for the basemap layer in the emitted envelope.</summary>
    private const string BasemapTitle = "World Imagery";

    /// <summary>Export resolution; 96 dpi matches the on-screen map.</summary>
    private const int Dpi = 96;

    /// <summary>Builds the complete <c>Web_Map_as_JSON</c> document.</summary>
    internal static JObject Build(
        JArray rings,
        JObject extent,
        int width,
        int height,
        string basemapUrl)
    {
        return new JObject
        {
            ["mapOptions"] = new JObject { ["extent"] = extent },
            ["operationalLayers"] = new JArray
            {
                new JObject
                {
                    ["id"] = "drawing",
                    ["opacity"] = 1,
                    ["featureCollection"] = new JObject
                    {
                        ["layers"] = new JArray
                        {
                            new JObject
                            {
                                ["layerDefinition"] = new JObject
                                {
                                    ["name"] = "polygonLayer",
                                    ["geometryType"] = "esriGeometryPolygon",
                                },
                                ["featureSet"] = new JObject
                                {
                                    ["geometryType"] = "esriGeometryPolygon",
                                    ["features"] = new JArray
                                    {
                                        new JObject
                                        {
                                            ["geometry"] = new JObject
                                            {
                                                ["rings"] = rings,
                                                ["spatialReference"] = new JObject
                                                {
                                                    ["wkid"] = MapExtent.Wgs84Wkid,
                                                },
                                            },
                                            ["symbol"] = BuildSymbol(),
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            ["baseMap"] = new JObject
            {
                ["title"] = BasemapTitle,
                ["baseMapLayers"] = new JArray { new JObject { ["url"] = basemapUrl } },
            },
            ["exportOptions"] = new JObject
            {
                ["outputSize"] = new JArray { width, height },
                ["dpi"] = Dpi,
            },
        };
    }

    /// <summary>
    /// Reproduces the on-screen styling of the <c>Esri_Maps</c> frame — a red fill
    /// at 30% opacity (alpha 77 on the 0-255 scale Esri uses) with a white outline
    /// — so the exported image matches what the user drew.
    /// </summary>
    private static JObject BuildSymbol()
    {
        return new JObject
        {
            ["type"] = "esriSFS",
            ["style"] = "esriSFSSolid",
            ["color"] = new JArray { 198, 0, 0, 77 },
            ["outline"] = new JObject
            {
                ["type"] = "esriSLS",
                ["style"] = "esriSLSSolid",
                ["color"] = new JArray { 255, 255, 255, 255 },
                ["width"] = 2,
            },
        };
    }
}
