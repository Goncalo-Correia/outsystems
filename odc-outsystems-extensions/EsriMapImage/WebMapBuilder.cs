using System;
using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace EsriMapImage;

/// <summary>
/// Implementation of <see cref="IWebMapBuilder"/>. Must be a public class with a
/// public parameterless constructor so ODC can instantiate the External Library.
/// </summary>
/// <remarks>
/// Deliberately thin: it applies the input fallbacks, wires up diagnostics, and
/// hands the actual work to <see cref="GeoJsonReader"/> (read),
/// <see cref="MapExtent"/> (frame) and <see cref="WebMapEnvelope"/> (emit).
/// Stateless, as every ODC server-action call is an independent HTTPS request to
/// a possibly-reused execution context.
/// </remarks>
public class WebMapBuilder : IWebMapBuilder
{
    /// <summary>Export width, in pixels. Fixed: changing it is a redeploy.</summary>
    private const int OutputWidth = 800;

    /// <summary>Export height, in pixels. Fixed: changing it is a redeploy.</summary>
    private const int OutputHeight = 600;

    /// <summary>
    /// Breathing room around the geometry, as a fraction of its extent. Fixed:
    /// changing it is a redeploy.
    /// </summary>
    private const double Padding = 0.15;

    /// <summary>Basemap used when the caller passes blank text.</summary>
    private const string DefaultBasemapUrl =
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

    private readonly ILogger _logger;

    /// <summary>
    /// Parameterless constructor for local use and any host that instantiates the
    /// library without a logger; diagnostics are discarded via <see cref="NullLogger"/>.
    /// </summary>
    public WebMapBuilder() : this(NullLogger.Instance)
    {
    }

    /// <summary>
    /// Constructor used by ODC, which injects an <see cref="ILogger"/> for
    /// production diagnostics.
    /// </summary>
    public WebMapBuilder(ILogger logger)
    {
        _logger = logger ?? NullLogger.Instance;
    }

    /// <inheritdoc />
    public string BuildWebMapJson(string geoJson, string basemapUrl = "")
    {
        using Activity activity = Activity.Current?.Source.StartActivity("EsriMapImage.BuildWebMapJson");

        // A record whose drawing has not been made yet is data, not an error: the
        // caller branches on the empty string instead of catching an exception.
        if (string.IsNullOrWhiteSpace(geoJson))
        {
            _logger.LogInformation("No GeoJSON supplied; returning empty Web_Map_as_JSON.");
            return string.Empty;
        }

        // Omitted (via the parameter's default) or passed as blank text — an unset
        // site property — both mean "use the Esri World Imagery basemap".
        string basemap = string.IsNullOrWhiteSpace(basemapUrl) ? DefaultBasemapUrl : basemapUrl.Trim();

        activity?.SetTag("mapimage.basemap", basemap);

        try
        {
            JObject root = GeoJsonReader.ParseRoot(geoJson);
            JArray rings = GeoJsonReader.CollectRings(root);

            // Zero rings errors the print service, and an empty 'features' array is
            // the map's documented "geometry deleted" signal — so both mean
            // "nothing to draw" rather than "bad input".
            if (rings.Count == 0)
            {
                _logger.LogInformation("GeoJSON carries no rings; returning empty Web_Map_as_JSON.");
                return string.Empty;
            }

            JObject extent = MapExtent.Build(rings, OutputWidth, OutputHeight, Padding);
            string payload = WebMapEnvelope
                .Build(rings, extent, OutputWidth, OutputHeight, basemap)
                .ToString(Formatting.None);

            _logger.LogInformation(
                "Built Web_Map_as_JSON with {RingCount} ring(s) for a {Width}x{Height} export, {CharCount} character(s).",
                rings.Count, OutputWidth, OutputHeight, payload.Length);

            return payload;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to build Web_Map_as_JSON.");
            throw;
        }
    }
}
