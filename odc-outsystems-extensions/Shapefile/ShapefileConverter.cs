using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO.Esri;
using NetTopologySuite.IO.Esri.Dbf.Fields;
using NetTopologySuite.IO.Esri.Shapefiles.Writers;
using EsriShapefile = NetTopologySuite.IO.Esri.Shapefile;

namespace Shapefile;

/// <summary>
/// Implementation of <see cref="IShapefileConverter"/>. Must be a public class
/// with a public parameterless constructor so ODC can instantiate the External
/// Library.
/// </summary>
public class ShapefileConverter : IShapefileConverter
{
    /// <summary>
    /// Prefix for the generated file name; the current date and time is appended
    /// as <c>_dd-MM-yyyy_HH-mm</c> (e.g. <c>Shapefile_01-02-2026_16-50</c>).
    /// </summary>
    private const string FileNamePrefix = "Shapefile";

    /// <summary>Date/time format used to stamp the output file name.</summary>
    private const string TimeStampFormat = "dd-MM-yyyy_HH-mm";

    private readonly ILogger _logger;

    /// <summary>
    /// Parameterless constructor for local use and any host that instantiates the
    /// library without a logger; diagnostics are discarded via <see cref="NullLogger"/>.
    /// </summary>
    public ShapefileConverter() : this(NullLogger.Instance)
    {
    }

    /// <summary>
    /// Constructor used by ODC, which injects an <see cref="ILogger"/> for
    /// production diagnostics.
    /// </summary>
    public ShapefileConverter(ILogger logger)
    {
        _logger = logger ?? NullLogger.Instance;
    }

    /// <inheritdoc />
    public ShapefileResult ConvertToShapefile(string geoJson)
    {
        using Activity activity = Activity.Current?.Source.StartActivity("Shapefile.ConvertToShapefile");

        string baseName = FileNamePrefix + "_" + DateTime.Now.ToString(TimeStampFormat, CultureInfo.InvariantCulture);
        activity?.SetTag("shapefile.base_name", baseName);

        if (string.IsNullOrWhiteSpace(geoJson))
        {
            throw new ArgumentException("GeoJSON input is empty.", nameof(geoJson));
        }

        try
        {
            _logger.LogInformation("Converting GeoJSON to shapefile '{BaseName}'.", baseName);

            JObject root = ParseRoot(geoJson);
            List<Feature> features = ReadFeatures(root);

            byte[] zip = BuildZip(baseName, features);

            _logger.LogInformation(
                "Produced shapefile package '{BaseName}.zip' with {FeatureCount} feature(s), {ByteCount} bytes.",
                baseName, features.Count, zip.Length);

            return new ShapefileResult
            {
                Content = zip,
                FileName = baseName + ".zip",
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to convert GeoJSON to shapefile '{BaseName}'.", baseName);
            throw;
        }
    }

    /// <summary>A parsed feature: its geometry (reprojected) and raw properties.</summary>
    private readonly struct Feature
    {
        public readonly Geometry Geometry;
        public readonly JObject Properties;

        public Feature(Geometry geometry, JObject properties)
        {
            Geometry = geometry;
            Properties = properties;
        }
    }

    private static JObject ParseRoot(string geoJson)
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
    /// Reads every feature of the GeoJSON <c>FeatureCollection</c>, reprojecting
    /// each geometry from WGS84 to PT-TM06. Non-polygonal geometries are rejected.
    /// </summary>
    private static List<Feature> ReadFeatures(JObject root)
    {
        if (root["features"] is not JArray featureArray)
        {
            throw new ArgumentException("GeoJSON has no 'features' array; expected a FeatureCollection.");
        }

        var reprojector = new Reprojector();
        var factory = new GeometryFactory(new PrecisionModel(), Reprojector.TargetSrid);
        var features = new List<Feature>(featureArray.Count);

        foreach (JToken featureToken in featureArray)
        {
            if (featureToken is not JObject feature)
            {
                continue;
            }

            if (feature["geometry"] is not JObject geometry)
            {
                continue;
            }

            Geometry projected = BuildGeometry(geometry, reprojector, factory);
            var properties = feature["properties"] as JObject ?? new JObject();
            features.Add(new Feature(projected, properties));
        }

        if (features.Count == 0)
        {
            throw new ArgumentException("GeoJSON contains no polygon features to convert.");
        }

        return features;
    }

    /// <summary>
    /// Builds a reprojected NTS geometry from a GeoJSON geometry object. Supports
    /// <c>Polygon</c> and <c>MultiPolygon</c>. The <c>coordinates</c> value may be
    /// a JSON array or a JSON array encoded as a string.
    /// </summary>
    private static Geometry BuildGeometry(JObject geometry, Reprojector reprojector, GeometryFactory factory)
    {
        string type = (string)geometry["type"];
        JArray coordinates = ReadCoordinates(geometry["coordinates"]);

        switch (type)
        {
            case "Polygon":
                return BuildPolygon(coordinates, reprojector, factory);

            case "MultiPolygon":
                var polygons = new Polygon[coordinates.Count];
                for (int i = 0; i < coordinates.Count; i++)
                {
                    polygons[i] = BuildPolygon((JArray)coordinates[i], reprojector, factory);
                }
                return factory.CreateMultiPolygon(polygons);

            default:
                throw new ArgumentException(
                    $"Unsupported geometry type '{type}'. Only Polygon and MultiPolygon are supported.");
        }
    }

    /// <summary>
    /// Normalizes the <c>coordinates</c> token into a <see cref="JArray"/>,
    /// re-parsing it when the producer encoded the array as a JSON string
    /// (as in the reference sample).
    /// </summary>
    private static JArray ReadCoordinates(JToken token)
    {
        if (token is null)
        {
            throw new ArgumentException("Geometry is missing 'coordinates'.");
        }

        if (token.Type == JTokenType.String)
        {
            token = JToken.Parse((string)token);
        }

        if (token is not JArray array)
        {
            throw new ArgumentException("Geometry 'coordinates' is not an array.");
        }

        return array;
    }

    /// <summary>
    /// Builds a single polygon. The first ring is the shell; any further rings are
    /// holes.
    /// </summary>
    private static Polygon BuildPolygon(JArray rings, Reprojector reprojector, GeometryFactory factory)
    {
        if (rings.Count == 0)
        {
            throw new ArgumentException("Polygon has no rings.");
        }

        LinearRing shell = BuildRing((JArray)rings[0], reprojector, factory);
        var holes = new LinearRing[rings.Count - 1];
        for (int i = 1; i < rings.Count; i++)
        {
            holes[i - 1] = BuildRing((JArray)rings[i], reprojector, factory);
        }

        return factory.CreatePolygon(shell, holes);
    }

    private static LinearRing BuildRing(JArray ring, Reprojector reprojector, GeometryFactory factory)
    {
        var coordinates = new Coordinate[ring.Count];
        for (int i = 0; i < ring.Count; i++)
        {
            var point = (JArray)ring[i];
            double longitude = (double)point[0];
            double latitude = (double)point[1];
            (double x, double y) = reprojector.Project(longitude, latitude);
            coordinates[i] = new Coordinate(x, y);
        }

        return factory.CreateLinearRing(coordinates);
    }

    /// <summary>
    /// Writes the four shapefile members to a temporary directory, then packs them
    /// into an in-memory ZIP, using <paramref name="baseName"/> for every member.
    /// </summary>
    private static byte[] BuildZip(string baseName, List<Feature> features)
    {
        string workDir = Path.Combine(Path.GetTempPath(), "odc-shp-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(workDir);
        try
        {
            WriteShapefile(Path.Combine(workDir, baseName + ".shp"), features);

            using var buffer = new MemoryStream();
            using (var archive = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
            {
                foreach (string ext in new[] { ".shp", ".shx", ".dbf", ".prj" })
                {
                    string path = Path.Combine(workDir, baseName + ext);
                    if (File.Exists(path))
                    {
                        archive.CreateEntryFromFile(path, baseName + ext);
                    }
                }
            }

            return buffer.ToArray();
        }
        finally
        {
            try { Directory.Delete(workDir, recursive: true); } catch { /* best-effort cleanup */ }
        }
    }

    /// <summary>
    /// Writes the shapefile (.shp/.shx/.dbf/.prj) with the fixed CAOP attribute
    /// schema and the PT-TM06 projection.
    /// </summary>
    private static void WriteShapefile(string shpPath, List<Feature> features)
    {
        CaopSchema.Column[] columns = CaopSchema.Build();
        var fields = new DbfField[columns.Length];
        for (int i = 0; i < columns.Length; i++)
        {
            fields[i] = columns[i].Field;
        }

        var options = new ShapefileWriterOptions(ShapeType.Polygon, fields)
        {
            Projection = Reprojector.TargetWkt,
        };

        using ShapefileWriter writer = EsriShapefile.OpenWrite(shpPath, options);
        foreach (Feature feature in features)
        {
            writer.Geometry = feature.Geometry;
            foreach (CaopSchema.Column column in columns)
            {
                column.Field.Value = ReadFieldValue(feature.Properties, column);
            }
            writer.Write();
        }
    }

    /// <summary>
    /// Extracts a column's value from a feature's properties, converting numeric
    /// columns to <see cref="long"/> and character columns to text.
    /// </summary>
    private static object ReadFieldValue(JObject properties, CaopSchema.Column column)
    {
        JToken token = properties[column.SourceKey];
        if (token is null || token.Type == JTokenType.Null)
        {
            return null;
        }

        if (!column.Numeric)
        {
            return token.ToString();
        }

        string raw = token.ToString();
        if (long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out long asLong))
        {
            return asLong;
        }
        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double asDouble))
        {
            return (long)Math.Round(asDouble, MidpointRounding.AwayFromZero);
        }
        return null;
    }
}
