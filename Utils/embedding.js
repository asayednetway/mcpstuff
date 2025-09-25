import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { index } from '../Config/pinecone.js'
import fs from 'fs';
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import { Document } from "@langchain/core/documents";
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HF_API_KEY,
  model: "sentence-transformers/all-roberta-large-v1",
});


function productToDocument(product) {
  return new Document({
    pageContent: `
      ${product.name}.
      ${product.description}.
      Category: ${product.category}.
      Vendor: ${product.vendor.name}, ${product.vendor.location.city}, ${product.vendor.location.country}.
    `,
    metadata: {
      id: product.id,
      price: product.price,
      currency: product.currency,
      category: product.category,
      vendor: product.vendor.name,
      stock: product.stock,
      rating: product.rating,
    },
  });
}
const rawData = fs.readFileSync("./products.json", "utf-8");
const products = JSON.parse(rawData);

// Convert each product into a Document
const docs = products.map(productToDocument);
const vectorStore = await PineconeStore.fromDocuments(docs, embeddings, {
  pineconeIndex: index,
});

console.log("✅ Products inserted into Pinecone!");
