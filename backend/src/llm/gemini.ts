import { GoogleGenAI } from "@google/genai";
import type { LlmClient, LlmSynthesizeInput, LlmSynthesizeOutput } from "./types.js";

function prompt(input: LlmSynthesizeInput) { 
  const memoryBlock =
    input.memory && input.memory.trim().length > 0
      ? `
MEMORY CONTEXT (from prior syntheses; use for consistency only):
${input.memory}

Rules:
- Use memory only to keep names/projects consistent and to continue ongoing action items.
- If memory conflicts with the new input notes, the new input notes win.
- Do not invent facts that are not present in either memory or the new input.
`.trim()
      : "";

  return `
You are a meeting-notes synthesizer.

Return ONLY valid JSON (no markdown, no extra text) in this exact shape:
{
  "summary": "string",
  "items": [
    {
      "type": "action" | "decision" | "question",
      "description": "string",
      "owner": "string or null",
      "due_date": "string or null",
      "priority": "low" | "medium" | "high" | null,
      "source_text": "string or null",
      "confidence": "number or null"
    }
  ]
}

Notes:
- summary: <= 6 sentences
- confidence: 0..1
- If unknown, use null
- Use source_text snippets when possible

${memoryBlock ? memoryBlock + "\n\n" : ""}
INPUT:
${input.source_text}
`.trim();
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output");

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }
  throw new Error("Unclosed JSON object in model output");
}

export function makeGeminiClient(): LlmClient {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const ai = new GoogleGenAI({ apiKey });

  return {
    provider: "gemini",
    async synthesize(input: LlmSynthesizeInput): Promise<LlmSynthesizeOutput> {
      const resp = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt(input) }] }],
      });

      const text = resp.text;
      if (!text) throw new Error("Gemini returned empty output");

      const jsonText = extractJsonObject(text);
      const parsed = JSON.parse(jsonText);

      return {
        summary: String(parsed.summary ?? ""),
        items: Array.isArray(parsed.items) ? parsed.items : [],
        provider: "gemini",
        model,
      };
    },
  };
}
