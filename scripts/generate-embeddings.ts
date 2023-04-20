import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { readdir, readFile } from "fs/promises";
import parseMD from "parse-md";
import { ObjectsBatcher } from "weaviate-ts-client";
import { client } from "../src/weaviate";

const inputFilesDir = "generated";

/**
 * Generates embeddings for the given markdowns and saves them to a pinecone index
 * @param markdowns the markdowns to generate embeddings for
 *
 */
async function generate_embeddings() {
  // load markdowns using fs
  const files = await readdir(inputFilesDir);
  const markdowns = await Promise.all(
    files.map((file) => {
      return readFile(`${inputFilesDir}/${file}`, "utf8");
    })
  );

  let contents = [];
  let metadata: any[] = [];
  for (let markdown of markdowns) {
    const { metadata: mdMetadata, content } = parseMD(markdown);
    contents.push(content);
    metadata.push(mdMetadata);
  }

  // replace 2+ spaces with a single space
  contents = contents.map((content) => content.replace(/ {2,}/g, " "));
  // replace 2+ tabs with a single tab
  contents = contents.map((content) =>
    content.replace(/(?:\s*\n\s*){2,}/g, "\t")
  );
  // replace 2+ newlines with a single newline. Newlines can be \n\n or \n \n. They can contain spaces in between.

  // into documents
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 200
  });
  const documents = await splitter.createDocuments(contents, metadata);

  console.log(`Got ${documents.length} embeddings ready to save`);

  console.log(documents);

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

generate_embeddings();
