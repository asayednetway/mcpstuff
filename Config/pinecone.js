import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config({path: './config.env'});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API,  // Get this from Pinecone dashboard
});

// Reference your index
const index = pc.index("products");
export { index };

