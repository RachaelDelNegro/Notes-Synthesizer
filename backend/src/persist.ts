import { db } from "./db.js";
import type { SynthesizeResponse} from "../../../shared/dist/types.js"

const insertRun = db.prepare(`
  INSERT INTO synthesis_runs (
    run_id, source_text, source_type, created_at, prompt_version, model, summary, metadata_json
  ) VALUES (
    @run_id, @source_text, @source_type, @created_at, @prompt_version, @model, @summary, @metadata_json
  )
`);

const insertItem = db.prepare(`
  INSERT INTO items (
    item_id, run_id, type, description, source_text, confidence, owner, due_date, priority
  ) VALUES (
    @item_id, @run_id, @type, @description, @source_text, @confidence, @owner, @due_date, @priority
  )
`);

export function persistSynthesis(args: {
  source_text: string;
  source_type: SynthesizeResponse["metadata"]["source_type"];
  result: SynthesizeResponse;
}) {
  const { source_text, source_type, result } = args;
  const run_id = result.metadata.run_id;

  const metadata_json = JSON.stringify(result.metadata);

  const tx = db.transaction(() => {
    insertRun.run({
      run_id,
      source_text,
      source_type,
      created_at: result.metadata.created_at,
      prompt_version: result.metadata.prompt_version,
      model: result.metadata.model,
      summary: result.summary,
      metadata_json,
    });

    for (const it of result.items) {
      // Normalize action-only fields to NULL when not action
      const owner = it.type === "action" ? it.owner ?? null : null;
      const due_date = it.type === "action" ? it.due_date ?? null : null;
      const priority = it.type === "action" ? (it.priority ?? null) : null;

      insertItem.run({
        item_id: it.item_id,
        run_id,
        type: it.type,
        description: it.description,
        source_text: it.source_text ?? null,
        confidence: typeof it.confidence === "number" ? it.confidence : null,
        owner,
        due_date,
        priority,
      });
    }
  });

  tx();
}
