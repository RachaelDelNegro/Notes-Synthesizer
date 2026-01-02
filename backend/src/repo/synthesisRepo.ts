import { db } from "../db.js";

type ItemType = "action" | "decision" | "question";
type Priority = "low" | "medium" | "high";

export function insertSynthesisRun(run: {
  run_id: string;
  source_text: string;
  source_type: "pasted" | "uploaded" | "example";
  created_at: string;
  prompt_version: string;
  model: string;
  metadata_json?: string;
}) {
  db.prepare(`
    INSERT INTO synthesis_runs (
      run_id, source_text, source_type, created_at, prompt_version, model, metadata_json
    ) VALUES (
      @run_id, @source_text, @source_type, @created_at, @prompt_version, @model, COALESCE(@metadata_json, '{}')
    )
  `).run(run);
}

export function insertItems(
  items: Array<{
    item_id: string;
    run_id: string;
    type: ItemType;
    description: string;
    owner?: string | null;
    due_date?: string | null;
    priority?: Priority | null;
    source_text?: string | null;
    confidence?: number | null;
  }>
) {
  const stmt = db.prepare(`
    INSERT INTO items (
      item_id, run_id, type, description, owner, due_date, priority, source_text, confidence
    ) VALUES (
      @item_id, @run_id, @type, @description, @owner, @due_date, @priority, @source_text, @confidence
    )
  `);

  const tx = db.transaction((rows:  any[]) => {
    for (const row of rows) stmt.run(row);
  });

  tx(items);
}
