---
name: define-steward
description: Use when defining, previewing, creating, activating, or updating a steward for a repository through the Steward MCP server. Inspect the codebase, draft a narrow rubric-centric steward spec, validate and preview it with configure_steward, apply it only after user approval, then reconcile inventory and initialization artifacts from the coding agent.
---

# Define Steward

Use this skill when the user wants a new steward or wants to revise an existing steward. The goal is not to fill out a form. The goal is to define a narrow judgment lens that feels native to this repository and this user's work.

The Steward MCP server must be connected. If the `configure_steward` tool is not available, ask the user to run `/mcp`, confirm the `steward` server is connected, and authenticate if Claude Code requests it.

A steward is an AI agent with one zone of concern. Every other artifact - its mission, review lens, backlog, metrics, notes, and first actions - starts from a small structured steward spec: an ownership zone, a rubric of 4-7 dimensions, and a thin layer of inventory, metric, and evidence anchors. The `configure_steward` MCP tool is the only path that writes a steward, and the coding agent owns the post-create activation work.

## Workflow

1. Inspect the repository before drafting anything.
2. Pick one narrow ownership zone. Avoid broad stewards such as "Frontend", "Quality", or "Architecture" unless the user explicitly wants that breadth.
3. Draft a spec.
4. Call `configure_steward` with `action: "validate"`. Fix every blocking error.
5. Call `configure_steward` with `action: "preview"`. Show the user the rendered mission, rubric, inventory anchors, and metric anchors.
6. Ask for approval before writing.
7. Call `configure_steward` with `action: "apply"` only after approval.
8. If the tool returns `activation.next_action: "reconcile_inventory"`, inspect the repository and call `configure_steward` with `action: "reconcile_inventory"` before drafting initialization artifacts.
9. Draft initialization artifacts from repository evidence: a report and up to four first backlog items.
10. Call `configure_steward` with `action: "preview_initialization"`. Show the user the report summary and backlog items.
11. Ask for approval before saving initialization artifacts.
12. Call `configure_steward` with `action: "apply_initialization"` only after approval.
13. For existing stewards, update only identity, repository scope, ownership zone, rubric dimensions, and status. Update mode does not seed or modify inventory, metrics, or evidence notes.

If the product handoff prompt includes a repository marker such as `contextgraph/<repo-name-needed>`, replace it with a concrete repository slug before calling `configure_steward`. Never call the tool while `<repo-name-needed>` or any other placeholder remains in `repository`, `spec.repositories`, inventory, metrics, or evidence.

## Repository Inspection

Read the actual repository, not generic best practices. At minimum:

- Top-level orientation: `README`, `AGENTS.md` / `CLAUDE.md`, `docs/`, and root scripts such as `package.json`, `pyproject.toml`, or `go.mod`.
- Layout: the top directories under `app/`, `src/`, `lib/`, `pkg/`, or wherever the code lives. Note heavy-traffic and quiet areas.
- Recent change pattern: latest 20-50 commit titles or recent PRs. Recurring themes are strong steward signals.
- CI and tests: how tests are organized, what CI runs, and which failures recur.
- Integrations and instrumentation: vendor SDKs and config such as PostHog, Axiom, Datadog, Stripe, GitHub, Clerk, or Resend.

Do not draft a "Code Quality" or "Security" steward from generic priors. Those stewards do not feel native because they are not grounded in this codebase's recurring work.

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

Inventory is optional and at most one item. It is the durable list this steward maintains and re-reads on every heartbeat. Good examples: "Analytics event catalog", "External API surface", "Cron job registry", "Public route inventory". Inventory must anchor to one or more rubric dimensions by exact name in `dimension_names`. When `apply` returns an inventory in `activation`, reconcile its entries immediately from the repository.

Metrics are measurable health signals. Anchor each metric to a single rubric dimension by exact name in `dimension_name`. Avoid unmeasurable metrics such as "Developer happiness" and avoid metrics that only recount inventory size.

Evidence is a short list of repository-specific anchors. Each line names a real file, workflow, or recurring issue. Five or fewer is plenty. If you cannot list two or three pieces of concrete evidence, the steward is probably too speculative.

## Activation Actions

Creation is not complete when `action: "apply"` returns. The returned `activation.next_action` tells you what to do next.

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
          "description": "Why this belongs in the steward's durable inventory.",
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
        "priority_category": "should"
      }
    ]
  }
}
```

Show the preview to the user. After approval, call the same payload with `action: "apply_initialization"`.

Backlog items must be specific and grounded in files the agent inspected. Use `must`, `should`, or `could` for `priority_category`. Zero backlog items is acceptable when the steward is ready but there is no honest first action.

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
    "metrics": [
      {
        "name": "Metric name",
        "description": "What the metric measures.",
        "dimension_name": "Dimension one"
      }
    ],
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
    "metrics": [
      {
        "name": "Uncataloged event count",
        "description": "Events emitted in code but absent from the catalog.",
        "dimension_name": "Event taxonomy"
      }
    ],
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
    "metrics": [
      {
        "name": "Unlabeled control count",
        "description": "Interactive elements without an accessible name in covered product flows.",
        "dimension_name": "Semantic structure"
      },
      {
        "name": "Keyboard trap regression count",
        "description": "Flows where keyboard focus cannot enter, complete, or exit predictably.",
        "dimension_name": "Focus management"
      }
    ],
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
- Replace every handoff marker before validation or preview. A value like `contextgraph/<repo-name-needed>` is a hint, not a valid spec.
- Keep dimension names stable; inventory and metric anchors match names exactly.
- Include `inventory`, `metrics`, and `evidence` only when creating a steward. Omit them for update mode.
- After creating a steward, follow the returned `activation.next_action` until it is `done`.
- Do not skip initialization. If inventory or initialization feels uncertain, inspect more repository evidence before previewing.
- If the tool asks for workspace disambiguation, use `repository` first. Use `workspace_id` only when supplied by the product page or user.
- Do not apply a steward that the user has not approved.
- If the user asks for a steward outside the inspected repo's real work, say what evidence is missing and preview a narrower alternative.
