---
name: deploy
description: Deploy this repo via git. Use when the user asks to "deploy", "ship", or "release". Commits all changes on the current branch and pushes it, then (if not already on main) merges into main and pushes main.
---

# Deploy

Run this when the user asks to deploy the project. Perform the steps below in order. Stop and report if any step fails — do not force-push or skip steps.

## Steps

1. **Commit all changes on the current branch.**
   - Note the current branch (`git branch --show-current`).
   - Stage everything: `git add -A`.
   - Commit with a concise message describing what's being deployed. If there is nothing to commit, say so and continue.

2. **Push the current branch to remote.** `git push origin <current-branch>`.

3. **Merge into main (only if not already on main).**
   - If the current branch is `main`, skip this step and step 4's checkout.
   - Otherwise: `git checkout main`, `git pull origin main` (fast-forward remote changes first), then `git merge <previous-branch>`. Prefer a fast-forward or clean merge; if there are conflicts, stop and report.

4. **Push main to remote.** `git push origin main` — **pre-authorized**: `.claude/settings.json` grants `Bash(git push origin main:*)`, so push directly without asking. If you switched branches in step 3, `git checkout <previous-branch>` afterward to return to the working branch.

5. **Report.** Summarize what was committed, the merge result (or that it was skipped), and that both branches are pushed.

## Notes

- Commit messages: end with the standard `Co-Authored-By` trailer per repo convention.
- **Pushing to `main` is allowed for this workflow** — `.claude/settings.json` carries a
  `Bash(git push origin main:*)` allow rule, so the push runs without a permission prompt. This
  authorizes the `main` push only; force-pushing still requires explicit user approval.
- Never use `--no-verify` or force-push unless the user explicitly asks.
