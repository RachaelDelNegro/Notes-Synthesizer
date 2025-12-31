import { LlmOutputSchema } from "./schema.js";

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output");

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;

    if (depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("Unclosed JSON object in model output");
}

function normalize(parsed: any) {
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.items)) {
      for (const it of parsed.items) {
        // confidence sometimes arrives as string
        if (typeof it?.confidence === "string") {
          const n = Number(it.confidence);
          it.confidence = Number.isFinite(n) ? n : null;
        }
        // empty strings -> null for nullable fields
        for (const k of ["owner", "due_date", "priority", "source_text"]) {
          if (it?.[k] === "") it[k] = null;
        }
      }
    }
  }
  return parsed;
}

export function parseAndValidateLlmOutput(rawText: string) {
  const jsonText = extractJsonObject(rawText);
  const parsed = normalize(JSON.parse(jsonText));

  const validated = LlmOutputSchema.parse(parsed);

  // Final cleanup: ensure nullable fields exist
  const items = validated.items.map((it) => ({
    ...it,
    owner: it.owner ?? null,
    due_date: it.due_date ?? null,
    priority: it.priority ?? null,
    source_text: it.source_text ?? null,
    confidence: it.confidence ?? null,
  }));

  return { summary: validated.summary, items };
}
