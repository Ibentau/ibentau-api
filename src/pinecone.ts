import * as dotenv from "dotenv";
dotenv.config()
// Create a client
import { PineconeClient } from "@pinecone-database/pinecone";
import { SOURCE_COUNT } from "./constants.js";

const client = new PineconeClient();

// Initialize the client
await client.init({
  apiKey: process.env.PINECONE_API_KEY ?? "",
  environment: process.env.PINECONE_ENVIRONMENT ?? "",
});

const index = client.Index(process.env.PINECONE_INDEX ?? "");

/**
 * Queries the index using the provided vector and returns an array of text values from the matched metadata.
 *
 * @param vector - The vector used to query the index.
 * @returns An array of text values from the matched metadata.
 */
export async function queryIndex(vector: number[]): Promise<string[]> {
  const queryResponse = await index.query({
    queryRequest: {
      topK: SOURCE_COUNT,
      vector,
      includeValues: false,
      includeMetadata: true,
    },
  });
  return (
    queryResponse.matches?.map(({ metadata }) => {
      const { text } = metadata as { text: string };
      return text;
    }) ?? []
  );
}
