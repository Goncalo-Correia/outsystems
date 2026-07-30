using NetTopologySuite.IO.Esri.Dbf.Fields;

namespace Shapefile;

/// <summary>
/// The fixed CAOP (Carta Administrativa Oficial de Portugal) attribute schema,
/// decoded byte-for-byte from the reference shapefile's <c>.dbf</c> header.
/// <para>
/// DBF field names are limited to 10 characters, so the GeoJSON property keys
/// <c>ListaCAOPIntersetada</c> and <c>localidade</c> map to the truncated field
/// names <c>ListaCAOP</c> and <c>localidad</c>. <c>area</c> and <c>length</c>
/// are numeric (N, width 18, 0 decimals); every other field is character (C).
/// The declaration order below is the exact field order in the reference file.
/// </para>
/// </summary>
internal static class CaopSchema
{
    /// <summary>A single column: source GeoJSON property key and its DBF field.</summary>
    internal readonly struct Column
    {
        /// <summary>The GeoJSON <c>properties</c> key this column reads from.</summary>
        public readonly string SourceKey;

        /// <summary>The DBF field (name, type and width) that receives the value.</summary>
        public readonly DbfField Field;

        /// <summary>True when the field is numeric and expects an integer value.</summary>
        public readonly bool Numeric;

        public Column(string sourceKey, DbfField field, bool numeric)
        {
            SourceKey = sourceKey;
            Field = field;
            Numeric = numeric;
        }
    }

    private static Column C(string sourceKey, string dbfName, int width)
        => new(sourceKey, new DbfCharacterField(dbfName, width), numeric: false);

    private static Column N(string sourceKey, string dbfName, int width)
        => new(sourceKey, new DbfNumericInt64Field(dbfName, width), numeric: true);

    /// <summary>
    /// Builds a fresh set of columns (and therefore fresh <see cref="DbfField"/>
    /// instances) for a single conversion. The field objects are stateful — the
    /// writer reads their <c>Value</c> on each record — so they must not be shared
    /// across conversions.
    /// </summary>
    public static Column[] Build() => new[]
    {
        C("id",                    "id",        20),
        C("type",                  "type",      20),
        N("area",                  "area",      18),
        N("length",                "length",    18),
        C("dicofre",               "dicofre",   10),
        C("distrito",              "distrito",  50),
        C("concelho",              "concelho",  50),
        C("freguesia",             "freguesia", 60),
        C("nuts3",                 "nuts3",     50),
        C("nuts2cod",              "nuts2cod",  10),
        C("nuts2",                 "nuts2",     50),
        C("nuts1cod",              "nuts1cod",  10),
        C("ListaCAOPIntersetada",  "ListaCAOP", 254),
        C("nuts1",                 "nuts1",     50),
        C("localidade",            "localidad", 60),
    };
}
