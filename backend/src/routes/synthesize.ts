import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { persistSynthesis } from "../persist.js";
import type { SynthesizeRequest, SynthesizeResponse, SynthItem } from "../../../shared/dist/types.js";
import { makeLlmClient } from "../llm/index.js";
import { getMemoryBlock } from "../memory/getMemoryBlock.js";


export const synthesizeRouter = Router();

const MAX_CHARS = 50_000;


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

  const warnings: string[] = [];
  const wordCount = body.source_text.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 20) warnings.push("Input is very short; extracted items may be incomplete.");
  if (body.source_text.length > MAX_CHARS * 0.95) {
    warnings.push(`Input is near the ${MAX_CHARS.toLocaleString()} character limit; results may miss later context.`);
  }

  const run_id = makeId("run");
  const created_at = new Date().toISOString();

  const tTotal0 = Date.now();

  try {
    const llm = makeLlmClient();

    const tMem0 = Date.now();
    const memory = getMemoryBlock({ limit: 3, maxChars: 2000, sourceType });
    const memory_ms = Date.now() - tMem0;

    const tLlm0 = Date.now();
    const out = await llm.synthesize({ source_text: body.source_text, memory });
    const llm_ms = Date.now() - tLlm0;

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

    const total_ms = Date.now() - tTotal0;

    const result: SynthesizeResponse = {
      summary: out.summary ?? "",
      items,
      metadata: {
        run_id,
        created_at,
        model: out.model,
        prompt_version: process.env.PROMPT_VERSION ?? "v0.2",
        duration_ms: total_ms,
        source_type: sourceType,
        source_length: body.source_text.length,
        warnings,
        timings_ms: {
          total: total_ms,
          llm: llm_ms,
          memory: memory_ms,
          db: null, // will be filled after persist (response), DB needs update if you want it saved
        },
      } as any,
    };

    // Persist + measure db timing
    const tDb0 = Date.now();
    persistSynthesis({ source_text: body.source_text, source_type: sourceType, result });
    const db_ms = Date.now() - tDb0;

    // This updates the response (NOT the DB) unless you run UPDATE in persist layer
    (result.metadata as any).timings_ms.db = db_ms;

    console.log("[metrics]", {
      run_id,
      total_ms,
      llm_ms,
      memory_ms,
      db_ms,
      chars: body.source_text.length,
      items: items.length,
      model: out.model,
    });

    return res.json(result);
  } catch (e) {
    console.error("LLM synthesize failed:", e);

    const result = mockSynthesis(body.source_text, sourceType);

    try {
      persistSynthesis({ source_text: body.source_text, source_type: sourceType, result });
      console.log("[db] persisted run (mock fallback)", result.metadata.run_id);
    } catch (e2) {
      console.error("Failed to persist synthesis (mock fallback):", e2);
    }

    return res.json(result);
  }
});

// Streaming

synthesizeRouter.post("/stream", async (req, res) => {
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
  const wordCount = body.source_text.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 20) warnings.push("Input is very short; extracted items may be incomplete.");
  if (body.source_text.length > MAX_CHARS * 0.95) {
    warnings.push(`Input is near the ${MAX_CHARS.toLocaleString()} character limit; results may miss later context.`);
  }

  // ---- SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Let the client know streaming started
  send("meta", { run_id, created_at, warnings });

  // Allow client to cancel by closing connection
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    const llm = makeLlmClient();
    const memory = getMemoryBlock({ limit: 3, maxChars: 2000, sourceType });

    // For now, until we wire Gemini streaming:
    // simulate a few deltas so you can verify SSE works end-to-end
    send("delta", { text: "Synthesizing summary...\n" });
    await new Promise(r => setTimeout(r, 300));
    send("delta", { text: "Extracting action items...\n" });
    await new Promise(r => setTimeout(r, 300));
    send("delta", { text: "Finalizing...\n" });

    // Then do your normal synthesize (non-stream) and send final:
    const out = await llm.synthesize({ source_text: body.source_text, memory });

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

    const warnings: string[] = [];
    const result: SynthesizeResponse = {
      summary: out.summary ?? "",
      items,
      metadata: {
        run_id,
        created_at,
        model: out.model,
        prompt_version: process.env.PROMPT_VERSION ?? "v0.3",
        duration_ms: Date.now() - start,
        source_type: sourceType,
        source_length: body.source_text.length,
        warnings,
      },
    };

    // Persist
    try {
      persistSynthesis({ source_text: body.source_text, source_type: sourceType, result });
    } catch (e) {
      console.error("Failed to persist synthesis:", e);
    }

    send("final", result);
    res.end();
  } catch (e: any) {
    console.error("[stream] error:", e);
    send("error", { message: e?.message ?? String(e) });
    res.end();
    }
  }
);
