---
name: odc-extension
description: >-
  Complete guide to building an OutSystems Developer Cloud (ODC) extension — a
  C#/.NET "external library" that exposes server actions and structures to ODC
  apps via the OutSystems.ExternalLibraries.SDK. Use this skill whenever the user
  is creating, editing, building, packaging, or troubleshooting an ODC external
  library or custom code: setting up the .csproj, decorating code with
  [OSInterface]/[OSAction]/[OSParameter]/[OSStructure]/[OSStructureField],
  mapping .NET types to OutSystems data types, adding ILogger logging or tracing
  spans, publishing with `dotnet publish` and zipping the upload package,
  uploading/publishing/releasing in the ODC Portal, consuming actions in ODC
  Studio, wiring up a Private Gateway, consuming mTLS or SOAP web services from
  custom code, or upgrading a library to a new .NET version. Trigger even when
  the user just says "ODC extension", "OutSystems external library", "custom C#
  for OutSystems", or names the SDK attributes, without spelling out the full
  workflow.
---

# Building an OutSystems ODC External Library (Extension)

An ODC "extension" is a **C#/.NET class library** decorated with SDK attributes,
packaged into a ZIP, and uploaded to the ODC Portal. Once published and released
it appears to app developers as a normal ODC library with **Server Actions** and
**Structures** — they consume it in ODC Studio without seeing any C#.

Work in this order: **build → package → upload/publish → release → consume**.

## The mental model that governs every decision

This is the single most important thing to internalize, because it silently
shapes what code is safe to write:

**Each call to a server action is a separate HTTPS call to an external service
that hosts your custom code — it does NOT run inside the ODC app's process.**

Consequences you must design around:

- **Stateless.** Never store state between calls (no mutable static/instance
  fields used as memory across invocations). Pass everything needed as input
  parameters. Successive calls *may* reuse the execution context, so you also
  must release resources to avoid leaks.
- **Latency.** Every action call pays an HTTP round-trip. Batch work; minimize
  the number of chatty calls.
- **Independent / isolated.** No access to the app's resources, context, threads,
  or filesystem layout. The plugin uses **isolated assembly loading** — do NOT
  rely on `AppDomain.CurrentDomain.BaseDirectory`, dynamic assembly loading, or
  assumptions about where assemblies live on disk. These break in this sandbox.
- **5.5 MB total input limit** across all input parameters (names + values +
  serialization overhead). Exceeding it throws `Input payload is too large` at
  runtime. For large binaries, expose a REST endpoint or file-share URL and have
  the custom code fetch the bytes itself instead of passing them in.

## Prerequisites

- **.NET 10.0 SDK** (the current LTS target for ODC — see the version note below).
- NuGet package manager.
- An IDE that builds .NET projects: Visual Studio, VS Code, or JetBrains Rider.
- You do **not** need an ODC organization account to build with the SDK — only to
  upload/publish (that needs library create/change permission in the Portal).

> **.NET version matters.** ODC supports custom code on a specific .NET version
> and periodically moves it forward. As of mid-2026 the target is **.NET 10**
> (available since 2026-06-22); **.NET 8** support ends **2026-11-10**. Always
> target the current supported LTS. See [references/lifecycle.md](references/lifecycle.md)
> for the upgrade procedure and dates.

## Step 1 — Create the project

```bash
dotnet new classlib --language "C#" -o MyLibrary
cd MyLibrary
dotnet add package OutSystems.ExternalLibraries.SDK
# optional, but recommended for logging:
dotnet add package Microsoft.Extensions.Logging
```

`System.Diagnostics` (used for tracing spans) ships with .NET — no package needed.

### The .csproj is where most real-world mistakes happen

The SDK is **compile-time only**: ODC provides it at runtime, so shipping the
SDK assembly in your ZIP causes conflicts. Meanwhile your *real* dependencies
(third-party NuGet packages) **must** be copied into the output so they land in
the ZIP. Configure both explicitly:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <!-- Copy NuGet dependencies into build output so they get packaged. -->
    <CopyLocalLockFileAssemblies>true</CopyLocalLockFileAssemblies>
  </PropertyGroup>

  <ItemGroup>
    <!-- Your real runtime dependencies get bundled: -->
    <PackageReference Include="SomeThirdParty.Lib" Version="1.2.3" />

    <!-- The SDK is compile-time only — exclude it from the output/ZIP: -->
    <PackageReference Include="OutSystems.ExternalLibraries.SDK" Version="1.5.0">
      <PrivateAssets>all</PrivateAssets>
      <ExcludeAssets>runtime</ExcludeAssets>
    </PackageReference>
  </ItemGroup>
</Project>
```

Getting `CopyLocalLockFileAssemblies` / `PrivateAssets` wrong is the usual cause
of "works locally, fails in ODC" — either dependencies are missing from the ZIP,
or the SDK collides at runtime.

## Step 2 — Write the interface and implementation

Exactly **one** public interface is the library entry point, decorated with
`[OSInterface]`. It must be implemented by a public class with a **public
parameterless constructor** (an `ILogger`-injecting constructor is also allowed —
ODC supplies the logger). Every public method on the interface becomes a Server
Action.

```csharp
using OutSystems.ExternalLibraries.SDK;

namespace MyCompany
{
    [OSInterface(
        Name = "MyLibrary",
        Description = "What this library does.")]
    public interface IMyLibrary
    {
        [OSAction(
            Description = "Greets someone.",
            ReturnName = "Greeting",
            ReturnDescription = "The greeting text.")]
        string SayHello(
            [OSParameter(Description = "Person's name.")] string name,
            [OSParameter(Description = "Optional title.")] string title = "Mr./Ms.");
    }
}
```

- **Optional parameters**: give the C# parameter a default value (`title` above)
  and it becomes an optional input in ODC.
- The class implementing it holds the logic; keep it stateless (see mental model).

### Structures

Expose composite data as a `struct` (not class) decorated with `[OSStructure]`;
its public fields/properties become Structure attributes. Use
`[OSStructureField]` to describe them and `[OSIgnore]` to hide one.

```csharp
[OSStructure(Description = "A generated file package.")]
public struct FileResult
{
    [OSStructureField(Description = "The file bytes. Maps to Binary Data in ODC.")]
    public byte[] Content;

    [OSStructureField(Description = "The output file name.", IsMandatory = true)]
    public string FileName;

    [OSIgnore]
    public string InternalTag;   // not exposed to ODC
}
```

## Step 3 — Allowed types (the hard constraint on your API surface)

Method parameters and return types can **only** be:

1. **Basic .NET types**: `string`, `int`, `long`, `bool`, `byte[]`, `decimal`,
   `float`, `double`, `DateTime`.
2. **Structs decorated with `[OSStructure]`**.
3. **Lists** — anything implementing `IEnumerable` — of the above two.

Anything else (arbitrary classes, dictionaries, tuples, enums) will not map. If
the SDK can't infer the OutSystems type, set it explicitly via the `DataType`
property using the `OSDataType` enum (e.g. `OSDataType.Text`, `OSDataType.Integer`,
`OSDataType.Decimal`, `OSDataType.BinaryData`, `OSDataType.DateTime`, `Email`,
`PhoneNumber`, `Currency`, etc.). Full attribute/type reference:
[references/sdk-reference.md](references/sdk-reference.md).

## Step 4 — Logging and tracing

**Always add logging** — it's your only production diagnostic. Rules:

- Inject `Microsoft.Extensions.Logging.ILogger` via the constructor. Do **NOT**
  use `Console.WriteLine` — console output is invisible in the ODC Portal.
- Only **Information level and above** is captured in the Portal. Use appropriate
  levels so you can filter.
- **Never log sensitive data** (personal data, credentials) — data-protection
  compliance.

```csharp
using Microsoft.Extensions.Logging;
using System.Diagnostics;

public class MyLibrary : IMyLibrary
{
    private readonly ILogger _logger;
    public MyLibrary(ILogger logger) => _logger = logger;

    public string SayHello(string name, string title = "Mr./Ms.")
    {
        using var activity = Activity.Current?.Source.StartActivity("MyLibrary.SayHello");
        try
        {
            _logger.LogInformation("Saying hello to {Name} with title {Title}", name, title);
            return $"Hello, {title} {name}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to format name: {Name}", name);
            throw;
        }
    }
}
```

- **Tracing spans**: `using var activity = Activity.Current?.Source.StartActivity("Lib.Op");`
  wrapped in a `using` so it disposes. It joins the ODC request's distributed
  trace automatically. Name spans after the operation (`"Iban.Parse"`).
- Use structured logging templates (`"{Name}"`) rather than string interpolation
  where you want queryable fields.

### Memory: dispose everything disposable

Because execution contexts are reused, leaks accumulate. Wrap every `IDisposable`
(streams, DB connections, HTTP handlers, etc.) in `using`. Enable the analyzer to
catch misses — add to `.editorconfig`:

```
dotnet_diagnostic.CA2000.severity = warning
```

## Step 5 — Build and package the ZIP

```bash
dotnet publish -c Release --no-self-contained
```

If your library has runtime-specific native dependencies, publish for the ODC
runtime (Linux containers):

```bash
dotnet publish -c Release -r linux-x64 --no-self-contained
```

Then **zip the *contents* of the publish output folder to the ROOT of the ZIP**
(the DLLs must be at the top level of the archive, not inside a subfolder):

- cross-platform: `./{SOLUTION}/bin/Release/{TFM}/publish/*`
- linux-x64: `./{SOLUTION}/bin/Release/{TFM}/linux-x64/publish/*`

where `{TFM}` is e.g. `net10.0`. The IBAN checker templates ship a
`generate_upload_package.ps1` that does this for you.

## Step 6 — Upload, publish, release (ODC Portal)

1. ODC Portal → **Integrate → External Logic → Create library**.
2. Upload the ZIP → **Continue**. If it reports errors, **View errors**, fix the
   C# (see [references/sdk-reference.md](references/sdk-reference.md) and the ODC
   Custom Code Analyzer, a community tool, for live feedback), re-zip, upload again.
   All validation happens at upload time.
3. **Review file contents** to see the exposed actions/structures → **Publish library**.
   Deployment status ends in *Finished successfully*, *Finished with errors*, or
   *Running*.
4. It deploys first to the **Development** stage. Test it: Version history →
   ellipsis → **Try library in an app**.
5. **Release** the version so other apps can consume it. When a consuming app
   deploys to another stage, the library follows automatically.

Updating an existing library follows the same steps (upload new ZIP → publish →
release → update consumers).

## Step 7 — Consume in ODC Studio

In ODC Studio, add a **public element** dependency: Logic tab → right-click →
Add public element → find your library by its `[OSInterface]` `Name` → select the
actions/structures. Use them like any server action. They are **read-only** in
Studio (you can't edit the C# there).

To share beyond your org, submit the library to **Forge**.

## Renaming without breaking consumers

Every attribute has an **`OriginalName`** property. ODC computes a stable key from
the original name; if you rename a .NET interface/method/parameter/struct/field,
set `OriginalName` to the *previous* name so existing app references don't break.

## Specialized scenarios → reference files

Read the relevant file when the task calls for it:

- **[references/sdk-reference.md](references/sdk-reference.md)** — complete reference
  for every attribute (`OSInterface`, `OSAction`, `OSParameter`, `OSStructure`,
  `OSStructureField`, `OSIgnore`) and every property, plus the `OSDataType` enum
  and the .NET-attribute→OutSystems-element mapping table. Consult when unsure
  which property does what, or how a type maps.
- **[references/integrations.md](references/integrations.md)** — connecting to
  private networks via **Private Gateway** (the `SECURE_GATEWAY` env var pattern),
  consuming an **mTLS** REST API (NSwag client generation, client-cert handling),
  and consuming a **SOAP** web service (`dotnet-svcutil`, `BasicHttpBinding`).
  Read when the extension must call an external/private/mTLS/SOAP endpoint.
- **[references/lifecycle.md](references/lifecycle.md)** — supported .NET versions
  and dates, and the step-by-step procedure to upgrade a library (and its
  consumers) to a new .NET version before the old one is deprecated. Read for any
  ".NET version upgrade" task.

## Quick sanity checklist before uploading

- [ ] Targets the current supported .NET (`net10.0`).
- [ ] `.csproj`: real deps `CopyLocalLockFileAssemblies=true`; SDK has
      `PrivateAssets=all` + `ExcludeAssets=runtime`.
- [ ] Exactly one `[OSInterface]`, implemented by a public class with a public
      parameterless (or ILogger) constructor.
- [ ] Every exposed type is a basic type, `[OSStructure]`, or list thereof.
- [ ] Stateless; all `IDisposable` wrapped in `using`.
- [ ] `ILogger` used (never `Console.WriteLine`); no sensitive data logged.
- [ ] Inputs stay under 5.5 MB.
- [ ] `dotnet publish -c Release` output **contents** zipped at the ZIP root.
