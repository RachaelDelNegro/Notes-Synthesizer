import { db } from "../db.js";

export type GetMemoryBlockOpts = {
  limit?: number; // number of runs
  maxChars?: number; // cap memory size
  sourceType?: "pasted" | "uploaded" | "example"; // optional filter
};

function clamp(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export function getMemoryBlock(opts: GetMemoryBlockOpts = {}) {
  const limit = opts.limit ?? 3;
  const maxChars = opts.maxChars ?? 2000;

  // 1) Fetch recent runs
  const runs = opts.sourceType
    ? db
        .prepare(
          `
          SELECT run_id, created_at, summary
          FROM synthesis_runs
          WHERE source_type = ?
          ORDER BY created_at DESC
          LIMIT ?
        `
        )
        .all(opts.sourceType, limit) as Array<{ run_id: string; created_at: string; summary: string }>
    : db
        .prepare(
          `
          SELECT run_id, created_at, summary
          FROM synthesis_runs
          ORDER BY created_at DESC
          LIMIT ?
        `
        )
        .all(limit) as Array<{ run_id: string; created_at: string; summary: string }>;

  if (!runs.length) return "";

  // 2) Fetch items for those runs
  const runIds = runs.map((r) => r.run_id);
  const placeholders = runIds.map(() => "?").join(",");

  const items = db
    .prepare(
      `
      SELECT run_id, type, description, owner, due_date, priority
      FROM items
      WHERE run_id IN (${placeholders})
      ORDER BY run_id, item_id
    `
    )
    .all(...runIds) as Array<{
    run_id: string;
    type: string;
    description: string;
    owner: string | null;
    due_date: string | null;
    priority: string | null;
  }>;

  const itemsByRun = new Map<string, typeof items>();
  for (const it of items) {
    const arr = itemsByRun.get(it.run_id) ?? [];
    arr.push(it);
    itemsByRun.set(it.run_id, arr);
  }

  // 3) Build a compact memory block
  const blocks: string[] = [];
  for (const r of runs) {
    const runItems = itemsByRun.get(r.run_id) ?? [];

    const pick = (t: string) =>
      runItems
        .filter((i) => (i.type ?? "").toLowerCase() === t)
        .slice(0, 3)
        .map((i) => {
          const base = clamp(i.description || "(no description)", 170);
          const owner = i.owner ? ` (owner: ${i.owner})` : "";
          const due = i.due_date ? ` (due: ${i.due_date})` : "";
          const pr = i.priority ? ` (priority: ${i.priority})` : "";
          return `- ${base}${owner}${due}${pr}`;
        });

    const actions = pick("action");
    const decisions = pick("decision");
    const questions = pick("question");

    const lines: string[] = [];
    lines.push(`Run ${r.created_at}`);
    lines.push(`Summary: ${clamp(r.summary ?? "", 240) || "(no summary)"}`);

    if (actions.length) lines.push("Action items:", ...actions);
    if (decisions.length) lines.push("Decisions:", ...decisions);
    if (questions.length) lines.push("Open questions:", ...questions);

    blocks.push(lines.join("\n"));
  }

  const memory = [
    "MEMORY (recent runs; use for consistency only—names/projects/ongoing tasks; do not invent facts):",
    ...blocks.map((b) => `---\n${b}`),
  ].join("\n");

  return clamp(memory, maxChars);
}
