import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { persistSynthesis } from "../persist.js";
import type { SynthesizeRequest, SynthesizeResponse, SynthItem } from "../../../shared/types.js";
import { makeLlmClient } from "../llm/index.js";


export const synthesizeRouter = Router();

const MAX_CHARS = 50_000;

const llm = makeLlmClient();


const reqSchema = z.object({
  source_text: z.string().min(1).max(MAX_CHARS),
  source_type: z.enum(["pasted", "uploaded", "example"]).optional()
});

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
// Mock Synthesis
function mockSynthesis(sourceText: string, sourceType: SynthesizeResponse["metadata"]["source_type"]): SynthesizeResponse {
  const start = Date.now();
  const run_id = makeId("run");
  const created_at = new Date().toISOString();

  const warnings: string[] = [];

  // Example warning rules
  if (sourceText.trim().length<50) {
    warnings.push("Input is very short; extracted items may be incomplete.")
  }
  if (sourceText.length > MAX_CHARS * 0.95) {
    warnings.push(`Input is near the ${MAX_CHARS.toLocaleString()} character limit; results may miss later context.`);
  }


  const items: SynthItem[] = [
    {
      item_id: makeId("item"),
      type: "action",
      description: "Send follow-up email with next steps",
      owner: null,
      due_date: null,
      priority: "medium",
      source_text: sourceText.slice(0, 140) || null,
      confidence: 0.65
    },
    {
      item_id: makeId("item"),
      type: "decision",
      description: "Use a shared response schema between frontend and backend",
      source_text: sourceText.slice(0, 140) || null,
      confidence: 0.7
    },
    {
      item_id: makeId("item"),
      type: "question",
      description: "What export formats do users need first (JSON vs Markdown vs PDF)?",
      source_text: sourceText.slice(0, 140) || null,
      confidence: 0.6
    }
  ];

  const duration_ms = Date.now() - start;

  return {
    summary: "Mock summary: structured notes with action items, decisions, and questions.",
    items,
    metadata: {
      run_id,
      created_at,
      model: process.env.MODEL_NAME ?? "mock-model",
      prompt_version: process.env.PROMPT_VERSION ?? "v0.1",
      duration_ms,
      source_type: sourceType,
      source_length: sourceText.length,
      warnings
    }
  };
}

synthesizeRouter.post("/", async (req, res) => {
  const parsed = reqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const body = parsed.data as SynthesizeRequest;
  const sourceType = body.source_type ?? "pasted";

  const start = Date.now();
  const run_id = makeId("run");
  const created_at = new Date().toISOString();

  const warnings: string[] = [];
  if (body.source_text.trim().length < 50) {
    warnings.push("Input is very short; extracted items may be incomplete.");
  }
  if (body.source_text.length > MAX_CHARS * 0.95) {
    warnings.push(`Input is near the ${MAX_CHARS.toLocaleString()} character limit; results may miss later context.`);
  }

  try {
    const out = await llm.synthesize({ source_text: body.source_text });

    const items: SynthItem[] = (out.items ?? []).map((it) => ({
      item_id: makeId("item"),
      type: it.type,
      description: it.description,
      owner: it.owner ?? null,
      due_date: it.due_date ?? null,
      priority: it.priority ?? null,
      source_text: it.source_text ?? null,
      confidence: it.confidence ?? null,
    }));

    const result: SynthesizeResponse = {
      summary: out.summary ?? "",
      items,
      metadata: {
        run_id,
        created_at,
        model: out.model,
        prompt_version: process.env.PROMPT_VERSION ?? "v0.2",
        duration_ms: Date.now() - start,
        source_type: sourceType,
        source_length: body.source_text.length,
        warnings,
      },
    };

    // Persist the exact same IDs/result you return
    try {
      persistSynthesis({
        source_text: body.source_text,
        source_type: sourceType,
        result,
      });
      console.log("[db] persisted run", result.metadata.run_id);
    } catch (e) {
      console.error("Failed to persist synthesis:", e);
    }

    return res.json(result);
  } catch (e) {
    console.error("LLM synthesize failed:", e);

    // Fallback to mock so the app stays usable
    const result = mockSynthesis(body.source_text, sourceType);

    try {
      persistSynthesis({
        source_text: body.source_text,
        source_type: sourceType,
        result,
      });
      console.log("[db] persisted run (mock fallback)", result.metadata.run_id);
    } catch (e2) {
      console.error("Failed to persist synthesis (mock fallback):", e2);
    }

    return res.json(result);
  }
});
