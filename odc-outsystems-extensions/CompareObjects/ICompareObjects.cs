using System.Collections.Generic;
using OutSystems.ExternalLibraries.SDK;

namespace CompareObjects;

/// <summary>
/// A single property-level difference between the source and target objects.
/// Decorated with <see cref="OSStructureAttribute"/> so ODC exposes it as a
/// Structure; the <see cref="ICompareObjects.Compare"/> action then returns a
/// typed List of these instead of a JSON string.
/// </summary>
[OSStructure(Description = "One entry in the comparison result, describing a single property (by name) and how its value differs between the source and target objects. The Compare action returns one of these per compared property.")]
public struct PropertyDifference
{
    [OSStructureField(Description = "Name of the property being compared (the JSON key), for example \"Id\" or \"Name\". Property names are reported exactly as they appear in the source object (or the target object, for target-only properties in symmetric mode).")]
    public string Key;

    [OSStructureField(Description = "The property's value in the SOURCE object, rendered as text. Scalars keep their raw form (the string \"Alice\" is reported as Alice, not \"Alice\"); nested objects and arrays are rendered as compact single-line JSON. Empty text when the property does not exist in the source object or its value is JSON null.")]
    public string ValueOld;

    [OSStructureField(Description = "The property's value in the TARGET object, rendered as text using the same rules as ValueOld. Empty text when the property does not exist in the target object or its value is JSON null.")]
    public string ValueNew;

    [OSStructureField(Description = "True when the source and target values for this property are deeply equal (same structure and same values, including nested objects and arrays); False when they differ, or when the property exists on only one side. Use this to filter the list down to the properties that actually changed.")]
    public bool IsEqual;
}

/// <summary>
/// External Library entry point. Exposes JSON object comparison logic
/// migrated from the OutSystems 11 "CompareObjs" extension.
/// </summary>
[OSInterface(
    Name = "CompareObjects",
    Description = "Compares two JSON objects and reports the per-property differences.")]
public interface ICompareObjects
{
    /// <summary>
    /// Compares a source and a target JSON object, property by property.
    /// </summary>
    /// <param name="sourceJObject">Source JSON object, as a string.</param>
    /// <param name="targetJObject">Target JSON object, as a string.</param>
    /// <param name="symmetric">
    /// When <c>False</c> (the default) only the source object's properties are
    /// compared, in source order — matching the original OutSystems 11 behavior.
    /// When <c>True</c> the diff covers the union of keys, so properties present
    /// only in the target are also reported (with an empty old value).
    /// </param>
    /// <param name="fieldsToIgnore">
    /// A comma-separated list of property names to skip when comparing
    /// (for example <c>"createdby,updatedby"</c>). Matching is case-insensitive
    /// and surrounding whitespace is trimmed. Any listed property is excluded
    /// from the result entirely, on both the source and target objects.
    /// </param>
    /// <returns>
    /// A list where each entry holds the property Key, its old value, its new
    /// value, and whether both values are equal. When the two objects are deeply
    /// equal, an empty list is returned.
    /// </returns>
    [OSAction(
        Description = "Compares two JSON objects property by property and returns one entry per compared property, each with the property name, its value in the source object, its value in the target object, and whether the two values are equal. Use it to detect what changed between two versions of a record. Both inputs must be JSON objects (not arrays or scalars); an empty, whitespace, or null input is treated as an empty object.",
        ReturnName = "Differences",
        ReturnDescription = "List of PropertyDifference records, one per compared property (Key, ValueOld, ValueNew, IsEqual). Returned in source-property order, followed by target-only properties when Symmetric is True. The list is EMPTY when the two objects are deeply equal (after any FieldsToIgnore are removed). To see only what changed, filter the list where IsEqual is False.")]
    List<PropertyDifference> Compare(
        [OSParameter(Description = "The SOURCE (original / \"old\") object to compare, as a JSON object string, e.g. {\"Id\":1,\"Name\":\"Alice\"}. Its properties drive the comparison and set the ValueOld of each result entry. An empty string, whitespace, or the literal null is treated as an empty object {}. Passing valid JSON that is not an object (an array or a scalar) raises an error.")]
        string sourceJObject,
        [OSParameter(Description = "The TARGET (new / \"updated\") object to compare against the source, as a JSON object string, e.g. {\"Id\":1,\"Name\":\"Bob\"}. It supplies the ValueNew of each result entry. An empty string, whitespace, or the literal null is treated as an empty object {}. Passing valid JSON that is not an object (an array or a scalar) raises an error.")]
        string targetJObject,
        [OSParameter(Description = "Controls which properties are compared. When False (default) only the source object's properties are compared, in source order — properties that exist only in the target are ignored (matches the original OutSystems 11 behavior). When True the comparison covers the union of both objects' properties, so properties added only in the target are also reported (with an empty ValueOld).")]
        bool symmetric,
        [OSParameter(Description = "Optional comma-separated list of property names to exclude from the comparison, e.g. \"createdby,updatedby\". Matching is CASE-INSENSITIVE and surrounding spaces are trimmed, so \" CreatedBy \" also matches createdby. Listed properties are skipped on both objects and never appear in the result, so differences in those fields do not affect the outcome. Leave empty (the default) to compare all properties.")]
        string fieldsToIgnore = "");
}
