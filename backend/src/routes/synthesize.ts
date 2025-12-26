import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import type { SynthesizeRequest, SynthesizeResponse, SynthItem } from "../../../shared/types.js";

export const synthesizeRouter = Router();

const reqSchema = z.object({
  source_text: z.string().min(1).max(50_000),
  source_type: z.enum(["pasted", "uploaded", "example"]).optional()
});

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function mockSynthesis(sourceText: string, sourceType: SynthesizeResponse["metadata"]["source_type"]): SynthesizeResponse {
  const start = Date.now();
  const run_id = makeId("run");
  const created_at = new Date().toISOString();

  // Very dumb mock extraction (placeholder for your real pipeline)
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
      source_length: sourceText.length
    }
  };
}

synthesizeRouter.post("/", (req, res) => {
  const parsed = reqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const body = parsed.data as SynthesizeRequest;
  const sourceType = body.source_type ?? "pasted";

  const result = mockSynthesis(body.source_text, sourceType);
  res.json(result);
});
