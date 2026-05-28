---
name: plan-review
description: Use before implementing a plan, when the user asks for a second opinion on an approach, after ExitPlanMode, or whenever a draft design is on the table. Consult the repository's stewards via the Steward MCP server, return their attributed feedback, and, if the plan crosses a domain that no steward currently owns, propose a narrow new steward for that domain before code is written.
---

# Plan Review

Use this skill when the user has a plan, design, or proposed approach and wants it vetted before implementation. Typical triggers: "review this plan", "second opinion on this approach", "is this the right way to do X", "what would the stewards say about this", or immediately after a planning step (e.g. ExitPlanMode) and before edits begin.

The Steward MCP server must be connected. If `consult` or `list_stewards` is unavailable, ask the user to run `/mcp`, confirm the `steward` server is connected, and authenticate if Claude Code requests it.

The goal is not "ask every steward everything." The goal is to get the plan in front of the stewards whose domains it actually touches, surface their concerns before code is written, and notice when the plan implies a domain that nobody owns yet.

## When To Use

- The user just finished planning and is about to implement.
- The user explicitly asks for a plan review, design review, or steward opinion.
- The user proposes an approach that crosses a known steward's zone (auth, analytics, schema, integrations, etc.).
- The user proposes work that looks like a new ongoing concern - an integration, a new external dependency, a new product surface - that no current steward will keep watching.

Skip this skill for trivial edits where consulting stewards is overhead (typo fixes, single-file refactors, internal renames). If unsure, ask the user whether they want a steward review before continuing.

## Workflow

1. **Identify the repository.** Resolve the `owner/repo` slug from the local git remote. If the working directory is not a git repository, ask the user which repository the plan targets. Do not invent a slug.
2. **Get the plan text.** If the user already wrote the plan inline, use it. If the plan only lives in the prior conversation (e.g. an ExitPlanMode handoff), summarize it into a single self-contained brief before calling `consult` - stewards only see the message and optional context, not the chat history.
3. **List active stewards** with `list_stewards` for the current repository. Note their ownership zones. This shapes both your framing of the question and your judgment about whether a new steward is needed.
4. **Call `consult`** once with the plan. Pass:
   - `repository`: the resolved `owner/repo` (or full URL).
   - `message`: the question framed as a request for plan review. Be direct: "Here is a proposed plan. Before I implement, are there concerns from your domain? What would you change, and what would you push back on?"
   - `context`: include the full plan text and any relevant code snippets, file paths, schemas, or constraints the stewards cannot read from the repo alone. Use this liberally - stewards cannot see the working tree.
5. **Surface the response** to the user. Show the synthesized summary and the individual steward attributions. Do not paraphrase concerns away; quote the steward when the wording is precise.
6. **Consider whether a new steward is warranted** (see next section). Propose it as a follow-up, not a blocker.
7. **Hand back to the user.** Recommend whether to proceed, adjust the plan, or pause for a deeper conversation. The user decides; do not start implementing on the basis of the consult alone.

## Proposing A New Steward

A plan review is one of the best moments to notice missing stewardship. If the plan introduces or significantly extends a domain that no existing steward covers, propose a new steward.

Strong signals that a new steward would help:

- The plan adds a **new external integration** (a vendor SDK, a webhook surface, a third-party API). Integrations rot quietly: schemas drift, auth modes change, rate limits move. A dedicated steward keeps an expert eye on it, watches PRs that touch it, and owns the inventory of emit/consume sites.
- The plan introduces a **new product surface** with its own contract (a public API, a new data schema, a new event taxonomy, a new permission model).
- The plan touches a **recurring concern** that has come up before but has no owner (migration safety, background jobs, secret handling, cron registry).
- The plan implies an **ongoing watch** rather than a one-time change - something that will need attention every time the area is modified.

How to propose, without derailing the plan review:

1. After delivering the steward feedback, say something like: "This plan adds <Stripe webhooks / a new analytics event family / a Resend integration / ...>. There is no steward today for <that domain>. Want me to define one with `/steward:define-steward` after we land this? A steward there would review every PR that touches it, maintain the inventory of <emit sites / endpoints / handlers>, and be available for `consult` next time you plan work in this area."
2. Name one concrete rubric dimension or inventory anchor the steward would own, so the proposal is not generic. Use the actual repository evidence the consult surfaced.
3. Offer two paths: define the steward now (kick off `/steward:define-steward`) or capture it as a follow-up. Default to "after we land this" unless the user wants it now.

Do not propose a new steward when:

- An existing steward's zone already covers it - reuse the current steward instead.
- The plan is a one-shot change with no ongoing surface.
- You cannot point to concrete repository evidence the new steward would own. "Quality" or "Architecture" stewards do not feel native; skip the proposal rather than invent a broad one.

If the user agrees to a new steward, invoke `/steward:define-steward`. That skill owns the actual definition workflow; this skill only opens the door.

## Framing The Consult Message

The stewards respond from their rubric, not from the chat. Phrase the message so each steward can answer or quietly opt out:

- State what is about to change, not just what the goal is.
- Include file paths, function names, schemas, or event names the plan touches.
- Note any decisions already made and any decisions still open.
- Ask explicitly for concerns, alternatives, and prior decisions worth respecting.

Example message:

```text
Proposed plan: add a Stripe webhook handler at `app/api/webhooks/stripe/route.ts`
that consumes `invoice.payment_succeeded` and writes a row to `billing_events`.
Open questions: should this be idempotent on `event.id` or on `(customer, invoice)`?
What concerns or prior decisions should I respect before implementing?
```

Always include the full plan in `context` rather than only summarizing it in `message`.

## Output Shape For The User

Keep the response tight. The user wants the steward's verdict, not a transcript:

- One-line synthesis of the overall steward read (proceed / adjust / reconsider).
- Per-steward concerns, attributed by steward name, each as a short bullet.
- A clear recommendation: implement as planned, implement with these adjustments, or pause and discuss before continuing.
- If applicable, a single follow-up line proposing a new steward.

Do not re-implement the plan inside the review. Do not start editing files. The skill ends with the user choosing how to proceed.

## Guardrails

- Resolve a real `owner/repo` slug before calling `consult`. Never call with a placeholder.
- If `list_stewards` returns zero stewards for the repository, tell the user there is nothing to consult yet and offer `/steward:define-steward` to set up the first one. Do not call `consult` against an empty workspace.
- Quote stewards rather than paraphrase when they raise specific objections.
- Never imply the consult is binding. The user decides whether to act on the feedback.
- Do not start implementation work in the same skill turn. Plan review ends with a recommendation, not edits.
- Propose at most one new steward per plan review. If multiple domains look unowned, name the strongest candidate and mention the others as future possibilities.
