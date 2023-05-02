import * as dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

// if the environment variable is not set, throw an error
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Please set the OPENAI_API_KEY environment variable.");
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
        content: `You are a friendly scientific conference AI assistant. Your job is to answer questions about the conference. You will also have to provide 3 or less sort questions suggestions the user could ask next. Use the format to answer : \`{"text": "response", "suggestions": ["q1", "q2", "q3"]}\`. Answer the user question based on the context. Don't try to invent new context. If you don't know the answer, just say "I don't know". Do not use markdown for the reply. Answer in the language of the question.
""" Context:
The date : ${new Date().toISOString()}
${sources.map((source) => source.text).join("\n\n")}}`
      },
      {
        role: "user",
        content: query
      }
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
    // If the completion is not a valid JSON

    // check if the completion do not contains "{" or "}" and if so, return the completion as is
    if (!textContent.includes("{") && !textContent.includes("}")) {
        return {
            text: textContent,
            suggestions: [],
            sources: uniqueSources
        };
    }

    return {
      text: "Apologies, but I'm having difficulty understanding your question. Would you mind providing more context or rephrasing it in a different way so that I can better assist you?",
      suggestions: [],
      sources: []
    };
  }
}
