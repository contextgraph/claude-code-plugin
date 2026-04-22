# Steward Setup

Thank you for installing the Steward plugin!

## Complete Your Setup

To connect to the Steward MCP server, run this command:

```bash
claude mcp add steward --transport http https://mcp.steward.foo
```

Then restart Claude Code.

## Verify Installation

Check that the MCP server is configured:

```bash
/mcp
```

You should see `steward` listed.

## Getting Started

Once connected, try:

```
Create an action to implement user authentication
```

Claude Code will use the Steward MCP server to create persistent actions that survive across sessions.

## Web Dashboard

View and manage your actions at: **https://steward.foo**

## Need Help?

- Documentation: https://github.com/contextgraph/claude-code-plugin
- Issues: https://github.com/contextgraph/claude-code-plugin/issues
