import * as dotenv from "dotenv";
dotenv.config();
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Creates an embedding for the given text using the specified model and returns the generated embedding.
 *
 * @param {string} text - The text for which the embedding should be created.
 * @returns {Promise<number[]>} An array representing the generated embedding.
 * @throws {Error} If no embedding can not be created.
 */
export async function createEmbedding(text: string) {
  const { data } = await openai.createEmbedding({
    input: text,
    model: "text-embedding-ada-002",
  });
  if (data.data.length === 0) {
    throw new Error("Can not create embedding.");
  }
  return data.data[0].embedding;
}

/**
 * Moderates a given message and returns a boolean indicating whether the message is flagged or not.
 *
 * @param {string} text - The message to be moderated.
 * @returns {Promise<boolean>} A boolean indicating whether the message is flagged (true) or not (false).
 */
export async function moderateMessage(text: string): Promise<boolean> {
  const { data: moderationData } = await openai.createModeration({
    input: text,
  });

  return moderationData.results[0].flagged;
}

export async function getCompletion(
  sources: { text: string; url: string }[],
  query: string
): Promise<{ text: string; suggestions: string[]; sources: string[] }> {
  const { data } = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a friendly scientific conference AI assistant. Your job is to answer questions about the conference. You will also have to provide 3 or less sort questions suggestions the user could ask next. Use the format to answer : \`{"text": "response", "suggestions": ["q1", "q2", "q3"]}\` In each of the user input, a context will be added, answer the user question based on the context. Don't try to invent new context. Do not talk about the context in your reply. If you don't know the answer, just say "I don't know". Do not use markdown for the reply.`,
      },
      {
        role: "user",
        content: `""" Context:
The date : ${new Date().toISOString()}
${sources.map((source) => source.text).join("\n\n")}}

""" Question: ${query}`,
      },
    ],
    max_tokens: 400,
  });
  if (data.choices.length === 0) {
    throw new Error("No completion found.");
  }
  if (data.choices[0].message === undefined) {
    throw new Error("No completion found.");
  }
  const textContent = data.choices[0].message.content;

  const uniqueSources = [...new Set(sources.map((source) => source.url))];
  try {
    const { text, suggestions } = JSON.parse(textContent);
    return { text, suggestions, sources: uniqueSources };
  } catch (e) {
    // If the completion is not a valid JSON, we return the completion as text and no suggestions as the OpenAI API may have failed to generate suggestions.
    return { text: textContent, suggestions: [], sources: uniqueSources };
  }
}
