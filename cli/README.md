# a2b public agent CLI

This zero-dependency Node.js CLI provides a command-line interface to a2b's
public read-only MCP endpoint. It uses the same tools, schemas, routing rules,
and approval boundaries as `https://www.a2b.sa/api/mcp`.

## Run without installing

```sh
curl -fsSLo a2b.mjs https://www.a2b.sa/cli/a2b.mjs
node a2b.mjs overview
node a2b.mjs services
node a2b.mjs match "commercial road freight from Dubai to Riyadh"
node a2b.mjs ask "What details are needed for a quotation?"
```

Use `node a2b.mjs tools` to list the live MCP tool catalog and
`node a2b.mjs --help` for all commands.

The CLI is read-only. It never submits a form, sends email, opens WhatsApp,
calls a phone number, quotes pricing, confirms capacity, or creates a commercial
commitment. Inquiry and RFQ operations only prepare drafts for later user review.
