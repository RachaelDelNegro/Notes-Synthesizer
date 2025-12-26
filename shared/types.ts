// API Contract

// explicit enums
export type ItemType = "action" | "decision" | "question";
export type Priority = "low" | "medium" | "high";

// matches DB table
export type SynthItem = {
  item_id: string;
  type: ItemType;
  description: string;
  source_text?: string | null;
  confidence?: number | null;

  // action-only fields
  owner?: string | null;
  due_date?: string | null; // ISO date string if available
  priority?: Priority | null;
};

// run-level context - maps 1-to-1 with synthesis_runs DB table
export type SynthesisMetadata = {
  run_id: string;
  created_at: string; // ISO timestamp
  model: string;
  prompt_version: string;
  duration_ms?: number;
  source_type: "pasted" | "uploaded" | "example";
  source_length?: number;
};

export type SynthesizeRequest = {
  source_text: string;
  source_type?: SynthesisMetadata["source_type"];
};

export type SynthesizeResponse = {
  summary: string;
  items: SynthItem[];
  metadata: SynthesisMetadata;
};
