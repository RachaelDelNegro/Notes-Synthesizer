import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DB_PATH ??
  path.resolve(process.cwd(), "data", "notes_synth.db"); // when running from backend/

// ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// run schema on startup (idempotent)
try {
  const schemaPath = path.resolve(process.cwd(), "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  db.exec(schemaSql);
  console.log("[db] schema ensured:", schemaPath);
} catch (e) {
  console.error("[db] failed to load schema.sql:", e);
}

console.log("[db] sqlite:", dbPath);
