---
name: outsystems-mcp-code-review
description: Review gate for changes made to an OutSystems module through the Service Studio MCP (applyModelApiCode / omlMerge). After an implementation, it produces a detailed per-element list of every change (entities, attributes, structures, actions, blocks, screens, roles, CSS, settings), shows it as an interactive Yes/No review form with a reason box for each "No" and one Submit button, then either publishes (all Yes and no validation errors) or fixes the rejected items and regenerates the full list with the fixed rows highlighted in yellow. Use this skill whenever an OutSystems user story, technical task or set of Model API changes has just been implemented through Service Studio MCP and before anything is published. Also use it when the user says "review the changes", "code review", "show me what changed", "list the changes", "can I publish", "review before publish", or names outsystems-mcp-code-review, even if they don't explicitly ask for a form.
---

# OutSystems MCP code review

The purpose is to let a human developer verify every change Claude made to an OutSystems module **in Service Studio itself** before it is published, and to keep fixing until they approve everything. Publishing is the only irreversible step. It only happens after an explicit, complete "all Yes" from the user and a clean validation.

The loop:

```
implementation done
  -> 1. make sure the changes are merged (visible in Service Studio, not published)
  -> 2. build the change ledger (one row per element)
  -> 3. show the review form (Yes / No + reason, Submit)
  -> 4. read the answers
        all Yes + 0 validation errors -> 5. publish
        any No, or validation errors  -> 6. fix -> merge -> back to 2 (full list, fixed rows in yellow)
```

Service Studio MCP tools are named `mcp__servicestudio__*`. If their schemas are not loaded, load them with ToolSearch first. Every call needs the session token from `createSessionToken`. Reuse the token already obtained in this conversation, and only create one if none exists. Make **read calls one at a time**: parallel reads have been seen to fail with "OML not found" temp-file errors.

## 1. Make the changes reviewable

The user reviews in Service Studio, so the changes must be in the open module but **not published**.

- If the implementation's last `applyModelApiCode` result has a `mutatedOmlPath` that hasn't been merged yet, call `omlMerge` with it. Depending on the user's settings, Service Studio may open its Compare-and-Merge window. That's expected; wait for the result.
- If `merged` is false, stop. Tell the user that the merge couldn't be auto-resolved and what they need to do in Service Studio. Don't build the list for changes that aren't in the module.
- Never call `omlPublish` in this step.

## 2. Build the change ledger

### Where the changes come from

Use, in order of reliability:

1. The `applyModelApiCode` lambdas executed for this implementation in the conversation. They are the exact record of what was created, modified or deleted.
2. The read tools (`getDataModel`, `getStructures`, `getActionNames`, `getServerAction`, `getClientAction`, `getScreen`, `getWebBlock`, `getRoleNames`, `getSettings`, `getTheme`, `getTimers`, …) to **confirm each element really exists in the module** in its final form. Don't list something you only intended to do. If a change is missing from the module, say so in the row and pre-mark it in the summary as a problem.
3. If earlier rounds exist, the previous ledger in the review log (see "Review log").

If the conversation was summarised and the lambdas are gone, rebuild the ledger from the read tools, comparing against the user story's implementation steps. Tell the user the list was reconstructed.

### What counts as one row

One row per **model element** that was created, modified or deleted:

| Element kind | Path format (as it appears in Service Studio) |
|---|---|
| Entity / static entity | `Data › Database › DaySheet` |
| Structure | `Data › Structures › CalendarDay` |
| Site property / client variable / session variable | `Data › Site Properties › DailyExpectedMinutes` |
| Server / client / service action | `Logic › Server Actions › SaveDaySheet` |
| Role | `Logic › Roles › SheetUser` |
| Timer | `Processes › Timers › Bootstrap` |
| Screen | `Interface › UI Flows › MainFlow › MySheet` |
| Block | `Interface › UI Flows › SheetBlocks › HoursCalendar` |
| Theme / CSS | `Interface › Themes › ClaudeSheet` (one row per stylesheet touched) |
| Image / resource / script | `Interface › Images › logo` |
| Module properties | `Module properties` |

Sub-elements (attributes, indexes, records, input/output parameters, local variables, widgets, data actions, event handlers) go **inside their parent's row** as the detail list. A sub-element gets its own row only when it is the only thing that changed in an element that already existed (for example, one attribute added to an existing entity). This keeps the list per element without hiding anything.

Order the rows by section: Data → Logic → Processes → Interface → Theme → Other, and within a section in the order they were created.

### What each row contains

- **ID**: `C01`, `C02`, …, stable across rounds. A row keeps its ID in later rounds. New rows created by a fix get the next free number.
- **Change type**: Created / Modified / Deleted.
- **Path**: where to click in Service Studio.
- **What changed**: concise, concrete facts the reviewer can check against the module, for example:
  - entity: every attribute with type, length, mandatory, default, delete rule; indexes (unique?)
  - action: inputs/outputs with types, the main flow steps, aggregates and their filters, the role check, exceptions raised
  - screen/block: inputs, events, local vars, data actions, main widgets and their bindings, event handlers
  - CSS: the classes/variables added
- **Covers**: the acceptance criteria / implementation steps it serves (for example `AC2.9, step 16`), when a user story is known.
- **Round status**: `New`, `Unchanged`, or `Fixed in round N`. For fixed rows, also give the user's original "No" reason and what was done about it.

Before showing the form, check yourself: does every executed lambda map to at least one row, and does every row map to something that exists in the module? Missing rows defeat the purpose of the review.

## 3. Show the review form

Send a short text intro first: module, story, round number, number of rows, number of fixed rows. Below the form, give a compact markdown summary table (ID, type, path) so the list stays readable in the transcript.

Render the form with the inline widget tool (`mcp__visualize__show_widget`; call `mcp__visualize__read_me` with modules `["elicitation"]` once beforehand if it hasn't been read in this conversation). Use the template in `references/review-form-template.html`. It relies on the elicitation shell: Yes/No pills per row, "No" reveals a reason box, and one Submit button. No script is needed.

- **The full list every time.** Every round shows all rows, including those approved before, because a fix can have side effects on rows that were already approved.
- **Rows fixed in this round are highlighted in yellow** (the template's `fixed` row style) and carry the "Fixed in round N" note with the original reason.
- Set the header title to `"<Module> · <story> · round N review"` so rounds are distinguishable.
- Keep the per-row text tight (a few lines). Put long details (for example a full attribute list) as a compact comma-separated line, not paragraphs.

If the widget tool isn't available, fall back to a markdown table with the same rows. Ask the user to reply with lines like `C03 No: <reason>` and "all others Yes". Don't use AskUserQuestion for this: it only fits 4 questions and has no single submit.

## 4. Read the answers

The submitted payload arrives as one line, for example `… — C01: Yes · C02: No · C02 (other): wrong delete rule · C03: Yes …`.

- **Every row must have an answer.** If any row is unanswered, list the missing IDs and show the form again (same round, same highlighting). Don't treat silence as Yes.
- **A "No" without a reason**: ask for the reason in chat before fixing. Guessing what the reviewer disliked usually produces a second wrong fix.
- **Skipped form**: nothing is approved; ask what they want to do.
- Save the round to the review log (below) before acting.

## 5. All Yes: validate and publish

1. Call `getValidationMessages` with filter `["error"]`.
2. **Errors > 0**: don't publish. Turn each error into a new row (type `Validation error`, path = `ownerPath`, detail = message + detail). Fix them as in step 6, then show the full list again. Errors block publishing even if every row was approved, because a module with errors can't be published anyway and the fix changes code the user hasn't seen.
3. **0 errors**: call `omlPublish` (input `{ eSpaceName }`).
   - `blocked`: the user hasn't granted the publish write permission in the Service Studio MCP Server dialog. Tell them to grant it, then retry when they confirm.
   - Failure: report the publish messages verbatim and treat them like validation errors (new rows → fix → review again).
   - Success: report it, along with the number of rows approved and rounds taken. Mention any validation **warnings** for information only; warnings don't block.

Only publish in response to a submitted form where every row is Yes. A "looks fine" in chat about a partial list is not approval of the full list.

## 6. Any No: fix, merge, regenerate

1. For each "No" row, fix exactly what the reason describes with `applyModelApiCode`. Keep the fix scoped: don't refactor rows that were approved unless the fix requires it. If it does, those rows also become `Fixed in round N` (yellow) with a note explaining why they changed.
2. If a reason conflicts with the user story or acceptance criteria, or would break another approved element, ask before changing it.
3. `omlMerge` the new `mutatedOmlPath`, then confirm the fix with the read tools.
4. Go back to step 2 with round N+1: full list, fixed rows in yellow, other rows `Unchanged`.

If the same row is rejected 3 rounds in a row, stop and talk it through in chat instead of trying a fourth fix blindly.

## Review log

Keep a markdown log per review so the user has a history of what was rejected and why:

`~/.claude/outsystems-reviews/<eSpaceName>/<story-id or yyyy-mm-dd-short-name>.md`

Append one section per round: date and time, the full ledger table (ID, type, path, status), the answers (Yes/No + reasons), and the outcome (fixed rows, validation errors, published or not). Link the file to the user when the review ends.

## Things to keep in mind

- The reviewer is a developer reading the module in Service Studio. Use OutSystems vocabulary (aggregate, data action, OnParametersChanged, delete rule) and exact element names, so every row can be located and checked in seconds.
- Never present intended changes as done. If a lambda failed or a merge didn't apply, the row must say so.
- Never publish outside step 5, and never in the same turn as the form is shown.
