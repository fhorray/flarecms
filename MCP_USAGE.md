# Model Context Protocol (MCP) in FlareCMS

FlareCMS includes a built-in **Model Context Protocol (MCP)** execution endpoint out of the box. This enables AI tools and agents—like Claude Desktop, Cursor, or your own custom LLM workflows—to interact directly with your content and schema seamlessly.

Because FlareCMS runs at the edge (Cloudflare Workers) across a distributed network of ephemeral isolates, traditional persistent Server-Sent Events (SSE) connections require Durable Objects. To maintain a purely stateless, ultra-fast architecture, FlareCMS exposes a **Stateless RPC Endpoint** instead.

## 🚀 What can it do?

The FlareCMS MCP Server exposes a rich set of AI Tools for both Content and Schema management:

### Content Management

1. **`list_collections`**: Fetches all defined content schema collections available in your database.
2. **`read_content`**: Reads the paginated content of a specific collection dynamically.
3. **`create_document`**: Creates a new document in a specified collection.
4. **`update_document`**: Updates an existing document in a specified collection.

### Schema Management

5. **`get_collection_schema`**: Fetches the full field structure and metadata of a collection.
6. **`create_collection`**: Creates a new content collection and its physical table.
7. **`update_collection`**: Updates collection metadata.
8. **`add_field`**: Adds a new field to an existing collection (e.g. text, number, richtext).

---

## 🛠️ How to Connect to FlareCMS MCP

Because the MCP endpoints are protected to prevent unauthorized access to your private CMS data, any AI agent or client attempting to connect must provide a valid **API Token**.

### 1. Generate an API Token

1. Log in to your FlareCMS Admin dashboard.
2. Navigate to **Settings > API Tokens**.
3. Generate a new API Token with the appropriate privileges.

### 2. Configure your AI Client (e.g. Cursor / Claude) via CLI

The standard way to connect FlareCMS to an MCP-capable agent is using the **FlareCMS CLI**. This acts as a bridge between standard `stdio` MCP calls and the FlareCMS HTTP Endpoint.

#### Setup for Cursor / Claude Desktop

Add FlareCMS to your `mcp.json` or Cursor Settings using the CLI command. You can run it via `npx` or `bun x` so you don't need to manage local script paths.

```json
{
  "mcpServers": {
    "flarecms": {
      "command": "bun",
      "args": [
        "x",
        "flarecms",
        "mcp",
        "--url",
        "https://your-flarecms-domain.com",
        "--token",
        "YOUR_GENERATED_API_TOKEN"
      ]
    }
  }
}
```

> [!TIP]
> You can also use environment variables (`FLARE_API_URL` and `FLARE_API_TOKEN`) instead of command-line flags.

---

## 🧪 Testing Locally

If you are running FlareCMS locally via `bun run dev`, the server will be available at `http://localhost:8787`.

You can test the CLI bridge locally from the root of this project:

```bash
bun packages/cli/src/index.ts mcp --url http://localhost:8787 --token YOUR_LOCAL_TOKEN
```

Then, you can send a JSON-RPC 2.0 message to `stdin`:
`{"jsonrpc":"2.0","id":1,"method":"tools/list"}`

Welcome to the AI-Native era of Content Management!
