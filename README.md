# Steward Plugin for Claude Code

Steward helps Claude Code define and activate **repository-native stewards**: narrow, rubric-centric agents that understand a specific codebase domain. It provides:

1. **Repository-grounded steward definition**: Inspect a codebase, draft a narrow ownership zone, and preview a rubric before writing anything
2. **Agent-owned activation**: Reconcile inventory and initialize the steward from the same Claude Code session
3. **Persistent action management**: Create, update, and track Steward actions across sessions

The plugin connects Claude Code to the Steward MCP server so steward setup happens inside the repository where the context lives.

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

If update does not pick up the new skill, reinstall:

```text
/plugin uninstall steward
/plugin install steward
```

### Verify Installation

Check that the Steward MCP server is connected and authenticated:

```bash
/mcp
```

You should see `steward` listed as a configured MCP server. Complete the
browser authentication handoff if Claude Code prompts for it.

Check that the steward definition skill is installed:

```text
/steward:define-steward
```

Check that the backlog execution skill is installed:

```text
/steward:work-top-backlog-item
```

To smoke-test the skill and MCP tool together, first confirm `/mcp` shows the
`steward` server is authenticated, then open Claude Code in the repository you
want the steward to watch and run:

```text
/steward:define-steward

Run the steward onboarding preflight for this repository, then inspect this
repository and call configure_steward with action="validate" for a draft
steward. Do not create or update anything yet.
```

To test the full steward creation path, use:

```text
/steward:define-steward

Inspect this repository, draft a narrow steward, preview it, and ask before
creating it. If I approve creation, continue through inventory reconciliation
and initialization preview before asking for final approval to save
initialization artifacts.
```

## Features

- **Persistent Action Management**: Create, update, and track actions across sessions
- **Repository-Native Steward Definition**: Use `/steward:define-steward` to inspect a repo, create a rubric-centric steward with `configure_steward`, reconcile inventory, and initialize the steward from Claude Code
- **Backlog Execution Loop**: Use `/steward:work-top-backlog-item` to claim a Steward backlog item — the repository-wide top item by default, a specific item you name, or the top item within a single steward's purview — prepare its branch/worktree, open the linked PR, and keep working through review feedback and CI checks until the PR is merge-ready
- **Plan Review With Stewards**: Use `/steward:plan-review` to consult the repository's stewards on a proposed plan before implementation, surface their attributed concerns, and propose a new steward when the plan introduces an unowned domain such as a new integration
- **Hierarchical Planning**: Organize work in parent-child relationships
- **Dependency Tracking**: Manage action dependencies and execution order
- **Semantic Search**: Find actions using natural language queries
- **Completion Context**: Rich completion stories with technical changes and outcomes
- **MCP Integration**: Full Model Context Protocol support for seamless Claude Code integration

## MCP Tools Available

Once installed, Claude Code can use these tools:

- `create` - Create new actions with parent and dependency relationships
- `update` - Update action properties including agentReady, dependencies, and completion context
- `complete` - Mark actions as done with completion context
- `search` - Search actions using semantic similarity and keywords
- `fetch` - Get full details for specific actions
- `list_agent_runs` - List agent runs for an action with filtering options
- `fetch_agent_run` - Get detailed agent run information including event logs
- `move` - Reorganize action hierarchy
- `suggest_parent` - Get AI-powered parent suggestions
- `parse_plan` - Convert unstructured text into structured actions
- `fetch_tree` - View hierarchical action trees
- `prepare_steward_onboarding` - Check MCP auth, workspace resolution, and GitHub App repository access before defining a steward
- `integration` - Inspect workspace integration status and metric measurement capabilities
- `configure_steward` - Validate, preview, create, or update rubric-centric stewards
- `manage_backlog_work` - Consolidated Steward backlog execution lifecycle tool: peek, claim, release, or dismiss item/group work
- `list_steward_backlog_items` - List backlog items for a steward with optional state filtering
- `create_steward_backlog_item` - Create a new backlog item for a steward
- `update_steward_backlog_item` - Update a steward backlog item title, objective, rationale, or priority

## Skills Available

Plugin skills are namespaced by Claude Code as `/steward:<skill-name>`.

- `/steward:define-steward` - Inspect the current repository, draft a narrow steward spec, validate and preview it with `configure_steward`, create or update it after user approval, then reconcile inventory and initialize the steward from the coding agent.
- `/steward:work-top-backlog-item` - Use the Steward MCP server to claim a backlog item — the repository-wide top item by default, a specific item you name (by id or reference), or the top item for a named steward — set up the registered branch/worktree, implement the work, open a PR linked by that branch, and continue through checks and review comments until the PR is merge-ready.
- `/steward:plan-review` - Before implementing a plan or design, consult the repository's stewards via `consult` and return their attributed feedback. If the plan crosses a domain (often a new integration) that no existing steward owns, propose a narrow new steward for that domain.

## Agent-Ready Status

The `agentReady` field allows programmatic control over whether an action subtree is ready for autonomous agent execution. This field can be toggled via the MCP `update` tool without requiring web UI access or direct database modifications.

### Purpose

Use `agentReady` to control which action subtrees are available for autonomous agent execution. When set to `false`, the action and its entire subtree are hidden from agent selection, even if they meet other readiness criteria.

### Usage Patterns

**Temporarily blocking agent execution:**
```javascript
// Mark an action as not ready for agents
update({
  action_id: "action-uuid",
  agentReady: false
})
```

**Re-enabling agent execution:**
```javascript
// Make the action available to agents again
update({
  action_id: "action-uuid",
  agentReady: true
})
```

### Common Use Cases

- **Work in progress**: Block agent execution while you refine an action's description or requirements
- **Human review required**: Mark actions that need human decision-making before agent work can proceed
- **Dependency resolution**: Keep actions blocked until prerequisite work or decisions are complete
- **Quality gates**: Control when autonomous work can begin on specific subtrees

### How It Works

When an action has `agentReady: false`:
- The action won't appear in agent selection interfaces
- Child actions are also blocked from agent execution (inherited blocking)
- The action remains visible in the web UI and API responses
- Manual agent execution can still be triggered via the web UI if needed

This field complements other readiness signals (dependencies, prepared status, etc.) to give you fine-grained control over autonomous execution flow.

## Getting Started

After installation, Claude Code can help you:

1. **Create your first action**:
   ```
   Create an action to implement user authentication
   ```

2. **Search existing work**:
   ```
   Find actions related to database migrations
   ```

3. **Complete work and capture context**:
   ```
   Mark action [id] as complete with the changes we just made
   ```

4. **Create a repository-native steward**:
   ```text
   /steward:define-steward
   ```
   Then ask Claude to inspect the current repo and preview a steward.

## Web Dashboard

Visit [steward.foo](https://steward.foo) to view and manage your actions in a visual interface.

## Links

- **Website**: [steward.foo](https://steward.foo)
- **MCP Server**: [mcp.steward.foo](https://mcp.steward.foo)

## Version

Current version: 0.9.21

## License

MIT
