# Storybook MCP

Offer it when the builder is Vite and Storybook is 10.3 or later.

**Why:** the addon exposes the component docs, stories and (with the Vitest addon) story
tests to agents over MCP. The later `component` and `review` commands use its
documentation tools when `storybook.mcp` is true and read files when it is not.

**Probe:** `@storybook/addon-mcp` in `main.*` addons and `storybook.mcp: true` in the map?
Then "already in place".

**Act, after the developer accepts:**

```bash
npx storybook add @storybook/addon-mcp
```

Pin the addon to the Storybook version. Set `storybook.mcp: true` in the map. To let
Claude Code reach it, offer a project `.mcp.json` entry (the dev server must run):

```json
{ "mcpServers": { "storybook": { "type": "http", "url": "http://localhost:6006/mcp" } } }
```

Use the port the repo's `storybook` script uses. The addon's story-test tool needs
`vitest-addon` mode; in the other modes the agent runs `tests.stories` instead. Without
`@storybook/addon-vitest` the addon still serves documentation tools.

**Check:** with the dev server running, `curl -s -o /dev/null -w "%{http_code}"
http://localhost:6006/mcp` answers (an MCP endpoint may answer 4xx to a plain GET; any
response proves it is mounted). Decline: write `storybook.mcp: false` so reruns do not ask.
