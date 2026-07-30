---
name: deploy
description: Deploy this repo via git. Use when the user asks to "deploy", "ship", or "release". Refreshes documentation (runs /init and updates README.md), then commits all changes on the current branch and pushes it, and (if not already on main) merges into main and pushes main.
---

# Deploy

Run this when the user asks to deploy the project. Perform the steps below in order. Stop and report if any step fails — do not force-push or skip steps.

## Steps

1. **Refresh `CLAUDE.md` (run `/init`).** Invoke the `/init` skill so `CLAUDE.md` reflects the current codebase — build/package commands, conventions, and the structure of the repo. If `CLAUDE.md` already exists, `/init` improves it in place rather than starting over.

2. **Update `README.md`.** Bring the repo-level `README.md` up to date so it documents the project **organized by the repository's folder structure**. Create it if it does not exist yet.
   - Structure the README to mirror the top-level layout: one section per top-level folder/area. Today that is `odc-outsystems-extensions/` (the ODC external libraries), with a sub-entry per extension (e.g. `CompareObjects/`, `Shapefile/`) summarizing what each does — pull from each extension's `RELEASE_NOTES.md`.
   - The repo is intended to hold **more than just extensions over time** (e.g. JavaScript files and other assets). Keep the layout **extensible**: use a section per category of content so new top-level folders (scripts, snippets, docs, etc.) each get their own section as they are added. When new top-level folders exist in the tree, add a section for them.
   - Keep it a concise map of "what lives where and what it's for", not exhaustive API docs (those live in each area's own notes).

3. **Commit all changes on the current branch.**
   - Note the current branch (`git branch --show-current`).
   - Stage everything: `git add -A`.
   - Commit with a concise message describing what's being deployed. If there is nothing to commit, say so and continue.

4. **Push the current branch to remote.** `git push origin <current-branch>`.

5. **Merge into main (only if not already on main).**
   - If the current branch is `main`, skip this step and step 6's checkout.
   - Otherwise: `git checkout main`, `git pull origin main` (fast-forward remote changes first), then `git merge <previous-branch>`. Prefer a fast-forward or clean merge; if there are conflicts, stop and report.

6. **Push main to remote.** `git push origin main` — **pre-authorized**: `.claude/settings.json` grants `Bash(git push origin main:*)`, so push directly without asking. If you switched branches in step 5, `git checkout <previous-branch>` afterward to return to the working branch.

7. **Report.** Summarize the doc updates, what was committed, the merge result (or that it was skipped), and that both branches are pushed.

## Notes

- Commit messages: end with the standard `Co-Authored-By` trailer per repo convention.
- **Pushing to `main` is allowed for this workflow** — `.claude/settings.json` carries a
  `Bash(git push origin main:*)` allow rule, so the push runs without a permission prompt. This
  authorizes the `main` push only; force-pushing still requires explicit user approval.
- Never use `--no-verify` or force-push unless the user explicitly asks.
- Documentation lives at two levels: repo-level (`CLAUDE.md`, `README.md`) refreshed here, and
  per-area notes (each extension's `RELEASE_NOTES.md`) maintained where that content lives.
