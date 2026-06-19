---
name: work-backlog
description: Use when the user wants Claude Code to make progress on a Steward backlog. Two modes. With NO arguments it runs a conversational session — it shows the current backlog, asks what the user wants to accomplish (scope, how much, autonomy), does that work, then hands back a parameterized command to schedule as a nightly routine. With ARGUMENTS it runs directly with no conversation — a specific item (by id or reference), a steward's top item (by name/id), or a batch session (a max item count + scope + autonomy) suitable for an unattended nightly Claude Code Routine. A run tends in-flight backlog PRs (resolving conflicts, fixing CI, catching superseded work), claims and implements queued items through linked PRs, reconciles items whose work is already done, and reports what was done plus the decisions the user must make.
---

# Work Backlog

Make progress on a Steward backlog: tend the PRs already in flight, start new items, keep each linked PR moving toward merge-ready, and reconcile items whose work is already done (resolving the ones a steward already covered, dismissing the ones that went stale). The skill is **stateless** — every run is configured entirely by its arguments, never by saved state, so different people can run it different ways at different times.

## Modes of Invocation

Route on whether the user passed an argument:

- **No argument → Conversational session.** Show the current backlog, ask what they want to accomplish, do the agreed work, and end by emitting the exact command to schedule as a nightly routine. This is the guided, discover-by-talking entry point (the same shape as `/steward:define-steward`).
- **Argument(s) given → Direct run, no conversation.** Parse the arguments into a run config and execute. This is what an unattended nightly Claude Code Routine calls, and what the heartbeat email's one-paste command uses. Three argument shapes:
  - **A specific item** — an id, group id, or human-readable reference. Work that one item.
  - **A steward** — a steward name or id. Work that steward's top eligible item.
  - **Batch params** — a max item count and/or scope and/or autonomy (e.g. `--max-items 3 --steward accessibility --autonomy pr`, or natural language like "work 3 accessibility items, open PRs, don't merge"). Run a batch session.

If an argument is ambiguous between shapes (a name that could be a steward or an item), resolve it with `list_stewards` and `list_steward_backlog_items` before acting; ask only if it stays ambiguous.

## Run Config (the parameters)

Every direct run resolves to these. The conversational session fills them by asking; a routine command sets them explicitly. There is no persisted profile — the command line is the entire config.

- **scope** — repository-wide (default), a single `--steward <name|id>`, or a single named item.
- **max-items** — how many items the run may work before stopping (default **3** for a batch; exactly **1** for a single named item). Bounds an unattended run so a cron can't run unbounded.
- **autonomy** — how far each item goes:
  - `pr` (**default, and the only safe default for an unattended run**): implement, open a linked PR, stop. A human merges.
  - `merge`: additionally merge a PR once it is green and review-clean. Opt-in, higher trust — never the default for a routine that runs while the user is asleep.

## Conversational Session (no arguments)

1. Show the current backlog up front so the conversation is grounded: call `list_stewards` (pass `repository`) and note any in-flight backlog PRs. Lead with this, not with questions. Present per-steward counts as **open** (queued + in progress) and **resolved**, and break resolved work down by the `outcome_counts` the response carries — never a bare "Done / Dismissed" split. Resolved items divide into:
   - **Cleared** — `fixed` (code shipped), `verified` (the concern was valid but already covered — a steward win), and `finding` (an investigation recorded an answer). These are legitimate progress.
   - **Set aside** — `obsolete` (superseded / no longer relevant) and `deferred` (valid, not now). Neutral pruning, not waste.
   - **Miss** — `invalid` (the steward was wrong). This is the only count that signals wasted attention; surface it on its own rather than hiding it inside a "dismissed" total.

   So show e.g. "Cleared 6 · Set aside 16 · 2 miss", not "8 done, 18 dismissed". Clearing an already-covered or obsolete item is the loop working, not effort wasted — the labels must say so.
2. Ask what they want to accomplish, mapping their answer onto the run config: **scope** (whole repo, one steward, one item?), **how much** (how many items, or "just the top one"?), **autonomy** (open PRs and stop, or also merge what's green?). Keep it to the few questions that actually change the run; infer sane defaults for the rest and state them.
3. Run the agreed work using the **Direct Run** sections below (single item or batch).
4. **End by emitting the nightly routine command** — see **Emitting the Routine Command**. The point of the conversation is not just to do tonight's work; it is to hand the user the reproducible command so they can schedule it and stop typing it.

## Reconciliation (always on, both modes)

Backlog items go stale: the work gets done by other changes before the item is worked. Catching this is cheap here (you have the repo and the diffs) and expensive anywhere else, so it is a standing part of every run, not a flag.

- **Before implementing any claimed item**, verify the work is not already done. Check recent merged PRs, `git log`, and the actual current code for the item's objective. If the objective is already satisfied, do **not** implement or open a PR — close it with `manage_backlog_work` and a concrete, evidence-backed note naming what already did the work (the commit/PR), then move on. Pick the terminal outcome that tells the truth, because the counts are read as a win/miss signal:
  - The concern was **valid and is already covered** in the current code → `action: "resolve"` with `outcome: "verified"`. This is a steward **win** (Cleared), not a dismissal.
  - The work was **superseded or is no longer relevant** → `action: "dismiss"` with `outcome: "obsolete"` (the default). Neutral pruning (Set aside).
  - The concern was **wrong** — it never applied → `action: "dismiss"` with `outcome: "invalid"`. This is the only real **miss**; do not reach for it just because an item is being closed without code.
- **When tending an in-flight PR** (see batch session) you find merge conflicts or staleness, and resolving them reveals the work was superseded by more recent changes, treat that as the same signal: close the backlog item (`obsolete` if superseded, `verified` if the concern was valid and now covered) with evidence, and surface the PR as one to **close, not merge** (do not close someone's PR autonomously — flag it in the report as a decision for the user).
- Never close on a fuzzy hunch. It requires a specific artifact (a merged PR, a commit, code that already implements the objective). When unsure, leave the item and note the uncertainty in the report.

## Direct Run — Single Item (a specific item or a steward's top item)

This is the original single-item behavior and the path the heartbeat email's one-paste command uses.

### Selecting the item
- **Specific item.** If you have an id or unambiguous reference, use it directly. For a fuzzy reference, list candidates with `list_steward_backlog_items` (filter `states: ["queued"]`) and confirm before claiming; if it matches more than one, show the candidates and ask.
- **A steward's top item.** Resolve the steward with `list_stewards` (pass `repository` across multiple workspaces; if none matches, say so and list available stewards rather than guessing). List its queue with `list_steward_backlog_items` (`states: ["queued"]`), take the highest-priority queued item. If the steward's queue is empty, say so and stop; do not fall back to the repo-wide top item unless asked.

### Working the item
1. Inspect repository instructions first: `AGENTS.md`, `CLAUDE.md`, README, package scripts, CI docs.
2. Check for an existing local branch or open PR for a previously claimed item; continue it rather than claiming a second one unless the user asked for a new claim.
3. **Claim** with `manage_backlog_work` (`action: "claim"`). Omit `identifier` for the repo-wide top item; pass the resolved id/reference for a specific item or a steward's top item. Register the branch you will push (prefer the branch returned by a prior `peek`; else `steward/<short-task-slug>`).
4. Read the claim response: capture backlog identifier, steward, repository URL, objective, rationale, and registered branch. Confirm it is the item you intended.
5. `git fetch origin`. Prepare the local workspace on the exact registered branch — prefer `steward backlog setup <backlog-id-or-reference> --base-ref origin/main`; else create the worktree manually from `origin/main` with that exact branch. Confirm clean and correctly based with `git status --short --branch`.
6. **Reconcile (see above): is this already done?** If yes, dismiss with evidence and stop here.
7. **Plan-review with the steward via `consult`, then implement.** Draft a short implementation plan for the claimed item and consult the owning steward against that exact already-claimed item — do not re-select or re-resolve the item, so the consulted and claimed item can never diverge. Fold its guidance in; the steward's planning input is the highest-value part of working its item. Then implement against the reviewed plan, scope tied to the claimed item and its steward lens.
8. Run the repository's required local validation (build, test, lint, typecheck — prefer the local CI-equivalent command when one exists).
9. Commit and push the claim branch.
10. Open a PR targeting `main` with a concise summary and validation results. Verify the PR head branch is the registered claim branch — branch matching is the Steward backlog link.
11. Monitor the PR with the **PR Monitoring Loop** until merge-ready (single-item mode babysits to green; batch mode does not — see below).
12. If `autonomy: merge` and the PR is green, review-clean, and not draft/blocked/conflicted, merge it. Otherwise leave it for the user.
13. On a clean finish, close with the **Closing Stat Line**.

## Direct Run — Batch Session (max-items + scope, or a nightly routine)

A bounded session that makes broad progress, in two phases, then reports. This is the shape a nightly routine runs.

**Phase 1 — Tend in-flight PRs first.** Finish what is already started before beginning new work. For each backlog item in `proposed` / `in_progress` with an open linked PR, within scope:
- Inspect the PR (`gh pr view --json reviews,comments,reviewDecision,mergeStateStatus,statusCheckRollup`, `gh pr checks`).
- If conflicted: update from `main` and resolve. **If resolving reveals the work was superseded** (the #3078 case), reconcile: dismiss the item with evidence and flag the PR to close in the report. Do not merge or close it autonomously.
- If CI is red: read logs, fix, validate locally, push.
- If there is actionable review/steward feedback: address it or answer it, validate, push.
- If green and `autonomy: merge`: merge. Otherwise record its state for the report.

**Phase 2 — Start new items.** With remaining budget (`max-items` minus items already advanced in phase 1), claim and work queued items via the **Single Item** workflow above (reconcile → consult → implement → PR), highest priority first, within scope. In batch mode do **not** babysit each PR to green — open the linked PR, capture its CI/review state, and move to the next item. Stop when `max-items` is reached or the queue (within scope) is empty.

**Phase 3 — Report.** Emit the **Morning Report**.

Claim one item at a time; never hold multiple active claims. Respect `max-items` as a hard stop so an unattended run is bounded.

## Morning Report

The deliverable of a batch / routine run — what the user wakes up to. Keep it scannable, three sections:

1. **Done** — items completed this run: each with its title, the PR (number + link), and CI state. Items reconciled as already-done — name the outcome (cleared / set aside, e.g. `verified` or `obsolete`) and the artifact that superseded them; do not file a valid already-covered close under "dismissed".
2. **In flight** — backlog-driven PRs still open: each with number + link and current state (green / CI red / conflicted / awaiting review).
3. **Your call** — decisions only the user can make: PRs to merge, PRs flagged redundant to close (with the superseding PR), blocked items needing a human, anything the run deliberately left.

If nothing needed doing (no in-flight PRs to tend, queue empty within scope), say so in one line rather than padding the report.

## Emitting the Routine Command

At the end of a **conversational session**, print the exact command that reproduces the run config you just agreed on, so the user can schedule it as a nightly Claude Code Routine and never type it again. Use the flag grammar so it is reproducible:

```text
Schedule this nightly (Claude Code Routine) to wake up to a backlog report:

  /steward:work-backlog --max-items 3 --autonomy pr

(scope: whole repo · opens PRs, never merges · catches superseded items)
```

Adjust the flags to the agreed config (`--steward <name>` for a single steward, `--autonomy merge` if they opted into auto-merge, a different `--max-items`). Always state in one line what the command will and will not do, so scheduling it is an informed choice.

## Steward MCP Tools

The Steward MCP server must be connected. If its tools are unavailable, ask the user to run `/mcp`, confirm the `steward` server is connected, and authenticate if prompted. Use the Steward CLI only as a fallback for local helpers such as `steward backlog setup`; never for backlog lifecycle state. `gh` must be available and authenticated for PR creation, checks, and review inspection.

Use `manage_backlog_work` as the execution lifecycle tool:

- `action: "peek"` — inspect top eligible work without changing state.
- `action: "claim"` — claim eligible work and register the push branch. No `identifier` claims the repo-wide top item; an `identifier` (item id, group id, or reference) claims that exact item.
- `action: "release"` — unclaim when pausing or abandoning before completion.
- `action: "resolve"` — close an item whose deliverable is a recorded result rather than a pull request, with `outcome: "verified"` (the concern was valid and the code **already implements it** — no new code shipped; a steward win) or `outcome: "finding"` (an investigation **completed and recorded a result** — a decision/audit note). Reach for `resolve` whenever already-done work was legitimate: a `note`-shaped item that turns out already-covered resolves `verified` — it must never be dismissed `obsolete`, which would misreport a win as pruning. Check the item's intended deliverable (`pull_request` vs `note`) when deciding: a `pull_request` item superseded by another PR is a `dismiss`/`obsolete`, while a `note` item already satisfied is a `resolve`/`verified`.
- `action: "dismiss"` — close obsolete, impossible, superseded, or unsafe work with an evidence-backed reason and an `outcome`: `"obsolete"` (superseded / no longer relevant — the default), `"deferred"` (valid but postponed; requires `follow_up_item_id`), or `"invalid"` (the concern was wrong — a steward miss). Default to `obsolete` for already-done/superseded work; reserve `invalid` for concerns that genuinely never applied. Item dismiss returns `result: "dismissed"`, `target_type: "item"`, `backlog_item_id`, `steward_id`; group dismiss returns `result: "dissolved"`, `target_type: "group"`, `group_id`.

`list_stewards` and `list_steward_backlog_items` are reads — use them to resolve a named steward or find an item id/reference. Use `update_steward_backlog_item` / `create_steward_backlog_item` only for maintenance outside the normal lifecycle. The MCP surface does not create git worktrees or open PRs; use git and `gh` for those.

## Operating Rules

- Claim exactly one backlog item at a time.
- Reconcile before implementing — never build work that is already done.
- Plan-review with the steward (via `consult`) before implementing, against the already-claimed item. This is the point of working its item, not an optional extra.
- Start from latest `origin/main` unless repository instructions say otherwise. Use the exact branch returned by `manage_backlog_work`; the PR link is the branch match.
- Never abandon a claimed item silently: dismiss invalid/superseded work with a concrete note, or `release` with a note if you must pause.
- Continue after a PR is open (single-item mode) until merge-ready; in batch mode, capture PR state and move on.
- Respect `max-items` as a hard stop. Never auto-merge unless `autonomy: merge` was explicitly set.
- Never close another person's PR autonomously — flag it for the user.

## PR Monitoring Loop

Use after every push in single-item mode (batch mode opens the PR and moves on):

```text
while PR is not merge-ready:
  inspect CI status and review/comment state
  if CI failed:            read failing logs, fix, validate locally, commit, push
  else if review actionable: address or answer, validate if code changed, commit, push
  else if behind/conflicted: update from main, resolve, validate, push
  else if checks pending:   wait and poll again
  else:                     mark merge-ready
```

Do not claim a new item while a current claimed PR still has failing checks, unresolved actionable feedback, or conflicts.

## Closing Stat Line

On a clean single-item finish (skip if you released, dismissed, or stopped with merge blockers), end with a short backlog stat line — a quick reward and an invitation to take the next. Gather numbers cheaply: `list_stewards` (pass `repository`) for queued + cleared counts, `manage_backlog_work` `action: "peek"` for the next top item. One or two lines, not a status report:

```text
✓ Backlog: 6 queued across 3 stewards · 13 cleared. Next up: "Cache verdict lookups in review-policy" (testing steward).
Run /steward:work-backlog again to take it.
```

If the queue is empty: `✓ Backlog: 0 queued. The queue is clear — nothing left to claim.`

(In batch / routine mode the **Morning Report** replaces the stat line.)

## Failure Handling

- No queued item: say there is no top item to claim and stop.
- Named steward not found: do not guess — list available stewards with `list_stewards` and ask.
- Named steward's queue empty: say so and stop; do not fall back to the repo-wide top item unless asked.
- Named item not found / ambiguous: list matching queued items and ask; never claim a different item silently.
- Named item not eligible (already claimed/in progress/done/dismissed): report its state and stop.
- Claim lost to another agent: `peek` once, then claim the new top item if still appropriate — but if the user targeted a specific item/steward, report and confirm rather than silently substituting.
- Worktree setup fails: do not switch branch names. Read the error, look for an existing branch/worktree for the registered branch, continue there or `release` with an explanation.
- Item impossible/obsolete/superseded/unsafe: do not open a placeholder PR. `dismiss` with a specific, evidence-backed reason; otherwise `release`.
- Batch run hits an item it cannot complete: `release` it with a note, record it under "Your call" in the report, and continue with remaining budget rather than aborting the whole run.
