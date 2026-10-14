# Stories

One file per user story or technical task: `<ID>-<short-slug>.md`, for example `US-012-export-timesheet.md`. Start from [TEMPLATE.md](TEMPLATE.md).

When work on a story starts, Claude writes its ID to `.claude/state/current-story`. The change-log and publish hooks then tag their entries with it. That file is local and not committed.
