---
name: odc-extension-zip
description: >-
  Validate, test, and package an OutSystems Developer Cloud (ODC) external
  library into the upload ZIP. Use this skill whenever the user wants to test /
  validate / verify an ODC extension and then produce the ZIP that gets uploaded
  to the ODC Portal — phrasings like "package the extension", "build the zip for
  ODC", "make the upload package", "is my external library ready to upload",
  "validate and zip the extension", or "generate the ODC zip". It runs a hard
  gate (clean Release build + unit tests + SDK-constraint review) and only if
  everything passes does it publish and zip the publish-output contents into
  <ProjectName>.zip placed inside the project folder, then verifies the ZIP is
  ODC-ready (main assembly at the root, compile-time-only SDK excluded). This is
  the packaging/release companion to the `odc-extension` skill (which covers
  authoring the C# code). Trigger for any "get this extension ready to ship /
  upload" request, even if the user doesn't say the word "zip".
---

# Validate & Package an ODC External Library

Goal: **only ship a ZIP that would actually pass ODC's upload validation.** So
this is a gate, not just a zipper. Nothing gets packaged unless it builds clean,
tests pass, and the code honors the SDK's hard constraints. The ZIP lands as
`<ProjectName>.zip` **inside the project folder** (the established convention in
this repo — e.g. `CompareObjects/CompareObjects.zip`).

If you need the authoring rules (attributes, allowed types, `.csproj` setup),
that's the `odc-extension` skill — read it when a validation failure needs a code
fix.

## Workflow

Run these in order. Stop at the first failure, report it plainly, and offer the
fix — do **not** proceed to packaging on a red gate.

### 1. Locate the project

Identify the target `.csproj` (usually the current directory, or the folder the
user names). If there are multiple, ask which one.

### 2. Semantic validation review (you do this)

The bundled script covers build/test/zip mechanics, but ODC's upload validator
also enforces rules a compiler won't catch. Before running the script, read the
library's interface/implementation/structs and confirm each of these. Report a
concise checklist with ✅/❌ and, for any ❌, the exact code fix.

- **Exactly one `[OSInterface]`** in the library, implemented by a **public class
  with a public parameterless constructor** (an `ILogger`-taking constructor is
  also allowed).
- **Only supported types** cross the boundary (parameters, returns, struct
  fields): basic .NET types (`string`, `int`, `long`, `bool`, `byte[]`,
  `decimal`, `float`, `double`, `DateTime`), `[OSStructure]` structs, or
  `IEnumerable` lists of those. Flag anything else (classes, `Dictionary`,
  tuples, enums).
- **Structures are `[OSStructure]` structs**; exposed fields are public;
  internal-only fields are `[OSIgnore]`.
- **`.csproj` packaging is correct** — this is the most common real failure:
  - the SDK reference has `<PrivateAssets>all</PrivateAssets>` and
    `<ExcludeAssets>runtime</ExcludeAssets>` (compile-time only), and
  - `<CopyLocalLockFileAssemblies>true</CopyLocalLockFileAssemblies>` so real
    NuGet dependencies get bundled.
- **No `Console.WriteLine`** for logging (invisible in ODC) — `ILogger` instead.
- **Stateless** design and `IDisposable`s wrapped in `using` (no leaks across
  reused contexts).

If everything is ✅, tell the user the review passed and proceed. If not, fix (or
propose fixes) and re-review before packaging.

### 3. Run the packaging gate

Run the bundled script. It cleans, builds Release, discovers & runs any test
projects, publishes, zips the publish-output **contents** to the project folder,
and verifies the ZIP. It exits non-zero on any failure.

```powershell
& "<skill-dir>/scripts/package.ps1" -ProjectPath "<path-to-.csproj-or-folder>"
```

Common options:
- `-Runtime linux-x64` — runtime-specific publish; use **only** if the library
  has native/runtime-specific dependencies.
- `-OutputName MyName` — override the ZIP base name (defaults to project name).
- `-SkipTests` — only if the user explicitly accepts skipping tests.

The script prints `PASS:`/`FAIL:` per stage. On `FAIL`, surface the message and
stop — the ZIP is intentionally not produced (or not left stale) on a failing
gate.

### 4. Confirm the result

On success the script prints `READY TO UPLOAD` with the ZIP path. Relay:
- the ZIP location (inside the project folder),
- that tests passed and the ZIP was verified (main assembly at root, SDK
  excluded),
- the next step: ODC Portal → **Integrate → External Logic → Create library** →
  upload the ZIP → publish → release (see `odc-extension` for that flow).

## What the script verifies about the ZIP

These checks mirror what breaks ODC uploads, so a green run is a strong signal
the upload will succeed:

1. **Main assembly `<ProjectName>.dll` is at the ZIP root** — ODC needs the
   assemblies flat, not nested under a `publish/` folder.
2. **`OutSystems.ExternalLibraries.SDK.dll` is NOT in the ZIP** — bundling it
   causes a runtime conflict; its absence confirms the `.csproj` excludes runtime
   assets correctly.
3. **No wrapping top-level folder** — contents are zipped at the root.

A correctly built package looks like the reference `CompareObjects.zip`: the main
DLL, its `.deps.json`, and third-party dependency DLLs (e.g. `Newtonsoft.Json.dll`)
all at the root — and no SDK DLL.

## Non-Windows fallback

The script is PowerShell (this repo's convention). PowerShell Core (`pwsh`) runs
it on macOS/Linux too. If PowerShell is genuinely unavailable, reproduce the
gate manually — build `dotnet build -c Release`, test `dotnet test -c Release`,
then `dotnet publish -c Release --no-self-contained`, and zip the **contents** of
`bin/Release/<tfm>/publish/` to `<project>/<ProjectName>.zip` (contents at the
root) — then apply the three ZIP checks above by hand.
