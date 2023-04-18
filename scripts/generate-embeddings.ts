import { MarkdownTextSplitter } from "langchain/text_splitter";
import { readdir, readFile } from "fs/promises";
import parseMD from "parse-md";
import { client } from "../src/weaviate.js";
import { ObjectsBatcher } from "weaviate-ts-client";

const markdownDir = "processed";

/**
 * Generates embeddings for the given markdowns and saves them to a pinecone index
 * @param markdowns the markdowns to generate embeddings for
 *
 */
async function generate_embeddings() {
  // load markdowns using fs
  const files = await readdir(markdownDir);
  const markdowns = await Promise.all(
    files.map((file) => {
      return readFile(`${markdownDir}/${file}`, "utf8");
    })
  );

  let contents = [];
  let metadata: any[] = [];
  for (let markdown of markdowns) {
    const { metadata: mdMetadata, content } = parseMD(markdown);
    contents.push(content);
    metadata.push(mdMetadata);
  }
  // into documents
  const splitter = new MarkdownTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });
  const documents = await splitter.createDocuments(contents, metadata);

  console.log(`Got ${documents.length} embeddings ready to save`);

  // Prepare a batcher
  let batcher: ObjectsBatcher = client.batch.objectsBatcher();
  let counter: number = 0;
  let batchSize: number = 10;

  for (const doc of documents) {
    let obj = {
      class: "Question",
      properties: {
        text: doc.pageContent,
        url: doc.metadata.url,
      },
    };
    batcher.withObject(obj);
    counter++;
    if (counter % batchSize == 0) {
      await batcher.do();
      batcher = client.batch.objectsBatcher();
    }
    console.log("Batched " + counter + " objects so far");
  }

  await batcher.do();
}

await generate_embeddings();
