using ProjNet.CoordinateSystems;
using ProjNet.CoordinateSystems.Transformations;

namespace Shapefile;

/// <summary>
/// Reprojects coordinates from WGS84 geographic (longitude/latitude, EPSG:4326)
/// to ETRS89 / Portugal TM06 (easting/northing in metres, EPSG:3763).
/// </summary>
internal sealed class Reprojector
{
    /// <summary>SRID written into the produced geometries.</summary>
    public const int TargetSrid = 3763;

    /// <summary>
    /// WKT for the PT-TM06 target CRS. Kept identical to the reference
    /// shapefile's <c>.prj</c> so the emitted <c>.prj</c> matches byte-for-byte.
    /// </summary>
    public const string TargetWkt =
        "PROJCS[\"ETRS_1989_Portugal_TM06\",GEOGCS[\"GCS_ETRS_1989\",DATUM[\"D_ETRS_1989\"," +
        "SPHEROID[\"GRS_1980\",6378137.0,298.257222101]],PRIMEM[\"Greenwich\",0.0]," +
        "UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Transverse_Mercator\"]," +
        "PARAMETER[\"False_Easting\",0.0],PARAMETER[\"False_Northing\",0.0]," +
        "PARAMETER[\"Central_Meridian\",-8.13310833333333],PARAMETER[\"Scale_Factor\",1.0]," +
        "PARAMETER[\"Latitude_Of_Origin\",39.6682583333333],UNIT[\"Meter\",1.0]]";

    private const string SourceWkt =
        "GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\"," +
        "SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0]," +
        "UNIT[\"Degree\",0.0174532925199433]]";

    private readonly MathTransform _transform;

    public Reprojector()
    {
        var csFactory = new CoordinateSystemFactory();
        var ctFactory = new CoordinateTransformationFactory();

        CoordinateSystem source = csFactory.CreateFromWkt(SourceWkt);
        CoordinateSystem target = csFactory.CreateFromWkt(TargetWkt);

        _transform = ctFactory.CreateFromCoordinateSystems(source, target).MathTransform;
    }

    /// <summary>
    /// Projects a single (longitude, latitude) pair to (easting, northing).
    /// </summary>
    public (double X, double Y) Project(double longitude, double latitude)
    {
        (double x, double y) = _transform.Transform(longitude, latitude);
        return (x, y);
    }
}
