import express from "express";
import { MCPClient } from "../Mcp_client/index.js";

const route = express();
route.use(express.json());

// Create one instance of MCPClient
const mcpClient = new MCPClient();


(async () => {
  try {
    await mcpClient.connectToServer("./mcp_server.mjs");
    console.log("MCP Client ready.");
  } catch (err) {
    console.error("Failed to connect MCP:", err);
  }
})();

route.post("/model", async (req, res) => {
  try {
    const { query } = req.body; // only extract once
    if (!query) {
      return res.status(400).json({ error: "Missing query" });

    }
    else if (query==='quit'){
        await mcpClient.disconnect();
        return res.status(200).json({ message: "Disconnected from MCP server." });
    }
    else{

    // Pass the query string directly
    const response = await mcpClient.process_query(query);

    res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { route };
