<#
.SYNOPSIS
  Validate an ODC external library and, if everything passes, produce the
  upload ZIP inside the project folder.

.DESCRIPTION
  Runs a hard gate -- clean, Release build, unit tests (if any) -- and only if all
  of that succeeds does it publish and package. The ZIP contains the publish
  output *contents* at its root (DLLs flat, no wrapping folder), which is what
  ODC requires. It is written to <project folder>\<ProjectName>.zip.

  The script also verifies the ZIP is well-formed for ODC: the main assembly is
  present at the root and the compile-time-only SDK assembly is NOT bundled.

.PARAMETER ProjectPath
  Path to the .csproj, or a folder containing exactly one .csproj. Defaults to
  the current directory.

.PARAMETER Runtime
  Optional .NET runtime identifier for a runtime-specific publish (e.g.
  "linux-x64"). Use only when the library has native/runtime-specific
  dependencies. Omit for a portable cross-platform publish.

.PARAMETER OutputName
  Base name for the ZIP (without extension). Defaults to the project name.

.PARAMETER SkipTests
  Skip the test stage. Use only when you have separately confirmed correctness;
  the whole point of this skill is that tests gate the package.

.EXAMPLE
  ./package.ps1
.EXAMPLE
  ./package.ps1 -ProjectPath ..\Shapefile -Runtime linux-x64
#>
[CmdletBinding()]
param(
    [string]$ProjectPath = ".",
    [string]$Runtime,
    [string]$OutputName,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host "PASS: $msg" -ForegroundColor Green }
function Fail([string]$msg) {
    Write-Host "FAIL: $msg" -ForegroundColor Red
    exit 1
}

# --- Resolve the project ----------------------------------------------------
Write-Step "Resolving project"
if (-not (Test-Path $ProjectPath)) { Fail "Path not found: $ProjectPath" }

$item = Get-Item $ProjectPath
if ($item.PSIsContainer) {
    $csprojs = @(Get-ChildItem -Path $item.FullName -Filter *.csproj -File)
    if ($csprojs.Count -eq 0) { Fail "No .csproj found in $($item.FullName)" }
    if ($csprojs.Count -gt 1) {
        Fail "Multiple .csproj files in $($item.FullName). Pass -ProjectPath <the .csproj> explicitly: $($csprojs.Name -join ', ')"
    }
    $csproj = $csprojs[0]
} else {
    if ($item.Extension -ne ".csproj") { Fail "Not a .csproj: $($item.FullName)" }
    $csproj = $item
}

$projectDir  = $csproj.Directory.FullName
$projectName = [System.IO.Path]::GetFileNameWithoutExtension($csproj.Name)
if (-not $OutputName) { $OutputName = $projectName }
Write-Host "Project:     $($csproj.FullName)"
Write-Host "Project dir: $projectDir"

# Read the target framework moniker (e.g. net10.0) from the csproj.
$csprojText = Get-Content $csproj.FullName -Raw
$tfm = $null
if ($csprojText -match "<TargetFramework>([^<]+)</TargetFramework>") { $tfm = $Matches[1].Trim() }
elseif ($csprojText -match "<TargetFrameworks>([^<;]+)") { $tfm = $Matches[1].Trim() }
if (-not $tfm) { Fail "Could not read <TargetFramework> from the .csproj." }
Write-Host "Target framework: $tfm"
Write-Ok "Project resolved"

# --- Sanity: dotnet available ----------------------------------------------
Write-Step "Checking .NET SDK"
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnet) { Fail "'dotnet' not on PATH. Install the .NET SDK." }
Write-Host (dotnet --version)
Write-Ok ".NET SDK present"

# --- Clean ------------------------------------------------------------------
Write-Step "Cleaning"
dotnet clean $csproj.FullName -c Release --nologo | Out-Host
if ($LASTEXITCODE -ne 0) { Fail "dotnet clean failed." }
Write-Ok "Clean"

# --- Build (Release) --------------------------------------------------------
Write-Step "Building (Release)"
dotnet build $csproj.FullName -c Release --nologo | Out-Host
if ($LASTEXITCODE -ne 0) { Fail "Release build failed. Fix compile errors before packaging." }
Write-Ok "Build"

# --- Tests ------------------------------------------------------------------
if ($SkipTests) {
    Write-Step "Tests (skipped by -SkipTests)"
    Write-Host "WARNING: tests skipped." -ForegroundColor Yellow
} else {
    Write-Step "Discovering & running tests"
    # A test project references Microsoft.NET.Test.Sdk. Search the whole repo
    # subtree rooted at the project dir's parent so sibling *.Tests projects
    # are found too.
    $searchRoot = $projectDir
    $repoParent = (Get-Item $projectDir).Parent
    if ($repoParent) { $searchRoot = $repoParent.FullName }

    $testProjects = @(
        Get-ChildItem -Path $searchRoot -Filter *.csproj -File -Recurse -ErrorAction SilentlyContinue |
            Where-Object {
                $_.FullName -notmatch "\\(bin|obj)\\" -and
                (Get-Content $_.FullName -Raw) -match "Microsoft\.NET\.Test\.Sdk|IsTestProject\s*>\s*true|nunit|xunit|MSTest"
            }
    )

    if ($testProjects.Count -eq 0) {
        Write-Host "No test projects found." -ForegroundColor Yellow
        Write-Host "(Validation continues, but consider adding tests -- they are the strongest gate.)"
    } else {
        foreach ($tp in $testProjects) {
            Write-Host "Testing: $($tp.FullName)"
            dotnet test $tp.FullName -c Release --nologo | Out-Host
            if ($LASTEXITCODE -ne 0) { Fail "Tests failed in $($tp.Name). Not packaging." }
        }
        Write-Ok "All tests passed"
    }
}

# --- Publish ----------------------------------------------------------------
Write-Step "Publishing (Release)"
if ($Runtime) {
    Write-Host "Runtime-specific publish: $Runtime"
    dotnet publish $csproj.FullName -c Release -r $Runtime --no-self-contained --nologo | Out-Host
    $publishDir = Join-Path $projectDir "bin\Release\$tfm\$Runtime\publish"
} else {
    dotnet publish $csproj.FullName -c Release --no-self-contained --nologo | Out-Host
    $publishDir = Join-Path $projectDir "bin\Release\$tfm\publish"
}
if ($LASTEXITCODE -ne 0) { Fail "dotnet publish failed." }
if (-not (Test-Path $publishDir)) { Fail "Publish folder not found: $publishDir" }
Write-Host "Publish output: $publishDir"
Write-Ok "Publish"

# --- Package (zip contents at root) ----------------------------------------
Write-Step "Packaging ZIP"
$zipPath = Join-Path $projectDir "$OutputName.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Zip the CONTENTS of the publish folder (the trailing \* is what keeps the
# DLLs at the ZIP root rather than nested under a 'publish' folder).
Compress-Archive -Path (Join-Path $publishDir "*") -DestinationPath $zipPath -Force
if (-not (Test-Path $zipPath)) { Fail "ZIP was not created." }
Write-Ok "ZIP created: $zipPath"

# --- Verify the ZIP is ODC-ready -------------------------------------------
Write-Step "Verifying ZIP for ODC"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $entries = $archive.Entries | ForEach-Object { $_.FullName }

    # 1) Main assembly must sit at the ZIP root.
    $mainDll = "$projectName.dll"
    if ($entries -notcontains $mainDll) {
        Fail "Main assembly '$mainDll' not found at ZIP root. Entries: $($entries -join ', ')"
    }
    Write-Ok "Main assembly at root: $mainDll"

    # 2) The compile-time-only SDK must NOT be bundled (else runtime conflict).
    $sdkBundled = $entries | Where-Object { $_ -match "OutSystems\.ExternalLibraries\.SDK\.dll" }
    if ($sdkBundled) {
        Fail "OutSystems.ExternalLibraries.SDK.dll is in the ZIP. In the .csproj mark the SDK PackageReference with <PrivateAssets>all</PrivateAssets> and <ExcludeAssets>runtime</ExcludeAssets>, then re-run."
    }
    Write-Ok "SDK assembly correctly excluded"

    # 3) Nothing should be nested under a wrapping folder at top level.
    $nested = $entries | Where-Object { $_ -match "^publish[\\/]" }
    if ($nested) {
        Fail "ZIP has a wrapping 'publish/' folder -- contents must be at the root."
    }

    Write-Host "`nZIP contents:" -ForegroundColor Cyan
    $archive.Entries | Sort-Object FullName | ForEach-Object {
        "{0,10}  {1}" -f $_.Length, $_.FullName | Write-Host
    }
} finally {
    $archive.Dispose()
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "READY TO UPLOAD" -ForegroundColor Green
Write-Host "ZIP: $zipPath" -ForegroundColor Green
Write-Host "Upload it in ODC Portal -> Integrate -> External Logic -> Create library." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
exit 0
