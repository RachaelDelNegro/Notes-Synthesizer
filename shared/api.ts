import type { SynthesizeResponse } from "./types.js";

// GET /api/runs
export type RunsListItem = {
  run_id: string;
  created_at: string;
  source_type: "pasted" | "uploaded" | "example";
  model: string;
  prompt_version: string;
  source_length: number;
};

export type RunsListResponse = { runs: RunsListItem[] };

// GET /api/runs/:runId
export type RunDetailResponse = {
  result: SynthesizeResponse;
  source_text: string;
};
