import * as dotenv from "dotenv";
dotenv.config();
import Fastify from "fastify";
import { S } from "fluent-json-schema";

import { queryIndex } from "./weaviate.js";
import { getCompletion, moderateMessage } from "./openai.js";
import { MAX_CHARACTERS } from "./constants.js";

const fastify = Fastify({
  logger: true,
});

await fastify.register(import("@fastify/helmet"));

await fastify.register(import("@fastify/rate-limit"), {
  max: 5,
  timeWindow: "1 minute",
});

await fastify.register(import("@fastify/cors"), {
  origin: "*",
});

const body = S.object().prop("text", S.string().required());

/**
 * Chat endpoint
 */
fastify.post("/chat", { schema: { body } }, async (request, reply) => {
  const { text } = request.body as { text: string };
  if (text.length > MAX_CHARACTERS) {
    reply.status(400).send({ message: "Text too long" });
    return;
  }
  if (await moderateMessage(text)) {
    reply.status(400).send({ message: "Text is flagged" });
    return;
  }
  const sources = await queryIndex(text);
  return await getCompletion(sources, text);
});

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: process.env.HOST || "localhost" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
