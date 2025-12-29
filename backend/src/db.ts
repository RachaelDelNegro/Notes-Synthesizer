import Database from "better-sqlite3";
import path from "path";

const dbPath =
  process.env.DB_PATH ??
  path.resolve(process.cwd(), "data", "notes_synth.db"); // when running from backend/

export const db = new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
