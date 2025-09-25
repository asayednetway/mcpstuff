import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const llm = new ChatOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  configuration: { baseURL: "https://api.groq.com/openai/v1" },
  modelName: "llama-3.1-8b-instant",
});

// ------------------Rewrite Query ------------------
const rewritePrompt = new PromptTemplate({
  template: `Convert the following query into a stand alone question that captures the full intent.
If the query is already standalone, simply rephrase it.  
Make sure to include all relevant details and context from the original query.  

Return your response as a valid JSON object with the following structure:
{{
  "question": "your rewritten question here"
}}

Original query: {query}
Chat history: {chat_history}`,

  inputVariables: ["query","chat_history"],
});

// Parse into structured JSON
const rewriteParser = StructuredOutputParser.fromZodSchema(
  z.object({
    question: z
      .string()
      .describe("A standalone question that captures the full intent of the original query."),
  })
);

const rewriteChain = RunnableSequence.from([
  rewritePrompt,
  llm,
  rewriteParser,
]);

// ------------------ Answer Prompt ------------------
const answerPrompt = new PromptTemplate({
  template: `You are a helpful e-commerce assistant for an online store.  
Your role is to answer customer questions, guide them through shopping, and provide accurate, friendly, and useful information.  

You have access to a set of tools via the MCP server.  
Always use the available tools to fetch accurate, real-time information before answering.  
Do not make up details that should come from a tool.  
You can also use the chat history to provide context for your answers.

## Goals
- Help customers find products by name, category, or description.  
- Answer questions about product prices, availability, stock, and vendor details.  
- Provide shipping and delivery information.  
- Assist with order status, returns, or common store policies.  
- Give clear, polite, and professional responses.  
-you can use your chat history to answer the question if needed
Chat history: {chat_history}
## Rules
1. Prefer using tools over guessing.  
2. If multiple tools could be used, explain your reasoning and choose the best one.  
3. When tool results are returned, summarize them in simple and clear language for the customer.  
4. If no relevant tool exists, respond with helpful general advice (but state that you cannot fetch live data).  
5. Keep answers conversational, concise, and customer-friendly.
6. Return the found results only  

Question: {question}

Always respond in a way that feels like a human shopping assistant, not a technical system .
Genrate your final answer in good formateting.`,
  inputVariables: ["question","chat_history"],
});

// ------------------ Final Chain ------------------
const chain = RunnableSequence.from([
  // Step 1: rewrite the query
  async ({ query, chat_history }) => {
    const result = await rewriteChain.invoke({ query, chat_history });
    return { question: result.question, chat_history }; // pass chat_history forward
  },
  // Step 2: answer prompt
  answerPrompt,
  // Step 3: LLM
  llm,
]);
export { chain };