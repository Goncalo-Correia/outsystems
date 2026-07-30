using OutSystems.ExternalLibraries.SDK;

namespace Shapefile;

/// <summary>
/// Result of a GeoJSON-to-shapefile conversion: the produced ZIP archive as
/// binary data, plus the name it should be saved under.
/// </summary>
[OSStructure(Description = "A generated shapefile package: the ZIP archive bytes and its file name.")]
public struct ShapefileResult
{
    [OSStructureField(Description = "The shapefile package as a ZIP archive (contains the .shp, .shx, .dbf and .prj members). Maps to Binary Data in ODC.")]
    public byte[] Content;

    [OSStructureField(Description = "The output file name, 'Shapefile_dd-MM-yyyy_HH-mm.zip' stamped with the conversion date and time (e.g. 'Shapefile_01-02-2026_16-50.zip').")]
    public string FileName;
}

/// <summary>
/// External Library entry point. Converts a GeoJSON <c>FeatureCollection</c>
/// (WGS84 lon/lat) into an ESRI shapefile package (ETRS89 / PT-TM06), zipped.
/// </summary>
[OSInterface(
    Name = "Shapefile",
    Description = "Converts a GeoJSON FeatureCollection into a zipped ESRI shapefile (.shp/.shx/.dbf/.prj), reprojecting from WGS84 to ETRS89 / PT-TM06.")]
public interface IShapefileConverter
{
    /// <summary>
    /// Converts a GeoJSON <c>FeatureCollection</c> of (multi)polygons into a
    /// zipped ESRI shapefile. The output ZIP is named
    /// <c>Shapefile_dd-MM-yyyy_HH-mm.zip</c>, stamped with the current date and
    /// time; its members share the same base name.
    /// </summary>
    /// <param name="geoJson">
    /// The GeoJSON <c>FeatureCollection</c> as text. Coordinates are WGS84
    /// (longitude/latitude, EPSG:4326). Each feature's <c>geometry.coordinates</c>
    /// may be either a JSON array or a JSON array encoded as a string.
    /// </param>
    /// <returns>The ZIP bytes and the output file name.</returns>
    [OSAction(
        Description = "Converts a GeoJSON FeatureCollection (WGS84) into a zipped ESRI shapefile reprojected to ETRS89 / PT-TM06 (EPSG:3763). The output is named Shapefile_dd-MM-yyyy_HH-mm.zip.",
        ReturnName = "Shapefile",
        ReturnDescription = "The zipped shapefile package (Content) and its file name (FileName).")]
    ShapefileResult ConvertToShapefile(
        [OSParameter(Description = "GeoJSON FeatureCollection as text, coordinates in WGS84 (EPSG:4326).")]
        string geoJson);
}
