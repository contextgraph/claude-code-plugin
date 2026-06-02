---
name: define-steward
description: Use when defining, previewing, creating, activating, or updating a steward for a repository through the Steward MCP server. Inspect the codebase, draft a narrow rubric-centric steward spec, validate and preview it with configure_steward, create it only after user approval, then reconcile inventory and initialization artifacts from the coding agent.
---

# Define Steward

Use this skill when the user wants a new steward or wants to revise an existing steward. The goal is not to fill out a form. The goal is to define a narrow judgment lens that feels native to this repository and this user's work.

The Steward MCP server must be connected. If `prepare_steward_onboarding` or `configure_steward` is not available, ask the user to run `/mcp`, confirm the `steward` server is connected, and authenticate if Claude Code requests it.

A steward is an AI agent with one zone of concern. Every other artifact - its mission, review lens, backlog, metrics, notes, and first actions - starts from a small structured steward spec: an ownership zone, a rubric of 4-7 dimensions, and a thin layer of inventory, metric, and evidence anchors. The `configure_steward` MCP tool is the only path that writes a steward, and the coding agent owns the post-create activation work.

## Start Here

When this skill starts, first identify the current repository from the local git remote and call `prepare_steward_onboarding` with the concrete `owner/repo` slug.

Handle the response before doing any steward drafting:

- If `next_action` is `authenticate_mcp`, tell the user to complete the Claude Code MCP authentication browser handoff, then call `prepare_steward_onboarding` again.
- If `next_action` is `install_github_app`, give the user the returned install URL. Before sending them off, tell them: "These are two different things — first we connect your account to Steward, then we install a GitHub App so Steward can review PRs." After the browser handoff, return to Claude Code and call `prepare_steward_onboarding` again.
- If `next_action` is `choose_workspace`, call `prepare_steward_onboarding` again with the workspace selector requested by the response.
- If `next_action` is `fix_repository_access`, explain the reported access problem and stop until the user fixes it.
- If `next_action` is `define_steward`, continue in Claude Code. Do not send the user back through web onboarding.

After setup is ready, determine whether this is the user's first steward in this repository. Call `list_stewards` for the resolved workspace and filter to stewards scoped to the current `owner/repo` (matching `repositories` exactly, or workspace-wide stewards that would apply here). If `list_stewards` is unavailable or errors, treat the run as first-steward-in-repo by default rather than skipping orientation. A user can have other stewards in the workspace and still be a first-time user in this repo; do not gate on the workspace-wide count.

When this is the first steward in this repo, the orientation pause below is a required step. Do not propose, inspect, or suggest a zone — and do not ask the opening question — until you have delivered the 3-5 sentence explanation and the user has acknowledged or moved past it. The orientation must cover all three of:

- **Reach**: what a steward owns, and why a steward is useful because it is narrow. Tie this to Ryan's framing — "what is the reach of a steward" — and make it explicit that a steward's reach is one zone of concern, not a department or framework heading.
- **Rubric**: the 4-7 judgment dimensions that make this a good — "optimal" — steward rather than a generic label. The rubric is the steward's point of view, not decorative metadata, and it is what shows up in PR reviews, heartbeats, and consult responses.
- **Vigilance**: what the steward will actually do after creation — review every relevant PR or commit through this rubric, maintain its inventory, and surface concerns when the zone is at risk.

Keep it to 3-5 sentences total, written for this user and this repository (not boilerplate). A concrete opener you can adapt: "A steward is a focused AI agent that owns one narrow domain of your repository — it reviews PRs through its rubric, maintains an inventory of its zone, and gives advice when you work there." Mention that the coding agent will inspect the repo and configure inventory, metrics, notes, and first actions with the user rather than making them fill out a form. Then — and only then — ask the opening question.

When this is not the first steward in the repo, skip the orientation and go directly to the opening question; existing stewards in the same repo mean the user already understands the model.

When the user has not provided an explicit steward zone, ask one short question before inspecting or suggesting zones. Offer three ways in:

```text
How would you like to find this steward's zone?

A. You have a zone in mind — tell me what to watch.
B. Browse battle-tested steward prototypes — narrow lenses that work well across most codebases — and see which fit best here.
C. Inspect the repository and suggest zones grounded in your recent work.
```

All three modes end at the same place: one narrow zone grounded in this repository. They differ only in where the starting lens comes from — the user's intent (A), the prototype library (B), or recent repository activity (C). Every mode is still customized to this repo.

- A: the user names a zone. Inspect the repository to ground it before drafting.
- B: see "Battle-Tested Steward Prototypes" below. Give the short orientation, inspect the repository, then surface the three or four prototypes that fit best, each with one-line evidence. The user picks one; specialize it to this repo.
- C: inspect first, then offer three narrow options grounded in recent work, with one-line evidence for each.

Four options is the hard maximum for any choice menu. Never present five or more options in one question or structured choice menu; Claude Code rejects question menus with too many options. If you find more than four plausible zones or prototypes, show the best three or four and say you can inspect more if none fit. Default to asking the A/B/C question; do not jump straight to a mode C zone-suggestions menu unless the user asked for suggestions or already provided enough context to imply that they want them.

## Battle-Tested Steward Prototypes

Option B starts from a prototype: a narrow steward lens that has proven useful across many codebases. Prototypes are not canned stewards and not templates to paste. They are starting lenses — the narrow-decomposition work already done — that you still ground and specialize against this repository. A prototype tells you where to look; the rubric, inventory, and evidence still come from this repo's real artifacts.

When the user chooses B, give a short orientation (what a prototype is, and that you will fit one to their repo), inspect the repository, then surface the three or four prototypes that best fit, each with one-line evidence from this codebase. Do not list all of them; show the ones that fit. Once the user picks one, the workflow is identical to every other mode.

Current prototypes:

- **Auth & access boundary** — where identity is checked and enforced: route guards, session and token handling, permission checks.
- **Subscription / billing integrity** — plan state, entitlement gating, and webhook-driven billing transitions stay correct.
- **Data retention & PII** — what personal data is stored, where it flows, and whether deletion and retention paths exist.
- **Product analytics contracts** — event names, typed properties, emit sites, and dashboard alignment.
- **Product copy / brand voice** — user-facing strings: tone, terminology, and consistency across surfaces.
- **SEO** — crawlability, metadata, structured data, canonical URLs, sitemap and robots.
- **Dead code** — unreferenced exports, unreachable branches, orphaned files, and stale flags.
- **Perf budget** — latency, bundle size, and render cost measured against a budget.
- **External API surface** — public routes, webhooks, and versioning of backward-compatible contracts.
- **Background jobs & async correctness** — idempotency, retries, ordering, and failure handling in queues and cron.

Each prototype still has to pass the narrowness test for this specific repository. If a prototype is too broad for how this repo uses it, decompose it before drafting. Treat this as a starting set, not a fixed catalog.

## Workflow

1. Call `prepare_steward_onboarding` for the current repository and complete any returned setup handoff before continuing.
   Keep the resolved workspace slug from the readiness response. You will use it later to link the user directly to the steward page.
2. Call `list_stewards` and filter to stewards scoped to this repository. If there are none scoped to this repo, deliver the first-steward orientation above before anything else — reach, rubric, vigilance, in 3-5 sentences. This is a hard step, not a soft suggestion. Do not skip it when `list_stewards` is unavailable; deliver the orientation by default.
3. Ask how the user wants to find the zone — their own idea (A), a battle-tested prototype (B), or repository-grounded suggestions from recent work (C) — unless they already answered that in the prompt.
4. Inspect the repository before drafting anything.
5. Pick or refine one narrow ownership zone. Avoid broad stewards such as "Frontend", "Quality", or "Architecture"; if the user wants one of those, decompose it into a narrow lens that passes the narrowness test.
6. Before defining metrics or creating metric-related backlog items, call the `integration` MCP tool with `action: "list_measurement_capabilities"` for the resolved workspace or repository. Cross-reference the returned `providers` list against vendor SDKs and config you found during inspection; for any provider the repository uses whose workspace status is `not_configured`, surface the integration opportunity with the direct connection URL before drafting metrics. See _Integration Opportunities_ below.
7. Draft a spec. Only include currently sampleable metrics in `spec.metrics`; aspirational metrics belong in initialization backlog items until a real sampling path exists.
8. Call `configure_steward` with `action: "validate"`. Fix every blocking error.
9. Call `configure_steward` with `action: "preview"`. Show the user the rendered mission, rubric, inventory anchors, metric anchors, and the short operating model described below.
10. Ask for approval in natural language before writing.
11. Call `configure_steward` with `action: "apply"` only after the user clearly approves creating or updating the steward. After a successful create, show the direct steward page link using the resolved workspace slug and returned steward id.
12. If the tool returns `activation.next_action: "reconcile_inventory"`, narrate one short sentence to the user before scanning the repo — explain what the inventory is for this steward and that it is the cached memory the steward reads on every review and consult (and refreshes at heartbeat). Then inspect the repository and call `configure_steward` with `action: "reconcile_inventory"` before drafting initialization artifacts.
13. Before drafting or previewing initialization artifacts, show a steward readiness review covering reconciled inventory and metric measurability.
14. Draft initialization artifacts from repository evidence: a report and up to four first backlog items.
15. Call `configure_steward` with `action: "preview_initialization"`. Show the user the report summary and backlog items.
16. Ask for approval in natural language before saving initialization artifacts.
17. Call `configure_steward` with `action: "apply_initialization"` only after the user clearly approves saving the initialization report and backlog items.
18. End by offering two next steps: work one of the new backlog items, or define another steward.
19. For existing stewards, update only identity, repository scope, ownership zone, rubric dimensions, and status. Update mode does not seed or modify inventory, metrics, or evidence notes.

If the product handoff prompt includes a repository marker such as `contextgraph/<repo-name-needed>`, replace it with a concrete repository slug before calling `configure_steward`. Never call the tool while `<repo-name-needed>` or any other placeholder remains in `repository`, `spec.repositories`, inventory, metrics, or evidence.

## Repository Inspection

Read the actual repository, not generic best practices. At minimum:

- Top-level orientation: `README`, `AGENTS.md` / `CLAUDE.md`, `docs/`, and root scripts such as `package.json`, `pyproject.toml`, or `go.mod`.
- Layout: the top directories under `app/`, `src/`, `lib/`, `pkg/`, or wherever the code lives. Note heavy-traffic and quiet areas.
- Recent change pattern: latest 20-50 commit titles or recent PRs. Recurring themes are strong steward signals.
- CI and tests: how tests are organized, what CI runs, and which failures recur.
- Integrations and instrumentation: vendor SDKs and config such as PostHog (`posthog-js`, `posthog-node`, `posthog.capture` calls), Axiom (`@axiomhq/*`, Axiom dataset config), Langfuse (`langfuse`, `langfuse-node`), Datadog, Stripe, GitHub, Clerk, or Resend. Steward currently supports PostHog, Axiom, and Langfuse as live measurement providers; record every detected occurrence so step 6 can cross-reference workspace status and offer to connect any supported provider that the repo uses but the workspace has not configured.

The test for any candidate steward is narrowness, not where the idea came from. A heading like "Code Quality" or "Security" fails not because it is generic but because it is too broad to carry one rubric — it bundles many independent judgment lenses. Do not reject the topic; decompose it. Enumerate what "Code Quality" actually watches and you find real stewards inside it — "Dead code", "Test isolation", "Dependency hygiene" — and sometimes you must go a level deeper still. A steward is admissible once its zone is narrow enough that a single 4-7 dimension rubric covers it. This test applies to all three modes: a user's own idea, a prototype, and a recent-work suggestion each have to pass it.

## Integration Opportunities

Steward currently supports PostHog, Axiom, and Langfuse as live measurement providers. When the repository uses one of these providers but the workspace has not connected it, surface the opportunity rather than silently downgrading the metric to `needs_instrumentation`. A connected integration unlocks live metric sampling, dashboard alignment, and inventory reconciliation against real provider data, so missing the prompt is a missed onboarding moment.

After calling `integration` with `action: "list_measurement_capabilities"`, compare the response against the SDKs and config you observed during inspection:

- If a provider is in `providers` with `status: "connected"`, use it as a metric source where the query is grounded in real evidence.
- If a provider is in `providers` with `status: "not_configured"` and you observed that provider's SDK or config in the repository, treat that as an integration opportunity. Tell the user what you found, why connecting helps this steward, and give the direct setup link before drafting metrics.
- If a provider is `not_configured` and there is no repository evidence of that provider, do not bring it up. Do not pitch every supported provider to every user.

The direct integration link uses the resolved workspace slug:

```text
https://www.steward.foo/<workspace-slug>/settings/integrations/<provider>
```

`<provider>` is `posthog`, `axiom`, or `langfuse`. Use the exact `workspace.slug` from `prepare_steward_onboarding`. Phrase the prompt as a choice, not a blocker. For example, after detecting PostHog usage in a workspace where PostHog is `not_configured`:

```text
This repo uses PostHog - I saw `posthog-js` in package.json and `posthog.capture` calls in lib/analytics/events.ts - but the workspace is not connected to PostHog yet. Connecting it at https://www.steward.foo/<workspace-slug>/settings/integrations/posthog would let this steward use live event counts and dashboard data for metrics and inventory reconciliation. Want to connect it now, or proceed without and queue a backlog item to connect later?
```

If the user connects the integration mid-flow, call `integration` with `action: "list_measurement_capabilities"` again to refresh status before drafting metrics. If the user declines or wants to defer, do not block: draft the steward without that provider's metrics and queue a "Connect <provider>" initialization backlog item that names the same setup URL in its rationale.

## User-Facing Approval Language

`apply` and `apply_initialization` are internal `configure_steward` action names. Do not use "Apply?" as the user-facing prompt.

After the steward preview, ask something like:

```text
Does this seem right? Any questions or adjustments before I create this steward?
```

Before asking that approval question, briefly explain what this steward will do after initialization:

- Vigilance: it reviews every relevant PR or commit through this rubric and raises concerns when the zone is at risk.
- Mapping: it surveys the files, workflows, and recurring issues inside its zone and maintains its inventory — the cached memory it reads on every review and consult to recognize what it already knows about the zone.
- Advisor: it is available for focused consultation and chat when the user wants judgment about this domain.

Keep this operating model to three short bullets. Tie each bullet to the concrete steward being previewed rather than describing stewards generically.

After the initialization preview, ask something like:

```text
Does this initialization plan look right? Any changes before I save the note and first backlog items?
```

If the user says yes, go ahead, looks good, create it, save it, or similar, treat that as approval. If the user asks a question or requests a change, answer or revise before calling the write action.

## Steward Page Link

After `configure_steward` with `action: "apply"` succeeds, build the direct steward page URL from the resolved workspace slug and returned steward id:

```text
https://www.steward.foo/<workspace-slug>/stewards/<steward-id>
```

Use the exact `workspace.slug` from `prepare_steward_onboarding` and `steward.id` from the `configure_steward` response. Include this link in the creation success message and again after initialization artifacts are saved. If the workspace slug is unavailable, do not invent one; say that the steward is available in the Steward dashboard and include the steward id.

## Closing The Flow

After initialization artifacts are saved, do not end with only a success message. Include the direct steward page link and offer four concrete next steps:

```text
This steward is ready: https://www.steward.foo/<workspace-slug>/stewards/<steward-id>

Good next steps:
1. Work one of its new backlog items.
2. Define another steward for a different part of the repo.
3. Update CLAUDE.md so Claude runs steward_review after each commit and before pushing.
4. Update CLAUDE.md or relevant skills so Claude uses consult for steward advice before implementation starts.
```

If `/steward:work-top-backlog-item` is available, mention it as the fastest path for working the first backlog item — but scope the suggestion to the steward you just created, not the repository-wide top item. The repository's global top item may belong to a different steward, so tell the user to name this steward (or a specific new item) when invoking it, for example: "work the top backlog item for the <steward-name> steward" or "work the <item-reference> item". If that skill is not available, offer to inspect this steward's new backlog items and help choose one manually.

If the user wants to define another steward, restart this skill from the beginning and preserve the same principle: ask whether they already have a zone or want repository-grounded suggestions.

If the user wants to update CLAUDE.md or skills, inspect the repository instructions first and propose a narrow patch. For steward_review guidance, instruct Claude to run it on relevant commits or diffs after local changes and before push. For consult guidance, instruct Claude to ask the relevant stewards for advice before implementation when work touches an active steward domain.

## Rubric Architecture

Each steward is built around a rubric. The rubric is the steward's point of view; it shows up in PR reviews, heartbeats, and consult responses. Treat the rubric as the steward.

Pick 4 to 7 dimensions. Each dimension is one row in `rubric_dimensions: [{ name, description }]`.

Good dimensions are:

- Judgment-focused, not topical. "Event taxonomy" works because it implies criteria; "Analytics" does not.
- Non-overlapping. If two dimensions would both fire on the same PR for the same reason, merge them.
- Stable. Inventory and metric anchors reference dimension names exactly.
- Concrete. Use descriptions that say what the steward would point at.

Avoid:

- Org-chart or framework headings such as "Frontend", "Backend", or "Database".
- Dimensions that repeat the ownership zone.
- Mixing must-have and nice-to-have judgments under one dimension.
- Dimensions that require data the steward cannot see.

## Inventory, Metrics, And Evidence

These slots ground the steward in real artifacts. The create step seeds the durable artifact shells; after creation, the coding agent reconciles the actual inventory contents and writes the first initialization note and backlog items through activation actions. Update mode cannot edit inventory, metrics, or evidence.

Inventory is optional and at most one item. It is the steward's compact, complete, cached memory of its domain — and it is injected into **every review and consult**, not just re-read at heartbeat. That is what lets the steward recognize what it already knows (this surface is covered, this token is audited, this event already exists) instead of re-deriving it from the diff each time. Inventory must anchor to one or more rubric dimensions by exact name in `dimension_names`. When `apply` returns an inventory in `activation`, reconcile its entries immediately from the repository.

Because the whole inventory ships into every review, two properties matter equally: it must be **complete** (a partial catalog can't catch a naming collision or confirm coverage) and each row must be **lean** (a per-row size limit will be enforced at write time in a later change). Completeness is bounded by mission narrowness: if a complete inventory of lean rows would be too large to read on every review, the zone is too broad — narrow the mission, don't summarize the inventory.

**What a row is.** A row holds what review needs to know *now* about one thing — not how it got there. Inventories come in two shapes, and the row's content follows the shape:

- **Catalog** — enumerates a namespace and each member's *contract*. Examples: "Analytics event catalog" (event → properties), "Inngest workflow registry" (workflow → trigger → steps), "Public route inventory", "External API surface". A row is `name + key attributes + dimension anchor`. Review value is namespace completeness: collisions, duplicates, contract drift.
- **Coverage / audit** — enumerates a set of things and each one's *current status against a standard*. Examples: "Scanned accessibility surface inventory" (surface → is it gate-registered? → coverage mechanism → known-open gaps), "Endpoint authorization inventory" (endpoint → authz status → audit state). A row is `thing + current status + why`. Review value is the cached judgment: this is already covered / audited / a known accepted gap — don't re-flag it.

**What a row is never** (regardless of shape):

- **Change history** — "PR #696 then #698 did X/Y/Z", resolved-concern logs, `merged_at`. That belongs in notes.
- **Open work items** — "should add a test for X", undocumented-thing trackers. That belongs in the backlog.
- **Provider telemetry** — event volumes, user counts, last-seen timestamps. That is derived at heartbeat from the provider, not frozen into a row.

Keep the current answer; drop the journey and the open work. A 4 KB row stuffed with PR-by-PR narrative is the signal that history and work-tracking have leaked into the inventory.

Metrics are measurable health signals that let the steward answer "are we improving?" for one rubric dimension over time. Anchor each metric to a single rubric dimension by exact name in `dimension_name`. Avoid unmeasurable metrics such as "Developer happiness" and avoid metrics that only recount inventory size.

Treat the `integration` response as the account capability source of truth. Use an available source only when the query or endpoint is grounded in real repository or provider evidence; treat unavailable provider sources as unavailable even if the repository imports that vendor, uses that vendor for internal logging, or contains old scripts that mention it.

If the source needed for a metric is unavailable, mark the metric as `needs_instrumentation` and make the missing capability explicit. Do not implement provider setup scripts, seed scripts, local CLI assumptions, or direct database writes just to make the metric look configured. Instead, ask the user to choose one path: connect the integration, add product instrumentation, or expose a first-party measurement endpoint that returns `{"value": number}`.

Only include currently sampleable metrics in `spec.metrics`. A metric is sampleable now only when the agent can name the available source and the concrete query or endpoint that returns a numeric value. Aspirational metrics belong in initialization backlog items until a real sampling path exists.

When no metrics are sampleable yet, explain this in user terms:

- Metrics exist so the steward can track whether its zone is improving, not just describe concerns.
- A metric becomes active only when Steward can read a numeric value from a connected provider, product instrumentation, or a first-party JSON endpoint.
- Candidate metrics are useful now because they become concrete backlog items for adding that measurement path.

Do not lead with a list of unavailable providers unless it is directly relevant to the user's repo. Most users will not use every supported provider, so focus on the practical paths: connect an existing measurement provider, add product instrumentation, or expose a small repository-owned endpoint that returns the number.

Evidence is a short list of repository-specific anchors. Each line names a real file, workflow, or recurring issue. Five or fewer is plenty. If you cannot list two or three pieces of concrete evidence, the steward is probably too speculative.

## Activation Actions

Creation is not complete when `action: "apply"` returns. The returned `activation.next_action` tells you what to do next. These are not separate MCP tools; they are action values passed to the same `configure_steward` tool.

Before scanning the repository to reconcile inventory, tell the user what is happening in one short sentence. Name the inventory (for example "the analytics event catalog" or "the interactive surface inventory") and say it is the cached memory this steward reads on every review and consult to recognize what it already knows about the zone. Do not skip this narration — the inventory step is invisible otherwise.

If the next action is `reconcile_inventory`, call:

```json
{
  "action": "reconcile_inventory",
  "steward": { "id": "created-steward-uuid" },
  "inventory": {
    "inventory_id": "inventory-uuid-from-activation",
    "entries": [
      {
        "key": "stable-entry-key",
        "value": {
          "name": "Human-readable entry name",
          "description": "The current contract or coverage status review needs to know — not how it got there.",
          "paths": ["path/to/file.ts"],
          "dimension_names": ["Dimension one"]
        }
      }
    ],
    "summary": "What was reconciled and what the steward should remember."
  }
}
```

Use stable keys that will still make sense after files move. Prefer keys such as route names, event names, API names, workflow names, or component names over raw file paths. Do not send duplicate keys.

Keep each row lean enough to read on every review: the current contract (catalog) or current status and why (coverage), plus paths and dimension anchors. Leave change history for notes, open work for the backlog, and provider telemetry for heartbeat-derived metrics. A row that needs a paragraph of PR-by-PR narrative is carrying material that belongs elsewhere — the write-time per-row size limit will reject it, and the fix is to move that material out, not to split the fact across keys.

Before drafting or previewing initialization artifacts, show a steward readiness review and ask whether it looks right.

Inventory review:

- Name the inventory and the number of reconciled entries.
- Show representative entries, not just a count.
- Explain what the inventory covers, and whether it is a catalog (contract per member) or a coverage/audit inventory (status per member).
- Confirm rows are on-shape: current contract or status, not change history, open work, or telemetry.
- Call out gaps, uncertain entries, or scope boundaries — and whether a complete inventory stays small enough to read on every review (if not, the zone may be too broad).

Metric review:

- Lead with the "are we improving?" framing: metrics let the steward answer that question for one rubric dimension over time. They are not decoration on the spec.
- If any metrics are sampleable now, list each one with its rubric dimension, measurement source, and the concrete query or endpoint.
- If no metrics are sampleable, keep this section short. Say so in one or two sentences and move on. Do not enumerate every provider that is unavailable, do not list speculative "candidate metrics" the user did not ask for, and do not turn the absence of metrics into its own backlog. Briefly mention that measurement can be added later via a connected integration, product instrumentation, or a first-party endpoint, and offer to add a backlog item only if there is a concrete, repository-grounded measurement worth tracking for this steward today.
- Convert each needs-instrumentation metric the user does want into a concrete initialization backlog item instead of keeping it in `spec.metrics`.

After inventory reconciliation, or immediately after create when there is no inventory, draft initialization artifacts and call:

```json
{
  "action": "preview_initialization",
  "steward": { "id": "created-steward-uuid" },
  "initialization": {
    "report": "A repository-grounded initialization note of at least 100 characters. Explain what you inspected, what the steward now owns, what evidence supports the domain, and what future work it should watch.",
    "backlog_items": [
      {
        "repository_url": "https://github.com/owner/repo",
        "title": "Concrete first action",
        "objective": "What should change or be checked.",
        "rationale": "Why this matters for the steward's domain.",
        "file_paths": ["path/to/file.ts"],
        "priority_category": "should",
        "intended_deliverable": "pull_request"
      }
    ]
  }
}
```

Show the preview to the user. After approval, call the same payload with `action: "apply_initialization"`.

Backlog items must be specific and grounded in files the agent inspected. Use `must`, `should`, or `could` for `priority_category`. Zero backlog items is acceptable when the steward is ready but there is no honest first action.

Set `intended_deliverable` to declare the artifact the item is expected to produce — `pull_request` for code-change work (the default and the common case) or `note` for an investigation, verification, or learning item whose deliverable is a recorded finding rather than a code change (the answer is the deliverable). Reach for `note` when the title frames a question to answer — "Find out whether X is gated", "Confirm Y handles concurrent writes", "Map where Z fans out" — and the honest outcome is a recorded finding even if it turns out nothing needs to change. Reach for `pull_request` (or omit the field) when the item names a code change the steward expects to ship. Mix both kinds freely on the same initialization: a measurement gap is usually a `pull_request` to add instrumentation, while a coverage audit of an unfamiliar surface is usually a `note`. In the preview, name each item's deliverable type so the user can correct the framing before approval.

## Spec Contract

```json
{
  "action": "validate",
  "repository": "owner/repo",
  "spec": {
    "name": "Short domain-specific name",
    "repositories": ["owner/repo"],
    "ownership_zone": "One concrete domain this steward owns.",
    "rubric_dimensions": [
      { "name": "Dimension one", "description": "Judgment criterion." },
      { "name": "Dimension two", "description": "Judgment criterion." },
      { "name": "Dimension three", "description": "Judgment criterion." },
      { "name": "Dimension four", "description": "Judgment criterion." }
    ],
    "inventory": {
      "name": "Catalog name",
      "description": "What is kept in the catalog and how it is maintained.",
      "dimension_names": ["Dimension one"]
    },
    "metrics": [],
    "evidence": [
      "Concrete file, workflow, or incident from this repo."
    ],
    "status": "active"
  }
}
```

- The `owner/repo` values above are shape placeholders. Replace them with concrete repository slugs from the user's workspace before calling `configure_steward`.
- `name`, `ownership_zone`, and every rubric dimension `name` / `description` are required and non-empty.
- `rubric_dimensions` must have 4 to 7 entries with unique names.
- `inventory.dimension_names` must each match a rubric dimension name exactly.
- Each `metrics[i].dimension_name`, when set, must match a rubric dimension name exactly.
- `metrics` may be empty. Populate it only with metrics that are sampleable now.
- `repositories` accepts concrete `owner/repo` slugs or full GitHub URLs; the server canonicalizes them.
- Empty `repositories` means the steward is scoped to every installed repository in the resolved workspace. Use it intentionally.

## Worked Example: Analytics Contracts

```json
{
  "action": "preview",
  "repository": "owner/repo",
  "spec": {
    "name": "Analytics Contracts",
    "repositories": ["owner/repo"],
    "ownership_zone": "Product analytics event contracts, emit sites, and downstream dashboard alignment.",
    "rubric_dimensions": [
      { "name": "Event taxonomy", "description": "Events have stable names, typed properties, and clear ownership." },
      { "name": "Emit-site discipline", "description": "Tracking calls use approved boundaries rather than ad hoc payloads." },
      { "name": "Dashboard alignment", "description": "Dashboards consume events the product actually emits." },
      { "name": "Change restraint", "description": "Schema changes include migration or communication evidence when needed." }
    ],
    "inventory": {
      "name": "Analytics event catalog",
      "description": "Known events, emit sites, properties, and dashboard consumers.",
      "dimension_names": ["Event taxonomy", "Dashboard alignment"]
    },
    "metrics": [],
    "evidence": [
      "app/signup/page.tsx emits onboarding events consumed by the activation dashboard.",
      "lib/analytics/events.ts declares named event constants used across emit sites."
    ],
    "status": "active"
  }
}
```

## Worked Example: Interactive Accessibility

```json
{
  "action": "preview",
  "repository": "owner/web",
  "spec": {
    "name": "Interactive Accessibility",
    "repositories": ["owner/web"],
    "ownership_zone": "Keyboard, semantic, and assistive-technology accessibility for authenticated product UI flows.",
    "rubric_dimensions": [
      { "name": "Keyboard reachability", "description": "Every interactive control is reachable and operable without pointer input." },
      { "name": "Focus management", "description": "Route changes, dialogs, and async panels move or restore focus predictably." },
      { "name": "Semantic structure", "description": "Headings, landmarks, labels, and roles expose the UI's intent to assistive technology." },
      { "name": "Form and error affordances", "description": "Inputs, validation errors, and status changes have programmatic names and descriptions." },
      { "name": "Contrast and readability", "description": "Text, icons, and controls remain legible across normal, hover, focus, disabled, and loading states." }
    ],
    "inventory": {
      "name": "Interactive surface inventory",
      "description": "Routes, dialogs, forms, navigation regions, and reusable controls with accessibility obligations.",
      "dimension_names": ["Keyboard reachability", "Semantic structure", "Form and error affordances"]
    },
    "metrics": [],
    "evidence": [
      "components/ui/dialog.tsx defines focus boundaries for authenticated workflows.",
      "__tests__/accessibility/wcag-color-contrast.test.ts checks contrast regressions.",
      "Dashboard routes contain forms, filters, and controls that must work without pointer input."
    ],
    "status": "active"
  }
}
```

## Update Shape

```json
{
  "action": "preview",
  "steward": { "id": "existing-steward-uuid" },
  "spec": {
    "name": "Analytics Contracts",
    "repositories": ["owner/repo"],
    "ownership_zone": "The revised narrow domain.",
    "rubric_dimensions": [
      { "name": "Dimension one", "description": "A concrete judgment criterion." },
      { "name": "Dimension two", "description": "A concrete judgment criterion." },
      { "name": "Dimension three", "description": "A concrete judgment criterion." },
      { "name": "Dimension four", "description": "A concrete judgment criterion." }
    ],
    "status": "active"
  }
}
```

Update mode can change identity, repository scope, ownership zone, rubric dimensions, and status. It refuses `inventory`, `metrics`, and `evidence`; those belong to create and activation flows.

## Guardrails

- Prefer repository evidence over generic best practices.
- If this is the user's first steward in this repository, deliver the reach / rubric / vigilance orientation before any zone proposal, suggestion menu, or opening question. The orientation is required, not optional, even when `list_stewards` is unavailable.
- Offer the three entry modes — the user's own zone (A), a battle-tested prototype (B), or recent-work suggestions (C) — before generating a zone menu, unless the user already chose one.
- Narrowness is the admission test for every steward, in all three modes. Decompose broad headings instead of rejecting the topic.
- Replace every handoff marker before validation or preview. A value like `contextgraph/<repo-name-needed>` is a hint, not a valid spec.
- Keep dimension names stable; inventory and metric anchors match names exactly.
- An inventory row holds what review needs to know now about one thing — its current contract (catalog) or current status and why (coverage). Keep rows lean; leave change history for notes, open work for the backlog, and provider telemetry for heartbeat-derived metrics.
- Keep the inventory complete and narrow enough that the whole thing reads cheaply on every review; if it would not, narrow the mission rather than summarizing the inventory.
- Include `inventory`, `metrics`, and `evidence` only when creating a steward. Omit them for update mode.
- After creating a steward, follow the returned `activation.next_action` until it is `done`.
- Before drafting metrics, cross-reference detected provider SDKs against the `integration` response. If the repo uses a supported provider that the workspace has not connected, offer the setup link rather than silently dropping the metric to `needs_instrumentation`.
- Do not skip initialization. If inventory or initialization feels uncertain, inspect more repository evidence before previewing.
- After initialization, offer to work a new backlog item or define another steward.
- If the tool asks for workspace disambiguation, use `repository` first. Use `workspace_id` only when supplied by the product page or user.
- Do not say "Apply?" to the user. Ask whether the steward or initialization plan seems right and whether they want adjustments before creating or saving.
- Do not create or update a steward that the user has not approved.
- If the user asks for a steward outside the inspected repo's real work, say what evidence is missing and preview a narrower alternative.
