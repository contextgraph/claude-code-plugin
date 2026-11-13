# Steward Setup

Thank you for installing the Steward plugin!

The Steward MCP server is configured automatically when the plugin is
installed. Reload plugins to pick it up:

```text
/reload-plugins
```

The plugin also includes the
`/steward:define-steward` skill for creating stewards from inside the
repository they will watch.

## Verify Installation

Check that the MCP server is connected and authenticated:

```bash
/mcp
```

You should see `steward` listed. Complete the browser authentication handoff if
Claude Code prompts for it.

> **If the auth URL won't paste cleanly:** Claude Code normally opens your
> browser automatically. When it can't (common over SSH or remote terminals),
> it prints a long URL to copy instead — and long URLs can wrap or mangle when
> copied out of some terminals. If pasting it fails, just ask Claude:
> **"open that authentication URL in my browser"** — it opens the exact link
> directly and auth completes.

Check that the skill is available:

```text
/steward:define-steward
```

Check that the plan-review skill is available:

```text
/steward:plan-review
```

If you are upgrading from an older install, update or reinstall the plugin,
then restart Claude Code:

```text
/plugin update steward
```

If update does not pick up the new skill, uninstall and install again:

```text
/plugin uninstall steward
/plugin install steward
```

## Getting Started

Before implementing a plan, ask the repository's stewards for feedback:

```text
/steward:plan-review
```

## Create A Steward

Open Claude Code in the repository you want the steward to watch. Confirm
`/mcp` shows the `steward` server is authenticated, then run:

```text
/steward:define-steward
```

Ask Claude to inspect the repo and preview a steward. The skill will guide
Claude through `prepare_steward_onboarding`, then `configure_steward` with `action: "validate"`, then
`action: "preview"`, and only create it after you approve the rendered
mission and rubric. After creation, Claude will continue the activation flow in
the coding agent by previewing an initialization report and saving it only
after you approve it.

If the steward will cover more than the repository you launched from — scoped
to several repos, or to the whole workspace — the skill inspects **every**
covered repository before grounding the zone and evidence, not just
the current checkout. For each repo beyond the current one it resolves a local
checkout (a sibling directory it confirms by git remote), offers a read-only
clone, or asks where the checkout lives, so the steward is grounded in real
code from every repo it watches.

Smoke-test prompt:

```text
/steward:define-steward

Inspect this repository and call configure_steward with action="validate" for
a draft steward. Do not create or update anything yet.
```

End-to-end test prompt:

```text
/steward:define-steward

Inspect this repository, draft a narrow steward, preview it, and ask before
creating it. If I approve creation, continue through the initialization
preview before asking for final approval to save it.
```

## Web Dashboard

View and manage your stewards at: **https://steward.foo**

## Need Help?

- Documentation: https://github.com/contextgraph/claude-code-plugin
- Issues: https://github.com/contextgraph/claude-code-plugin/issues
