# CompareObjects — v1.0.0

First release of the **CompareObjects** ODC External Library, migrating the
`Compare` logic from the OutSystems 11 `CompareObjs` extension to OutSystems
Developer Cloud (.NET 10).

## Action

`Compare(SourceJObject : Text, TargetJObject : Text, Symmetric : Boolean) : Differences (List of PropertyDifference)`

Compares two JSON objects property by property and returns a typed **List of
`PropertyDifference`** (`Key`, `ValueOld`, `ValueNew`, `IsEqual`). Returns an
empty list when the objects are deeply equal.

## Highlights

- **Typed output** — returns a `List` of the `PropertyDifference` structure, so
  no JSON parsing is needed in ODC.
- **Diff scope (`Symmetric`)** — `False` (default) compares only the source
  object's properties, in source order (matching O11); `True` reports the union
  of keys, including properties present only in the target.
- **Lenient input** — `null`, empty/whitespace, and JSON `null` are treated as
  an empty object.
- **Clear errors** — non-object JSON (array/scalar) or malformed JSON raises an
  `ArgumentException` naming the offending parameter.

## Notes

- Not migrated from O11: the `Listify` method (intentionally excluded).
