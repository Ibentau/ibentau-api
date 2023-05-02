import { client } from "../src/weaviate.js";

client.schema.classDeleter().withClassName("Question").do();
