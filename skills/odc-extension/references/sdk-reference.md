# External Libraries SDK — Attribute & Type Reference

Namespace for everything below: `OutSystems.ExternalLibraries.SDK`.
For working examples, see the basic and advanced IBAN-checker templates in the
[SDK GitHub repository](https://github.com/OutSystems/OutSystems.ExternalLibraries.SDK-templates).

## Contents

- [Attribute → OutSystems element mapping](#mapping-table)
- [OSInterfaceAttribute](#osinterfaceattribute)
- [OSActionAttribute](#osactionattribute)
- [OSParameterAttribute](#osparameterattribute)
- [OSStructureAttribute](#osstructureattribute)
- [OSStructureFieldAttribute](#osstructurefieldattribute)
- [OSIgnore](#osignore)
- [OSDataType enum](#osdatatype-enum)
- [Allowed .NET types](#allowed-net-types)

## Mapping table

| .NET attribute       | OutSystems element        | Key properties |
|----------------------|---------------------------|----------------|
| `[OSInterface]`      | External library          | Name, Description, IconResourceName, OriginalName |
| `[OSAction]`         | Server action             | Description, IconResourceName, ReturnType, ReturnName, ReturnDescription, OriginalName |
| `[OSParameter]`      | Input/output parameter    | DataType, Description, OriginalName |
| `[OSStructure]`      | Structure                 | Description, OriginalName |
| `[OSStructureField]` | Structure attribute       | DataType, Description, Length, Decimals, IsMandatory, DefaultValue, OriginalName |
| `[OSIgnore]`         | (excludes a struct field) | — |

Every `OriginalName` property exists so you can rename the underlying .NET
symbol without breaking ODC consumers: ODC derives a stable key from the
original name, so set `OriginalName` to the previous name when renaming.

## OSInterfaceAttribute

Decorates the **single** entry-point interface for the external library. Only one
interface per library may carry it. Must be implemented by a public class with a
public parameterless constructor (an `ILogger`-taking constructor is also
accepted). All public methods on the interface become Server Actions.

| Property | Meaning |
|----------|---------|
| `Name` | External library name. If omitted, the interface name without its leading `I` (e.g. `IMyLibrary` → `MyLibrary`). |
| `Description` | Library description shown in ODC. |
| `IconResourceName` | Name of an embedded resource holding the library icon (e.g. `MyProj.Resources.icon.jpg`). |
| `OriginalName` | Previous library name (previous namespace + library name) to preserve the key across renames. |

## OSActionAttribute

Decorates a public method (inside the `[OSInterface]` interface) to expose it as a
Server Action.

| Property | Meaning |
|----------|---------|
| `Description` | Server action description. |
| `IconResourceName` | Embedded resource name for the action icon. |
| `ReturnType` | `OSDataType` for the output parameter; must be compatible with the .NET return type. Inferred if omitted. |
| `ReturnName` | Name of the output parameter. Defaults to the method name. |
| `ReturnDescription` | Description of the output parameter. |
| `OriginalName` | Previous method name, to preserve the key across renames. |

## OSParameterAttribute

Decorates a method parameter to expose it as a Server Action input/output
parameter.

| Property | Meaning |
|----------|---------|
| `DataType` | `OSDataType` for the parameter; must be compatible with the .NET type. Inferred if omitted. |
| `Description` | Parameter description. |
| `OriginalName` | Previous parameter name, to preserve the key across renames. |

**Optional parameters**: give the C# parameter a default value; it becomes an
optional input in ODC.

## OSStructureAttribute

Decorates a `struct` to expose it as an OutSystems Structure. All public fields
and properties become Structure attributes (unless marked `[OSIgnore]`).

| Property | Meaning |
|----------|---------|
| `Description` | Structure description. |
| `OriginalName` | Previous struct name, to preserve the key across renames. |

## OSStructureFieldAttribute

Decorates a public field/property inside an `[OSStructure]` struct.

| Property | Meaning |
|----------|---------|
| `DataType` | `OSDataType` for the attribute; must be compatible with the .NET type. Inferred if omitted. |
| `Description` | Attribute description. |
| `Length` | Max character length. Applies to **Text and Decimal** types. Default = 50. |
| `Decimals` | Number of decimal places. Applies to **Decimal** only. Default = 8. |
| `IsMandatory` | Whether a value is required. |
| `DefaultValue` | Default value of the field/property. |
| `OriginalName` | Previous field name, to preserve the key across renames. |

## OSIgnore

Decorates a public property/field inside an `[OSStructure]` struct to **exclude**
it from the exposed OutSystems Structure.

## OSDataType enum

Set explicitly via `DataType` / `ReturnType` when you don't want the type inferred
from .NET:

| Constant | OutSystems type |
|----------|-----------------|
| `InferredFromDotNetType` | Infer from the .NET type (default behavior) |
| `Text` | Text |
| `Integer` | Integer |
| `LongInteger` | Long Integer |
| `Decimal` | Decimal |
| `Currency` | Currency |
| `Boolean` | Boolean |
| `DateTime` | DateTime |
| `Date` | Date |
| `Time` | Time |
| `Email` | Email |
| `PhoneNumber` | Phone number |
| `BinaryData` | Binary |

## Allowed .NET types

Method parameters, return values, and structure fields may only be:

1. **Basic .NET types**: `string`, `int`, `long`, `bool`, `byte[]`, `decimal`,
   `float`, `double`, `DateTime`.
2. **Structs decorated with `[OSStructure]`**.
3. **`IEnumerable`-based lists** of either of the above (e.g. `List<T>`,
   `ICollection<T>`, arrays).

Type inference mapping notes:
- `byte[]` → Binary Data
- `int` → Integer, `long` → Long Integer
- `decimal`/`float`/`double` → Decimal (use `Currency` explicitly if that's the
  intent)
- `DateTime` → DateTime (use `Date`/`Time` explicitly to narrow it)

Types outside this set (arbitrary classes, `Dictionary`, tuples, enums) do not
map — restructure the API to use the allowed set.
