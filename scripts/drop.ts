import { client } from "../src/weaviate.js";

await client.schema.classDeleter().withClassName("Question").do();
