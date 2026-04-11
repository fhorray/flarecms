/**
 * FlareCMS MCP Bridge Server (CLI Implementation)
 * Implements MCP (Model Context Protocol) over stdio
 */

export interface McpOptions {
  url: string;
  token?: string;
}

const TOOLS = [
  {
    name: "list_collections",
    description: "Fetches all defined content schema collections available in FlareCMS.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get_collection_schema",
    description: "Fetches the full field structure and metadata of a specific FlareCMS collection.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "The slug of the collection to inspect" }
      },
      required: ["collection"]
    }
  },
  {
    name: "read_content",
    description: "Reads the paginated content of a specific FlareCMS collection dynamically.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "The slug of the collection to read" },
        limit: { type: "number", description: "Number of records to fetch (default 10)" }
      },
      required: ["collection"]
    }
  },
  {
    name: "create_document",
    description: "Creates a new document in a specified collection.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "The collection slug" },
        data: { 
          type: "object", 
          description: "The document data (e.g. { title: 'Hello', status: 'published' })" 
        }
      },
      required: ["collection", "data"]
    }
  },
  {
    name: "update_document",
    description: "Updates an existing document in a specified collection.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "The collection slug" },
        id: { type: "string", description: "The document ID to update" },
        data: { 
          type: "object", 
          description: "The data fields to update" 
        }
      },
      required: ["collection", "id", "data"]
    }
  },
  {
    name: "create_collection",
    description: "Creates a new content collection and its physical table.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Unique URL slug for the collection" },
        label: { type: "string", description: "Display label" },
        labelSingular: { type: "string", description: "Singular display label" },
        description: { type: "string", description: "Optional description" },
        isPublic: { type: "boolean", description: "Whether it is publicly readable" }
      },
      required: ["slug", "label"]
    }
  },
  {
    name: "update_collection",
    description: "Updates collection metadata.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The collection ID (ULID)" },
        data: { type: "object", description: "Metadata fields to update" }
      },
      required: ["id", "data"]
    }
  },
  {
    name: "add_field",
    description: "Adds a new field to an existing collection.",
    inputSchema: {
      type: "object",
      properties: {
        collection_id: { type: "string", description: "The collection ID (ULID)" },
        field: {
          type: "object",
          properties: {
            slug: { type: "string" },
            label: { type: "string" },
            type: { type: "string", enum: ["text", "number", "boolean", "date", "richtext"] },
            required: { type: "boolean" }
          },
          required: ["slug", "label", "type"]
        }
      },
      required: ["collection_id", "field"]
    }
  }
];

export async function runMcpBridge(options: McpOptions) {
  const { url, token } = options;
  const executeUrl = `${url.replace(/\/$/, '')}/api/mcp/execute`;

  async function callFlareCMS(tool: string, args: any) {
    if (!token) {
      throw new Error("No API Token provided. Use --token or FLARE_API_TOKEN environment variable.");
    }

    const response = await fetch(executeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tool, arguments: args }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FlareCMS API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  async function handleRequest(request: any) {
    const { method, params } = request;

    switch (method) {
      case "initialize":
        return {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "@flarecms/cli", version: "0.1.0" }
        };

      case "notifications/initialized":
        return null;

      case "tools/list":
        return { tools: TOOLS };

      case "tools/call":
        try {
          return await callFlareCMS(params.name, params.arguments);
        } catch (error: any) {
          return {
            content: [{ type: "text", text: `Error executing tool '${params.name}': ${error.message}` }],
            isError: true
          };
        }

      default:
        return { error: { code: -32601, message: `Method not found: ${method}` } };
    }
  }

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of (Bun.stdin.stream() as any)) {
    buffer += decoder.decode(chunk);
    let lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const request = JSON.parse(line);
        const result: any = await handleRequest(request);

        if (result === null) continue;

        process.stdout.write(JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: result.error ? undefined : result,
          error: result.error
        }) + "\n");
      } catch (e: any) {
        process.stdout.write(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" }
        }) + "\n");
      }
    }
  }
}
