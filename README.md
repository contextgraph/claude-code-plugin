# ContextGraph Plugin for Claude Code

AI-forward persistent task management and planning that integrates directly into Claude Code.

## What is ContextGraph?

ContextGraph is a **living planning layer** that self-improves with every agentic execution. It provides:

1. **Low-friction planning input**: Vibe-like, natural language planning that integrates everywhere you work
2. **Living, responsive planning layer**: Plans that improve and evolve with every agentic execution, learning optimal action sizing and context relevance
3. **Self-documenting outputs**: Automatically generates tailored documentation for different purposes and personas

The system transforms free-form ideas into optimally-sized, executable actions with just-right context—eliminating wasted tokens and retry loops while capturing the full story of how work evolves.

## Installation

### Step 1: Install the Plugin

Via the `/plugin` menu in Claude Code:
1. Select "Manage marketplaces"
2. Add marketplace: `contextgraph/claude-code-plugin`
3. Select "Browse and install plugins"
4. Install `contextgraph`

### Step 2: Connect MCP Server

After installing the plugin, run this command to connect the MCP server:

```bash
claude mcp add contextgraph --transport http https://mcp.contextgraph.dev
```

Then restart Claude Code.

### Verify Installation

Check that everything is working:

```bash
/mcp
```

You should see `contextgraph` listed as a configured MCP server.

## Features

- **Persistent Action Management**: Create, update, and track actions across sessions
- **Hierarchical Planning**: Organize work in parent-child relationships
- **Dependency Tracking**: Manage action dependencies and execution order
- **Semantic Search**: Find actions using natural language queries
- **Completion Context**: Rich completion stories with technical changes and outcomes
- **MCP Integration**: Full Model Context Protocol support for seamless Claude Code integration

## MCP Tools Available

Once installed, Claude Code can use these tools:

- `create` - Create new actions with parent and dependency relationships
- `update` - Update action properties and dependencies
- `complete` - Mark actions as done with completion context
- `search` - Search actions using semantic similarity and keywords
- `fetch` - Get full details for specific actions
- `move` - Reorganize action hierarchy
- `suggest_parent` - Get AI-powered parent suggestions
- `parse_plan` - Convert unstructured text into structured actions
- `fetch_tree` - View hierarchical action trees

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

## Web Dashboard

Visit [contextgraph.dev](https://contextgraph.dev) to view and manage your actions in a visual interface.

## Links

- **Website**: [contextgraph.dev](https://contextgraph.dev)
- **GitHub**: [github.com/contextgraph](https://github.com/contextgraph)
- **MCP Server**: [mcp.contextgraph.dev](https://mcp.contextgraph.dev)

## Version

Current version: 0.9.0

## License

MIT
