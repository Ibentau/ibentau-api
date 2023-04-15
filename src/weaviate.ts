import * as dotenv from "dotenv";
dotenv.config();
import weaviate, { WeaviateClient } from "weaviate-ts-client";
import { SOURCE_COUNT } from "./constants.js";

// if env are not set, throw an error
if (!process.env.WEAVIATE_SCHEME || !process.env.WEAVIATE_HOST) {
  throw new Error("Please set the WEAVIATE_SCHEME and WEAVIATE_HOST environment variables.");
}

// @ts-ignore
export const client: WeaviateClient = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME,
  host: process.env.WEAVIATE_HOST,
});

/**
 * Queries the index using the provided vector and returns an array of text values from the matched metadata.
 *
 * @param text - The text to search for.
 * @returns An array of text values from the matched metadata.
 */
export async function queryIndex(
  text: string
): Promise<{ text: string; url: string }[]> {
  const result = await client.graphql
    .get()
    .withClassName("Question")
    .withFields("text url")
    .withNearText({ concepts: [text] })
    .withLimit(SOURCE_COUNT)
    .do();
  return result.data.Get.Question;
}
