# ContextGraph Setup

Thank you for installing the ContextGraph plugin!

## Complete Your Setup

To connect to the ContextGraph MCP server, run this command:

```bash
claude mcp add contextgraph --transport http https://mcp.contextgraph.dev
```

Then restart Claude Code.

## Verify Installation

Check that the MCP server is configured:

```bash
/mcp
```

You should see `contextgraph` listed.

## Getting Started

Once connected, try:

```
Create an action to implement user authentication
```

Claude Code will use the ContextGraph MCP server to create persistent actions that survive across sessions.

## Web Dashboard

View and manage your actions at: **https://contextgraph.dev**

## Need Help?

- Documentation: https://github.com/contextgraph/claude-code-plugin
- Issues: https://github.com/contextgraph/claude-code-plugin/issues
