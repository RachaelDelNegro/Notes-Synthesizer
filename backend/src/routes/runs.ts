import { Router } from "express";
import { db } from "../db.js";
import type { SynthesizeResponse, SynthItem } from "../../../shared/types.js";

export const runsRouter = Router();

type RunRow = {
  run_id: string;
  created_at: string;
  source_type: "pasted" | "uploaded" | "example";
  model: string;
  prompt_version: string;
  summary: string | null;
  metadata_json: string;
  source_text: string;
};

// GET /api/runs?limit=20
runsRouter.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  const rows = db
    .prepare(
      `
      SELECT run_id, created_at, source_type, model, prompt_version, LENGTH(source_text) AS source_length
      FROM synthesis_runs
      ORDER BY created_at DESC
      LIMIT ?
    `
    )
    .all(limit);

  res.json({ runs: rows });
});

// GET /api/runs/:runId
runsRouter.get("/:runId", (req, res) => {
  const runId = req.params.runId;

  const run = db
    .prepare(
      `
      SELECT run_id, created_at, source_type, model, prompt_version, summary, metadata_json, source_text
      FROM synthesis_runs
      WHERE run_id = ?
    `
    )
    .get(runId) as RunRow | undefined;

  if (!run) return res.status(404).json({ error: "Run not found" });

  const items = db
    .prepare(
      `
      SELECT item_id, type, description, owner, due_date, priority, source_text, confidence
      FROM items
      WHERE run_id = ?
    `
    )
    .all(runId) as SynthItem[];

  const metadata = JSON.parse(run.metadata_json) as SynthesizeResponse["metadata"];

  // Ensure metadata matches the run row (in case you ever change metadata_json format)
  const result: SynthesizeResponse = {
    summary: run.summary ?? "",
    items,
    metadata: {
      ...metadata,
      run_id: run.run_id,
      created_at: run.created_at,
      source_type: run.source_type,
      model: run.model,
      prompt_version: run.prompt_version,
    },
  };

  res.json({ result, source_text: run.source_text });
});
