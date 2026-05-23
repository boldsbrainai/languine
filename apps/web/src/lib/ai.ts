import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const DEFAULT_MODEL = "phi3";
export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434/v1";

export function getModel() {
  const slug = process.env.AI_MODEL || DEFAULT_MODEL;
  const ollama = createOpenAICompatible({
    name: "ollama",
    baseURL: process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL,
    apiKey: process.env.OLLAMA_API_KEY || "ollama",
  });

  return ollama.chatModel(slug);
}
