import { GoogleGenAI } from "@google/genai";
import type { LlmClient, LlmSynthesizeInput, LlmSynthesizeOutput } from "./types.js";

function prompt(sourceText: string) {
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

INPUT:
${sourceText}
`.trim();
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found in model output");
  return text.slice(start, end + 1);
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
        contents: [{ role: "user", parts: [{ text: prompt(input.source_text) }] }],
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
