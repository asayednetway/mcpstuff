import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Import all tools dynamically
import * as Tools from "./Tools/product_tools.js";

// Create MCP server
const server = new Server(
  { name: "mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Build tool map
const toolMap = {};
for (const [name, tool] of Object.entries(Tools)) {
  if (!tool.name) tool.name = name;
  toolMap[tool.name] = tool;
}

// List all tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(toolMap).map((tool) => ({
      name: tool.name,
      description: tool.description || "No description provided.",
      inputSchema: tool.inputSchema || {
        type: "object",
        properties: {},
      },
    })),
  };
});

// Call any tool dynamically
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = toolMap[request.params.name];
  if (!tool) {
    throw new McpError(ErrorCode.ToolNotFound, `Tool ${request.params.name} not found`);
  }

  let result;
  if (typeof tool.run === "function") {
    result = await tool.run(request.params.arguments);
  } else if (typeof tool === "function") {
    const instance = new tool();
    if (typeof instance.execute === "function") {
      result = await instance.execute(request.params.arguments);
    }
  } else if (typeof tool.handler === "function") {
    result = await tool.handler(request.params.arguments);
  } else {
    throw new McpError(ErrorCode.ToolNotFound, `Tool ${request.params.name} has no callable method`);
  }

  // ✅ if tool already returns MCP-compatible content, pass through
  if (Array.isArray(result) && result[0]?.type) {
    return { content: result };
  }

  // ✅ otherwise wrap in text content
  return {
    content: [
      { type: "text", text: JSON.stringify(result, null, 2) }
    ]
  };
});


// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

console.log("MCP Server running with tools:", Object.keys(toolMap));

// Keep Node alive
await new Promise(() => {});
