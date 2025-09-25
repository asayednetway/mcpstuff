import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { chain } from "./main_model.js";
import dotenv from "dotenv";
import {redis} from "../Config/redis.js"
import { formatChatMemory } from "../Utils/chatMemory_map.js";
dotenv.config({ path: "./config.env" });

class MCPClient {
  mcp;
  chain;
  transport = null;
  tools = [];

  constructor() {
    this.chain = chain;
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  async connectToServer(serverpath) {
    const isjs = serverpath.endsWith(".mjs");
    const ispy = serverpath.endsWith(".py");
    if (!isjs && !ispy)
      throw new Error("Server script must be a .js or .py file");

    this.transport = new StdioClientTransport({
      command: "node",
      args: [serverpath],
    });

    await this.mcp.connect(this.transport);

    // Register tools
    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    console.log("Connected to the server. Tools:", this.tools.map((t) => t.name));
  }

  async process_query(query) {
    const finalText = [];


    await redis.del("chat_history");
  // Wrap the user query as a message object
  const userMessage = { type: "human", text: query };


  await redis.rPush("chat_history", JSON.stringify(userMessage));

  // Get full history from Redis
  const historyRaw = await redis.lRange("chat_history", 0, -1);
  // Convert JSON strings to objects
  const chat_history = historyRaw.map(item => JSON.parse(item));
  
  let response;
  try {
    // Pass properly structured chat_history to the chain
    response = await this.chain.invoke({
      query,
      chat_history
    }, {
      tools: this.tools.length > 0
      ? this.tools.map(tool => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      }))
      : undefined,
    });
    
    // Add LLM response as a message object
    const aiMessage = { type: "ai", text: response.content };
    await redis.rPush("chat_history", JSON.stringify(aiMessage));

    

  } catch (err) {
    throw new Error("LLM Error: " + err.message);
  }

  // Collect final response
  if (!response || !response.content) {
    finalText.push("No response from LLM");
  } else {
    finalText.push(response.content);
  }

  // Handle tool calls if any
  if (response.tool_calls && response.tool_calls.length > 0) {
    for (const toolCall of response.tool_calls) {
      try {
        const result = await this.mcp.callTool({
          name: toolCall.name,
          arguments: toolCall.args,
        });

        result.content.forEach(item => {
          if (item.type === "text") {
            finalText.push(item.text);
          } else {
            finalText.push(JSON.stringify(item, null, 2));
          }
        });
      } catch (err) {
        finalText.push(`❌ Error calling tool ${toolCall.name}: ${err.message}`);
      }
    }
  }

  return { aiMessage: finalText.join("\n") };
}
  async disconnect() {
    await this.mcp.close();
  }
}

export { MCPClient };
