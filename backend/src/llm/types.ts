export type ProviderName = "gemini" | "mock"; // ability to add others later

export type LlmSynthesizeInput = {
  source_text: string;
  memory?: string;
};

export type LlmItem = {
  type: "action" | "decision" | "question";
  description: string;
  owner?: string | null;
  due_date?: string | null;
  priority?: "low" | "medium" | "high" | null;
  source_text?: string | null;
  confidence?: number | null;
};

export type LlmSynthesizeOutput = {
  summary: string;
  items: LlmItem[];
  provider: ProviderName;
  model: string;
};

// Streaming
export type LlmStreamEvent =
  | { type: "delta"; text: string } // incremental text
  | { type: "done"; rawText: string }; // full raw model output

export interface LlmClient {
  provider: ProviderName;
  synthesize(input: LlmSynthesizeInput): Promise<LlmSynthesizeOutput>;

  synthesizeStream?: (
    input: LlmSynthesizeInput,
    onEvent: (ev: LlmStreamEvent) => void
  ) => Promise<LlmSynthesizeOutput>;
}
