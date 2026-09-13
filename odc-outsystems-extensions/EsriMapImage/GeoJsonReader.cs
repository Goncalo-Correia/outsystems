using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace EsriMapImage;

/// <summary>
/// Reads the stored <c>MapGeoJson</c> document into the flat ring array Esri
/// expects. Input side of the transformation only: nothing here computes an
/// extent or emits a payload.
/// </summary>
/// <remarks>
/// Every rejection is an <see cref="ArgumentException"/> so that corrupt data
/// surfaces as bad input rather than as an <see cref="InvalidCastException"/>
/// from somewhere deeper in the pipeline.
/// </remarks>
internal static class GeoJsonReader
{
    /// <summary>Parses the document root, restating a JSON error as bad input.</summary>
    internal static JObject ParseRoot(string geoJson)
    {
        try
        {
            return JObject.Parse(geoJson);
        }
        catch (JsonException ex)
        {
            throw new ArgumentException("Input is not valid JSON.", nameof(geoJson), ex);
        }
    }

    /// <summary>
    /// Collects every ring of the <c>FeatureCollection</c> into one flat array. A
    /// Polygon's <c>coordinates</c> is already <c>rings</c> (depth 3); a
    /// MultiPolygon is one level deeper and gets flattened. Both shapes occur in
    /// the stored data.
    /// </summary>
    internal static JArray CollectRings(JObject root)
    {
        if (root["features"] is not JArray features)
        {
            throw new ArgumentException("GeoJSON has no 'features' array; expected a FeatureCollection.");
        }

        var rings = new JArray();

        foreach (JToken featureToken in features)
        {
            if (featureToken is not JObject feature)
            {
                continue;
            }

            if (feature["geometry"] is not JObject geometry)
            {
                continue;
            }

            string type = (string)geometry["type"];
            JArray coordinates = ReadCoordinates(geometry["coordinates"]);

            switch (type)
            {
                case "Polygon":
                    // coordinates IS rings.
                    AddRings(rings, coordinates);
                    break;

                case "MultiPolygon":
                    // One level deeper: flatten each polygon's rings into the same array.
                    foreach (JToken polygonToken in coordinates)
                    {
                        if (polygonToken is not JArray polygon)
                        {
                            throw new ArgumentException(
                                "MultiPolygon 'coordinates' member is not an array of rings.");
                        }

                        AddRings(rings, polygon);
                    }
                    break;

                default:
                    throw new ArgumentException(
                        $"Unsupported geometry type '{type}'. Only Polygon and MultiPolygon are supported.");
            }
        }

        return rings;
    }

    /// <summary>
    /// Reads a <c>[longitude, latitude]</c> pair. Anything else is corrupt input.
    /// </summary>
    internal static (double Longitude, double Latitude) ReadVertex(JToken token)
    {
        if (token is not JArray point || point.Count < 2)
        {
            throw new ArgumentException("Ring vertex is not a [longitude, latitude] pair.");
        }

        return (ReadOrdinate(point[0]), ReadOrdinate(point[1]));
    }

    /// <summary>
    /// Appends each ring of <paramref name="source"/> to <paramref name="rings"/>,
    /// skipping rings that hold no vertices (the geometry-deleted case, one level
    /// down). Vertices are deep-cloned, never recomputed — this transformation
    /// must not move a single coordinate.
    /// </summary>
    private static void AddRings(JArray rings, JArray source)
    {
        foreach (JToken ringToken in source)
        {
            if (ringToken is not JArray ring)
            {
                throw new ArgumentException("Polygon 'coordinates' member is not a ring array.");
            }

            if (ring.Count == 0)
            {
                continue;
            }

            rings.Add(ring.DeepClone());
        }
    }

    /// <summary>
    /// Normalizes the <c>coordinates</c> token into a <see cref="JArray"/>,
    /// re-parsing it when the producer encoded the array as a JSON string — the
    /// shape the app stores. Blank text means "no geometry" and yields no rings.
    /// </summary>
    private static JArray ReadCoordinates(JToken token)
    {
        if (token is null || token.Type == JTokenType.Null)
        {
            throw new ArgumentException("Geometry is missing 'coordinates'.");
        }

        if (token.Type == JTokenType.String)
        {
            string raw = (string)token;
            if (string.IsNullOrWhiteSpace(raw))
            {
                return new JArray();
            }

            try
            {
                return JArray.Parse(raw);
            }
            catch (JsonException ex)
            {
                throw new ArgumentException("Geometry 'coordinates' is not a valid JSON array string.", ex);
            }
        }

        if (token is JArray array)
        {
            return array;
        }

        throw new ArgumentException("Geometry 'coordinates' is neither an array nor a JSON array string.");
    }

    private static double ReadOrdinate(JToken token)
    {
        switch (token?.Type)
        {
            case JTokenType.Float:
            case JTokenType.Integer:
                return (double)token;

            case JTokenType.String:
                // Tolerate producers that quote the ordinates; parse invariantly so a
                // pt-PT host does not read "-7.408" as -7408.
                if (double.TryParse(
                        (string)token,
                        NumberStyles.Float,
                        CultureInfo.InvariantCulture,
                        out double parsed))
                {
                    return parsed;
                }
                break;
        }

        throw new ArgumentException("Ring vertex ordinate is not a number.");
    }
}
