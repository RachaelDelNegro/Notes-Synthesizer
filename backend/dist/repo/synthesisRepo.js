import { db } from "../db.js";
export function insertSynthesisRun(run) {
    db.prepare(`
    INSERT INTO synthesis_runs (
      run_id, source_text, source_type, created_at, prompt_version, model, metadata_json
    ) VALUES (
      @run_id, @source_text, @source_type, @created_at, @prompt_version, @model, COALESCE(@metadata_json, '{}')
    )
  `).run(run);
}
export function insertItems(items) {
    const stmt = db.prepare(`
    INSERT INTO items (
      item_id, run_id, type, description, owner, due_date, priority, source_text, confidence
    ) VALUES (
      @item_id, @run_id, @type, @description, @owner, @due_date, @priority, @source_text, @confidence
    )
  `);
    const tx = db.transaction((rows) => {
        for (const row of rows)
            stmt.run(row);
    });
    tx(items);
}
