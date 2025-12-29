PRAGMA foreign_keys = ON;

-- synthesis_runs (matches database-schema.md)
CREATE TABLE IF NOT EXISTS synthesis_runs (
  run_id TEXT PRIMARY KEY,                 -- UUID for the run
  source_text TEXT NOT NULL,               -- Original input text
  source_type TEXT NOT NULL,               -- 'pasted' | 'uploaded' | 'example'
  created_at TEXT NOT NULL,                -- ISO timestamp
  prompt_version TEXT NOT NULL,            -- Version of prompt used
  model TEXT NOT NULL,                     -- Model used for synthesis
  summary TEXT,                            -- Text display
  metadata_json TEXT NOT NULL DEFAULT '{}'  -- JSON string
);

-- items (unified table: actions/decisions/questions)
CREATE TABLE IF NOT EXISTS items (
  item_id TEXT PRIMARY KEY,                -- UUID
  run_id TEXT NOT NULL,                    -- FK -> synthesis_runs
  type TEXT NOT NULL,                      -- 'action' | 'decision' | 'question'
  description TEXT NOT NULL,
  source_text TEXT,
  confidence REAL,

  -- action-only fields (nullable otherwise)
  owner TEXT,
  due_date TEXT,
  priority TEXT,                           -- 'low' | 'medium' | 'high'

  FOREIGN KEY (run_id) REFERENCES synthesis_runs(run_id) ON DELETE CASCADE,
  CHECK (type IN ('action', 'decision', 'question')),
  CHECK (
    (type = 'action') OR
    (type IN ('decision', 'question') AND owner IS NULL AND due_date IS NULL AND priority IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_items_run_id ON items(run_id);
CREATE INDEX IF NOT EXISTS idx_items_run_id_type ON items(run_id, type);
