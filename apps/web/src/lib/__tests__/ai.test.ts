import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const ORIGINAL_ENV = { ...process.env };

let lastModelSlug: string | null = null;
let lastBaseUrl: string | null = null;
let lastApiKey: string | null = null;
let lastProviderName: string | null = null;

mock.module("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: (config: {
    name: string;
    baseURL: string;
    apiKey: string;
  }) => {
    lastProviderName = config.name;
    lastBaseUrl = config.baseURL;
    lastApiKey = config.apiKey;

    return {
      chatModel: (slug: string) => {
        lastModelSlug = slug;
        return { __mock: true, slug } as unknown;
      },
    };
  },
}));

describe("lib/ai", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    lastModelSlug = null;
    lastBaseUrl = null;
    lastApiKey = null;
    lastProviderName = null;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  test("uses the default model when AI_MODEL is unset", async () => {
    delete process.env.AI_MODEL;
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.OLLAMA_API_KEY;
    const { getModel, DEFAULT_MODEL, DEFAULT_OLLAMA_BASE_URL } = await import("../ai");
    getModel();
    expect(lastModelSlug).toBe(DEFAULT_MODEL);
    expect(lastBaseUrl).toBe(DEFAULT_OLLAMA_BASE_URL);
    expect(lastApiKey).toBe("ollama");
    expect(lastProviderName).toBe("ollama");
  });

  test("respects AI_MODEL when set", async () => {
    process.env.AI_MODEL = "llama3.1";
    process.env.OLLAMA_BASE_URL = "http://localhost:11434/v1";
    process.env.OLLAMA_API_KEY = "secret";
    const { getModel } = await import("../ai");
    getModel();
    expect(lastModelSlug).toBe("llama3.1");
    expect(lastBaseUrl).toBe("http://localhost:11434/v1");
    expect(lastApiKey).toBe("secret");
  });
});
