using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CompareObjects;

/// <summary>
/// Implementation of <see cref="ICompareObjects"/>. Must be a public class with a
/// public parameterless constructor so ODC can instantiate the External Library.
/// </summary>
public class CompareObjects : ICompareObjects
{
    /// <inheritdoc />
    public List<PropertyDifference> Compare(string sourceJObject, string targetJObject, bool symmetric, string fieldsToIgnore = "")
    {
        JObject source = Parse(sourceJObject, nameof(sourceJObject));
        JObject target = Parse(targetJObject, nameof(targetJObject));

        HashSet<string> ignored = ParseFieldsToIgnore(fieldsToIgnore);

        var result = new List<PropertyDifference>();

        if (!JToken.DeepEquals(source, target))
        {
            // Source keys, in source order. When symmetric, also append keys that
            // exist only in the target so added properties are reported too.
            // Fields listed in fieldsToIgnore are skipped entirely.
            var keys = new List<string>();
            var seen = new HashSet<string>();
            foreach (KeyValuePair<string, JToken> p in source)
            {
                if (ignored.Contains(p.Key)) continue;
                if (seen.Add(p.Key)) keys.Add(p.Key);
            }
            if (symmetric)
            {
                foreach (KeyValuePair<string, JToken> p in target)
                {
                    if (ignored.Contains(p.Key)) continue;
                    if (seen.Add(p.Key)) keys.Add(p.Key);
                }
            }

            foreach (string key in keys)
            {
                JToken sourceValue = source[key];
                JToken targetValue = target[key];

                result.Add(new PropertyDifference
                {
                    Key = key,
                    ValueOld = ValueToString(sourceValue),
                    ValueNew = ValueToString(targetValue),
                    IsEqual = JToken.DeepEquals(sourceValue, targetValue),
                });
            }
        }

        return result;
    }

    /// <summary>
    /// Builds a case-insensitive set of property names to ignore from a
    /// comma-separated list (for example <c>"createdby, updatedby"</c>).
    /// Each entry is trimmed; empty entries are discarded. Null, empty or
    /// whitespace input yields an empty set (nothing is ignored).
    /// </summary>
    private static HashSet<string> ParseFieldsToIgnore(string fieldsToIgnore)
    {
        var ignored = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(fieldsToIgnore))
        {
            return ignored;
        }

        foreach (string field in fieldsToIgnore.Split(','))
        {
            string trimmed = field.Trim();
            if (trimmed.Length > 0)
            {
                ignored.Add(trimmed);
            }
        }

        return ignored;
    }

    /// <summary>
    /// Parses the input into a <see cref="JObject"/>. Null, empty, whitespace and
    /// the JSON <c>null</c> literal are treated as an empty object so comparison
    /// still works. Any other non-object JSON (array, scalar) or malformed JSON
    /// raises an <see cref="ArgumentException"/> naming the offending parameter.
    /// </summary>
    private static JObject Parse(string json, string paramName)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new JObject();
        }

        JToken token;
        try
        {
            token = JToken.Parse(json);
        }
        catch (JsonException ex)
        {
            throw new ArgumentException($"Parameter '{paramName}' is not valid JSON.", paramName, ex);
        }

        if (token.Type == JTokenType.Null)
        {
            return new JObject();
        }

        if (token is not JObject obj)
        {
            throw new ArgumentException(
                $"Parameter '{paramName}' must be a JSON object, but was {token.Type}.", paramName);
        }

        return obj;
    }

    /// <summary>
    /// Renders a property value as a string. Scalars keep their raw form (a
    /// string value yields <c>Alice</c>, not <c>"Alice"</c>), matching the
    /// original O11 behavior; nested objects and arrays are rendered as compact
    /// single-line JSON. A missing value (key present on only one side) or a
    /// JSON <c>null</c> becomes an empty string.
    /// </summary>
    private static string ValueToString(JToken value)
    {
        if (value is null || value.Type == JTokenType.Null)
        {
            return string.Empty;
        }

        // JObject / JArray -> compact JSON; JValue scalars -> raw text.
        return value is JContainer ? value.ToString(Formatting.None) : value.ToString();
    }
}
