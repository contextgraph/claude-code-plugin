---
name: work-top-backlog-item
description: Use when the user wants Claude Code to work the top Steward backlog item end-to-end. Claim the current top item through the Steward MCP server, create the correct local branch/worktree, implement the work, open a linked PR, monitor PR checks and review threads, address feedback, and continue until the PR is green and merge-ready.
---

# Work Top Backlog Item

Use this skill when the user asks to work the next/top Steward backlog item, run the Steward queue, or continue a claimed Steward backlog PR until it is merge-ready.

The Steward MCP server must be connected. If Steward MCP tools are unavailable, ask the user to run `/mcp`, confirm the `steward` server is connected, and authenticate if Claude Code requests it. Use the Steward CLI only as a fallback for local workspace helpers such as `steward backlog setup`; do not use it for Steward backlog lifecycle state. The GitHub CLI must be available and authenticated for PR creation, checks, and review inspection.

## Steward MCP Tools

Use `manage_backlog_work` as the normal Steward execution lifecycle tool:

- `action: "peek"` - inspect top eligible work without changing state.
- `action: "claim"` - claim top eligible work for a repository scope and register the branch that will be pushed.
- `action: "release"` - unclaim work when pausing or abandoning before completion.
- `action: "dismiss"` - dismiss obsolete, impossible, or unsafe work with an evidence-backed reason.

`dismiss` accepts a backlog item identifier or a backlog group identifier. Item dismiss responses return `result: "dismissed"`, `target_type: "item"`, `backlog_item_id`, and `steward_id`. Group dismiss responses return `result: "dissolved"`, `target_type: "group"`, and `group_id`.

Use `list_steward_backlog_items`, `update_steward_backlog_item`, and `create_steward_backlog_item` only for steward maintenance outside the normal execution lifecycle.

The MCP surface does not create local git worktrees or open GitHub PRs. Use git and `gh` for those steps.

## Operating Rules

- Claim exactly one backlog item at a time.
- Start from latest `origin/main` unless repository instructions explicitly say otherwise.
- Use the branch returned by `manage_backlog_work`; it is the claim target expected by Steward.
- Use `steward backlog setup` when available to create the local worktree for an already-claimed item. If you create the worktree manually, use the exact claimed branch.
- Do not abandon a claimed item silently. If the item is invalid, dismiss it with a concrete note. If you must pause or cannot continue, unclaim it with a concrete note to the user.
- Keep the PR linked to the backlog item through the registered claim branch. Open and push the PR from that exact branch.
- Continue after the PR is open. Do not stop at PR creation unless the user explicitly asks you to stop there.

## Workflow

1. Inspect repository instructions first: `AGENTS.md`, `CLAUDE.md`, README, package scripts, and CI docs.
2. Inspect any existing local branch or open PR for a previously claimed Steward backlog item. If you can identify an active claimed item for this repository/user, continue it instead of claiming a second one unless the user explicitly asks for a new claim.
3. Peek top work with `manage_backlog_work` when you need context before naming the branch:

```json
{
  "action": "peek",
  "repositories": ["owner/repo-or-github-url"]
}
```

4. Choose the branch you will push. Prefer the branch returned by peek. If no peek was needed, use repository branch policy or a conservative branch such as `steward/<short-task-slug>`.
5. Claim the top item with `manage_backlog_work`:

```json
{
  "action": "claim",
  "repositories": ["owner/repo-or-github-url"],
  "branch": "steward/<short-task-slug>"
}
```

6. Read the claim response carefully. Capture the backlog identifier/reference, steward, repository URL, objective, rationale, and registered branch.
7. Fetch the target repository: `git fetch origin`.
8. Prepare the local workspace using the exact registered branch. Prefer the CLI helper when available:

```bash
steward backlog setup <backlog-id-or-reference> --base-ref origin/main
```

Use `--path <path>` only when the user requested a specific location. Use `--in-place` only when repository policy or the user's request requires the current checkout. If the CLI helper is unavailable, create the worktree manually from `origin/main` with the exact registered branch.
9. Move into the prepared worktree/branch and confirm it is clean and based on the intended base with `git status --short --branch`.
10. Implement the backlog item using normal repository practice. Keep scope tied to the claimed item and its steward lens.
11. Run the repository's required local validation. If no repository-specific contract exists, run the relevant build, test, lint, and typecheck commands. For this project, prefer the local CI-equivalent command when available.
12. Commit the change and push the claim branch.
13. Open a PR targeting `main`. The PR body must include:
    - concise summary
    - validation results
14. Verify the PR head branch is the registered claim branch. Branch matching is the Steward backlog link.
15. Monitor the PR until merge-ready:
    - Use `gh pr checks --watch` or repeated `gh pr checks` for CI.
    - Use `gh pr view --comments --json reviews,comments,reviewDecision,mergeStateStatus,statusCheckRollup` for review state.
    - Use GitHub review-thread tooling when available for unresolved inline comments.
16. If checks fail, inspect logs, fix the cause, rerun local validation, commit, push, and watch checks again.
17. If reviewers or stewards leave actionable comments, address them in code or explain why no code change is appropriate, then push and re-check.
18. Repeat until required checks pass, review threads are resolved or answered, and the PR is not draft, blocked, or conflicted.
19. Report the PR URL, final validation state, and any merge blockers that remain outside the agent's control.

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
- Claim rejected because another agent claimed it: call `manage_backlog_work` with `action: "peek"` once, then claim the new top item if it is still appropriate.
- Setup cannot create the worktree: do not switch to a different branch name. Read the error, check for an existing branch/worktree for the registered branch, and either continue there or unclaim with an explanation.
- Item is impossible, obsolete, or unsafe: do not open a placeholder PR. Use `manage_backlog_work` with `action: "dismiss"` only when the reason is specific and evidence-backed; otherwise use `action: "release"`.
