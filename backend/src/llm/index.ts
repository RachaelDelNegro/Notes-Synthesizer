import type { LlmClient } from "./types.js";
import { makeGeminiClient } from "./gemini.js";

export function makeLlmClient(): LlmClient {
  return makeGeminiClient();
}
