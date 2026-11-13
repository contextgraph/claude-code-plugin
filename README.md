# Steward Plugin for Claude Code

[Steward](https://steward.foo) gives a repository **stewards**: narrow AI
agents that each own one zone of a codebase, review changes through their own
rubric, and give advice when you work in their area.

This plugin connects Claude Code to the hosted Steward MCP server at
`https://mcp.steward.foo` and adds two skills for working with stewards from
inside the repository.

> **Note:** Steward also works from any coding agent that supports remote MCP
> servers: add `https://mcp.steward.foo` as an HTTP MCP server directly. That
> is now the recommended way to install Steward, and this plugin will be
> retired in favour of it. Existing plugin installs keep working until then.

## Installation

Via the `/plugin` menu in Claude Code:
1. Select "Manage marketplaces"
2. Add marketplace: `contextgraph/claude-code-plugin`
3. Select "Browse and install plugins"
4. Install `steward`

Then reload plugins:

```text
/reload-plugins
```

To update an existing install:

```text
/plugin update steward
```

If update does not pick up the change, reinstall:

```text
/plugin uninstall steward
/plugin install steward
```

### Verify Installation

Check that the Steward MCP server is connected and authenticated:

```text
/mcp
```

You should see `steward` listed as a configured MCP server. Complete the
browser authentication handoff if Claude Code prompts for it.

Check that both skills are installed:

```text
/steward:define-steward
/steward:plan-review
```

To smoke-test a skill and the server together, open Claude Code in the
repository you want a steward to watch and run:

```text
/steward:define-steward

Run the steward onboarding preflight for this repository, then inspect this
repository and call configure_steward with action="validate" for a draft
steward. Do not create or update anything yet.
```

## Skills

Plugin skills are namespaced by Claude Code as `/steward:<skill-name>`.

- `/steward:define-steward` - Inspect every repository the steward will cover,
  draft a narrow rubric-centric steward, validate and preview it with
  `configure_steward`, create it after you approve, then preview and save its
  initialization report.
- `/steward:plan-review` - Before implementing a plan or design, consult the
  repository's stewards with `consult` and return their attributed feedback.
  If the plan crosses a domain no steward owns, propose a narrow new steward.

The tools themselves come from the Steward MCP server, which is the source of
truth for what is available; run `/mcp` to see the current list.

## Links

- **Website**: [steward.foo](https://steward.foo)
- **MCP Server**: [mcp.steward.foo](https://mcp.steward.foo)

## Version

Current version: 0.12.0

## License

MIT
