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

Check that the skill is available:

```text
/steward:define-steward
```

Check that the backlog execution skill is available:

```text
/steward:work-top-backlog-item
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

Once connected, try:

```
Create an action to implement user authentication
```

Claude Code will use the Steward MCP server to create persistent actions that survive across sessions.

To work the current top Steward backlog item end-to-end, run:

```text
/steward:work-top-backlog-item
```

With no target it claims the repository-wide top item. To scope the work, name
a steward or a specific item when you invoke it, for example:

```text
/steward:work-top-backlog-item work the top item for the API-contract steward
/steward:work-top-backlog-item work the "knip baseline" item
```

Then Claude Code claims the chosen item with the Steward MCP server, prepares
the registered branch/worktree, opens the PR from that branch, and keeps
addressing checks and review comments until the PR is merge-ready.

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
the coding agent by reconciling inventory, previewing initialization artifacts,
and saving those artifacts only after you approve them.

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
creating it. If I approve creation, continue through inventory reconciliation
and initialization preview before asking for final approval to save
initialization artifacts.
```

## Web Dashboard

View and manage your actions at: **https://steward.foo**

## Need Help?

- Documentation: https://github.com/contextgraph/claude-code-plugin
- Issues: https://github.com/contextgraph/claude-code-plugin/issues
