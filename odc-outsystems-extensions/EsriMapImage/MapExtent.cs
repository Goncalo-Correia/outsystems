using System;
using Newtonsoft.Json.Linq;

namespace EsriMapImage;

/// <summary>
/// Frames the padded, aspect-matched extent that <c>mapOptions.extent</c>
/// requires, in Web Mercator metres.
/// </summary>
/// <remarks>
/// <para>
/// The extent is mandatory — the Export Web Map service will not fit itself to
/// the graphics, so an absent or empty <c>mapOptions</c> yields a useless image.
/// </para>
/// <para>
/// <b>It must be in Web Mercator, not WGS84.</b> The service renders the map in
/// the spatial reference of the extent it is given. Hand it <c>wkid 4326</c> and
/// it draws equirectangular, where a degree of longitude and a degree of latitude
/// get the same number of pixels — so at latitude 40 every shape comes out
/// horizontally stretched by <c>1 / cos(40°) = 1.31</c>. That distortion belongs
/// to the projection, not to the framing, so no choice of WGS84 extent can undo
/// it. Projecting the extent to Web Mercator moves the latitude scaling into the
/// projection, where it belongs, and matches the basemap's own spatial reference.
/// </para>
/// </remarks>
internal static class MapExtent
{
    /// <summary>WGS84 — the spatial reference of the input and of the emitted rings.</summary>
    internal const int Wgs84Wkid = 4326;

    /// <summary>
    /// Web Mercator, the spatial reference of the extent and therefore of the
    /// rendered map. Esri's own code for EPSG:3857.
    /// </summary>
    internal const int WebMercatorWkid = 102100;

    /// <summary>The EPSG code for the same projection, reported alongside.</summary>
    internal const int WebMercatorLatestWkid = 3857;

    /// <summary>Sphere radius used by Web Mercator, in metres.</summary>
    private const double EarthRadius = 6378137.0;

    /// <summary>
    /// Latitude clamp, in degrees. Web Mercator sends the poles to infinity.
    /// </summary>
    private const double MaximumLatitude = 89.99;

    /// <summary>
    /// Smallest extent span, in metres, considered before padding. Keeps a
    /// degenerate (single-vertex or zero-width) ring from producing a zero-sized
    /// extent and a divide-by-zero in the aspect match.
    /// </summary>
    private const double MinimumSpan = 1.0;

    /// <summary>
    /// Builds the extent enclosing every vertex of <paramref name="rings"/>, grown
    /// by <paramref name="padding"/> and then matched exactly to the
    /// <paramref name="width"/>:<paramref name="height"/> aspect ratio, so the
    /// service has no reason to letterbox or distort. The result stays centred on
    /// the geometry. No <c>cos(latitude)</c> term appears here — Web Mercator
    /// already accounts for it.
    /// </summary>
    internal static JObject Build(JArray rings, int width, int height, double padding)
    {
        double west = double.MaxValue, east = double.MinValue;
        double south = double.MaxValue, north = double.MinValue;

        foreach (JToken ringToken in rings)
        {
            foreach (JToken vertexToken in (JArray)ringToken)
            {
                (double longitude, double latitude) = GeoJsonReader.ReadVertex(vertexToken);
                if (longitude < west) west = longitude;
                if (longitude > east) east = longitude;
                if (latitude < south) south = latitude;
                if (latitude > north) north = latitude;
            }
        }

        // Web Mercator is monotonic in both axes, so projecting the corners is the
        // same as projecting every vertex and taking the bounds — two calls instead
        // of two per vertex.
        double xmin = ToMercatorX(west), xmax = ToMercatorX(east);
        double ymin = ToMercatorY(south), ymax = ToMercatorY(north);

        double centreX = (xmin + xmax) / 2.0;
        double centreY = (ymin + ymax) / 2.0;

        double spanX = Math.Max(xmax - xmin, MinimumSpan) * (1.0 + padding);
        double spanY = Math.Max(ymax - ymin, MinimumSpan) * (1.0 + padding);

        double target = (double)width / height;
        if (spanX / spanY > target)
        {
            spanY = spanX / target;
        }
        else
        {
            spanX = spanY * target;
        }

        return new JObject
        {
            ["xmin"] = centreX - spanX / 2.0,
            ["ymin"] = centreY - spanY / 2.0,
            ["xmax"] = centreX + spanX / 2.0,
            ["ymax"] = centreY + spanY / 2.0,
            ["spatialReference"] = new JObject
            {
                ["wkid"] = WebMercatorWkid,
                ["latestWkid"] = WebMercatorLatestWkid,
            },
        };
    }

    /// <summary>Projects a longitude to a Web Mercator easting, in metres.</summary>
    internal static double ToMercatorX(double longitude)
    {
        return EarthRadius * longitude * Math.PI / 180.0;
    }

    /// <summary>Projects a latitude to a Web Mercator northing, in metres.</summary>
    internal static double ToMercatorY(double latitude)
    {
        double clamped = Math.Max(Math.Min(latitude, MaximumLatitude), -MaximumLatitude);
        double radians = clamped * Math.PI / 180.0;
        return EarthRadius * Math.Log(Math.Tan(Math.PI / 4.0 + radians / 2.0));
    }
}
