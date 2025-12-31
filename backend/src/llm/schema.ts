import { z } from "zod";

export const LlmItemSchema = z.object({
  type: z.enum(["action", "decision", "question"]),
  description: z.string().min(1).max(5000),

  owner: z.string().min(1).max(200).nullable().optional(),
  due_date: z.string().min(1).max(100).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  source_text: z.string().min(1).max(500).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export const LlmOutputSchema = z.object({
  summary: z.string().max(6000),
  items: z.array(LlmItemSchema).max(50).default([]),
});

export type LlmOutput = z.infer<typeof LlmOutputSchema>;
