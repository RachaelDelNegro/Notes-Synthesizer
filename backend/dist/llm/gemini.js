import { GoogleGenAI } from "@google/genai";
import { parseAndValidateLlmOutput } from "./parse.js";
function prompt(input) {
    const memoryBlock = input.memory && input.memory.trim().length > 0
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
// If prompt fails
function repairPrompt(badOutput) {
    return `
You returned invalid JSON.

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
      "confidence": "number between 0 and 1, or null"
    }
  ]
}

Rules:
- Use double quotes for all JSON strings
- No trailing commas
- If a field is unknown, use null
- Do not add any keys not listed in the schema

Fix the following output into valid JSON:
${badOutput}
`.trim();
}
function safeTextFromStreamChunk(chunk) {
    // @google/genai streaming chunk shapes can vary; try multiple possibilities.
    if (!chunk)
        return "";
    if (typeof chunk.text === "string")
        return chunk.text;
    if (typeof chunk.text === "function") {
        const t = chunk.text();
        if (typeof t === "string")
            return t;
    }
    const parts = chunk?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
        return parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
    }
    return "";
}
export function makeGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    if (!apiKey)
        throw new Error("Missing GEMINI_API_KEY");
    const ai = new GoogleGenAI({ apiKey });
    return {
        provider: "gemini",
        async synthesize(input) {
            const resp = await ai.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt(input) }] }],
            });
            const text = resp.text;
            if (!text)
                throw new Error("Gemini returned empty output");
            try {
                const validated = parseAndValidateLlmOutput(text);
                return {
                    summary: validated.summary,
                    items: validated.items,
                    provider: "gemini",
                    model,
                };
            }
            catch (err) {
                const fixResp = await ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: repairPrompt(text) }] }],
                });
                const fixText = fixResp.text;
                if (!fixText)
                    throw new Error("Gemini returned empty output on repair");
                const validated = parseAndValidateLlmOutput(fixText);
                return {
                    summary: validated.summary,
                    items: validated.items,
                    provider: "gemini",
                    model,
                };
            }
        },
        // streaming version
        async synthesizeStream(input, onEvent) {
            // Stream raw output
            const streamResp = await ai.models.generateContentStream({
                model,
                contents: [{ role: "user", parts: [{ text: prompt(input) }] }],
            });
            let rawText = "";
            let lastLen = 0;
            for await (const chunk of streamResp) {
                const piece = safeTextFromStreamChunk(chunk);
                if (!piece)
                    continue;
                rawText += piece;
                const delta = rawText.slice(lastLen);
                if (delta)
                    onEvent({ type: "delta", text: delta });
                lastLen = rawText.length;
            }
            onEvent({ type: "done", rawText });
            // Parse + validate
            try {
                const validated = parseAndValidateLlmOutput(rawText);
                return {
                    summary: validated.summary,
                    items: validated.items,
                    provider: "gemini",
                    model,
                };
            }
            catch (err) {
                const fixResp = await ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: repairPrompt(rawText) }] }],
                });
                const fixText = fixResp.text;
                if (!fixText)
                    throw new Error("Gemini returned empty output on repair");
                const validated = parseAndValidateLlmOutput(fixText);
                return {
                    summary: validated.summary,
                    items: validated.items,
                    provider: "gemini",
                    model,
                };
            }
        },
    };
}
