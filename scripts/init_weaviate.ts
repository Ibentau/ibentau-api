import { client } from "../src/weaviate.js";

let classObj = {
  class: "Question",
  vectorizer: "text2vec-transformers", // text2vec-transformers or text2vec-huggingface
};

// add the schema
client.schema
  .classCreator()
  .withClass(classObj)
  .do()
  .then((res: any) => {
    console.log(res);
  })
  .catch((err: Error) => {
    console.error(err);
  });
