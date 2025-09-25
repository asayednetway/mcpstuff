// Tools/product_tools.js
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { index } from "../Config/pinecone.js";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { formatResultsForLLM } from "../Utils/formulate_result.js";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });



export const ProductSearchTool = {
  name: "product_search",
  description:
    "Search for products in the database by name, category, or description.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for products (e.g. 'iPhone and Samsung')",
      },
    },
    required: ["query"],
  },
  run: async (args) => {
    try {
      const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HF_API_KEY,
  model: "sentence-transformers/all-roberta-large-v1",
});
      const { query } = args;

      // --- Split query into subqueries ---
      function splitQuery(q) {
        return q
          .toLowerCase()
          .split(/\s+(?:and|or|,)\s+/)
          .map((x) => x.trim())
          .filter((x) => x.length > 0);
      }
      const subQueries = splitQuery(query);

      // --- Setup vector store ---
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
      });

      let allResults = [];

      for (const subQuery of subQueries) {
        const results = await vectorStore.similaritySearch(subQuery, 2);
        allResults.push({ query: subQuery, results });
      }

      if (allResults.every((r) => r.results.length === 0)) {
        return [
          {
            type: "text",
            text: `No products found for "${query}".`,
          },
        ];
      }

      // --- Format results for LLM ---
      const llmText = formatResultsForLLM(allResults);

      return [
        {
          type: "text",
          text: llmText,
        },
      ];
    } catch (error) {
      console.error("Product search error:", error);
      return [
        {
          type: "text",
          text: "Error occurred while searching products.",
        },
      ];
    }
  },
};
