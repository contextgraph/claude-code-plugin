---
name: work-top-backlog-item
description: Use when the user wants Claude Code to work the top Steward backlog item end-to-end. Claim the current top item with the steward CLI, create the correct branch/worktree, implement the work, open a linked PR, monitor PR checks and review threads, address feedback, and continue until the PR is green and merge-ready.
---

# Work Top Backlog Item

Use this skill when the user asks to work the next/top Steward backlog item, run the Steward queue, or continue a claimed Steward backlog PR until it is merge-ready.

The Steward CLI and GitHub CLI must be available and authenticated. If either is missing or unauthenticated, ask the user to run the required auth flow (`steward auth` or `gh auth login`) before claiming work.

## Operating Rules

- Claim exactly one backlog item at a time.
- Start from latest `origin/main` unless repository instructions explicitly say otherwise.
- Use the branch/worktree prepared by `steward backlog setup` when possible; it checks out the claim target expected by Steward.
- Do not abandon a claimed item silently. If the item is invalid, dismiss it with a concrete note. If you must pause or cannot continue, unclaim it with a concrete note to the user.
- Keep the PR linked to the backlog item through the registered claim branch. If the PR is opened from another branch, include the Steward backlog marker from the claim/top output in the PR body or run `steward backlog link-pr`.
- Continue after the PR is open. Do not stop at PR creation unless the user explicitly asks you to stop there.

## Workflow

1. Inspect repository instructions first: `AGENTS.md`, `CLAUDE.md`, README, package scripts, and CI docs.
2. Check current claims with `steward backlog claimed`. If there is already a claimed item for this repository/user, continue that item instead of claiming a second one unless the user explicitly asks for a new claim.
3. Inspect the highest-priority queued item with `steward backlog top`. If the user named a steward, pass `--steward <slug-or-id>`.
4. Read the top output carefully. Capture the backlog identifier/reference, repository URL, objective, rationale, suggested/proposed branch, and any PR body marker. If no branch is shown, derive a conservative branch from the backlog reference, such as `steward/<steward-slug>/<backlog-slug>`.
5. Fetch the target repository: `git fetch origin`.
6. Claim the exact item from the top output and register the branch you will push from. Do not claim from `main` without `--branch`.

```bash
steward backlog claim <backlog-id-or-reference> --branch <proposed-or-derived-branch>
```

7. Prepare the workspace:

```bash
steward backlog setup <backlog-id-or-reference> --base-ref origin/main
```

Use `--path <path>` only when the user requested a specific location. Use `--in-place` only when repository policy or the user's request requires the current checkout.
8. Move into the prepared worktree/branch and confirm it is clean and based on the intended base with `git status --short --branch`.
9. Implement the backlog item using normal repository practice. Keep scope tied to the claimed item and its steward lens.
10. Run the repository's required local validation. If no repository-specific contract exists, run the relevant build, test, lint, and typecheck commands. For this project, prefer the local CI-equivalent command when available.
11. Commit the change and push the claim branch.
12. Open a PR targeting `main`. The PR body must include:
    - concise summary
    - validation results
    - the Steward backlog marker if branch-based linking is not guaranteed
13. Verify the PR is linked to the backlog item. If not, run:

```bash
steward backlog link-pr <backlog-id-or-reference> --pr <pr-number-or-url>
```

14. Monitor the PR until merge-ready:
    - Use `gh pr checks --watch` or repeated `gh pr checks` for CI.
    - Use `gh pr view --comments --json reviews,comments,reviewDecision,mergeStateStatus,statusCheckRollup` for review state.
    - Use GitHub review-thread tooling when available for unresolved inline comments.
15. If checks fail, inspect logs, fix the cause, rerun local validation, commit, push, and watch checks again.
16. If reviewers or stewards leave actionable comments, address them in code or explain why no code change is appropriate, then push and re-check.
17. Repeat until required checks pass, review threads are resolved or answered, and the PR is not draft, blocked, or conflicted.
18. Report the PR URL, final validation state, and any merge blockers that remain outside the agent's control.

## PR Monitoring Loop

Use this loop after every push:

```text
while PR is not merge-ready:
  inspect CI status and review/comment state
  if CI failed:
    read failing logs, fix, validate locally, commit, push
  else if review comments are actionable:
    address or answer them, validate if code changed, commit, push
  else if branch is behind or conflicted:
    update from main, resolve conflicts, validate, push
  else if checks are pending:
    wait and poll again
  else:
    mark the PR merge-ready in the final response
```

Do not claim a new top item while the current claimed PR still has failing checks, unresolved actionable review feedback, or merge conflicts.

## Failure Handling

- No queued item: say there is no top backlog item to claim and stop.
- Claim rejected because another agent claimed it: rerun `steward backlog top` once and claim the new top item.
- Setup cannot create the worktree: do not hand-roll a conflicting branch name first. Read the error, check whether the item is already claimed with `steward backlog claimed`, and either continue the existing branch or unclaim with an explanation.
- Item is impossible, obsolete, or unsafe: do not open a placeholder PR. Dismiss with `steward backlog dismiss <id-or-ref> --note "<reason>"` only when the reason is specific and evidence-backed; otherwise unclaim it.
