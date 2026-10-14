# .NET Version Lifecycle & Upgrading Libraries

ODC runs custom code on a specific .NET version and periodically moves that
support to a newer one. You must keep libraries (and their consumers) on a
supported version before the old one is deprecated.

## Why it matters

- Microsoft ends support for each .NET version on a published schedule (see
  Microsoft's .NET and .NET Core lifecycle).
- Newer versions bring the latest features, security updates, and support.

## How ODC supports versions

ODC supports **more than one .NET version at a time**, so you can migrate
gradually. Each version moves through:

1. **Availability** — from a set date you can build new code with it and upgrade
   existing libraries to it.
2. **Parallel support** — while both a newer and older version are available, you
   can use/maintain either. Use this window to migrate.
3. **Deprecation** — on the deprecation date, support for the older version ends.
   After it, you can no longer upload, update, or install custom code targeting
   that version, and OutSystems no longer maintains or secures it.

**Plan so all libraries and their consumers are upgraded and deployed to
Production before the deprecation date.**

## Supported versions and dates

The current transition moves custom code from **.NET 8 to .NET 10**.

| .NET version | Available in ODC | Support ends       |
|--------------|------------------|--------------------|
| .NET 10      | June 22, 2026    | To be announced    |
| .NET 8       | August 7, 2024   | November 10, 2026  |

> Dates change over time — treat this table as the state captured from the ODC
> docs (last updated 2026-06-29). Confirm current dates in the live docs when the
> deadline is close.

## Upgrade procedure

1. **Find libraries on the old version.** In ODC Portal → **External Logic**, the
   **Running version** column shows the .NET version and flags libraries needing
   an upgrade.
2. **Retarget the framework** to the new version (e.g. set `<TargetFramework>` to
   `net10.0`, or multi-target). Address any breaking changes between the versions
   (check the .NET 9 and .NET 10 breaking-changes notes). For Forge-sourced
   libraries, check for updated versions instead of editing.
3. **Upload the new version** in Portal (skip if the update came from Forge).
4. **Release** the new version of the library.
5. **Update consumers** to the new version and test them.
6. **Deploy consumers across all stages, through to Production**, to propagate the
   upgrade — before the old version's support ends.

## Recommended standing practices

- Plan the upgrade across the whole factory as soon as a newer version is
  available.
- Build all **new** code and updates on the **latest available** .NET version to
  minimize future migration.
- Upgrade existing libraries, update consumers, and deploy to Production before
  the deprecation date.
- **Forge asset owners**: upgrade published assets early so consumers have time to
  test and roll out.
