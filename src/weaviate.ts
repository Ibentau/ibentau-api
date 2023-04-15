import weaviate, { WeaviateClient } from "weaviate-ts-client";
import { SOURCE_COUNT } from "./constants.js";

// @ts-ignore
export const client: WeaviateClient = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME || "http",
  host: process.env.WEAVIATE_HOST || "localhost:8080",
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
