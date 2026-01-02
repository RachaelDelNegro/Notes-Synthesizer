import { Router } from "express";
import { db } from "../db.js";
import { z } from "zod";
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);
const runIdSchema = z.string().min(1).max(200);
export const runsRouter = Router();
const listRunsStmt = db.prepare(`
  SELECT run_id, created_at, source_type, model, prompt_version,
         LENGTH(source_text) AS source_length
  FROM synthesis_runs
  ORDER BY created_at DESC
  LIMIT ?
`);
const getRunStmt = db.prepare(`
  SELECT run_id, created_at, source_type, model, prompt_version, summary, metadata_json, source_text
  FROM synthesis_runs
  WHERE run_id = ?
`);
const getItemsStmt = db.prepare(`
  SELECT item_id, type, description, owner, due_date, priority, source_text, confidence
  FROM items
  WHERE run_id = ?
`);
// GET /api/runs
runsRouter.get("/", (req, res) => {
    const limit = limitSchema.parse(req.query.limit);
    const rows = listRunsStmt.all(limit);
    const payload = { runs: rows };
    res.json(payload);
});
// GET /api/runs/:runId
runsRouter.get("/:runId", (req, res) => {
    const runId = runIdSchema.parse(req.params.runId);
    const run = getRunStmt.get(runId);
    if (!run)
        return res.status(404).json({ error: "Run not found" });
    const items = getItemsStmt.all(runId);
    const metadata = JSON.parse(run.metadata_json);
    const result = {
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
    const payload = { result, source_text: run.source_text };
    res.json(payload);
});
