import * as React from "react";
import { toast } from "sonner";

import type { SynthesizeResponse, SynthItem } from "@shared/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Vertical slice goals:
 * - Paste notes
 * - Click Synthesize (mocked)
 * - Loading state
 * - Results in tabs (Summary / Action Items / Decisions / Questions)
 * - Edit items
 * - Export to Markdown (copy + download)
 */

// -------------------- Local view model (tolerant of shared types) --------------------
type Priority = "low" | "medium" | "high";
type ActionItemVM = {
  id: string;
  text: string;
  owner?: string;
  due?: string;
  priority: Priority;
  done: boolean;
};

type SynthesisVM = {
  summary: string;
  actionItems: ActionItemVM[];
  decisions: { id: string; text: string }[];
  questions: { id: string; text: string; status: "open" | "answered" }[];
};

// -------------------- Mock synthesis (replace with fetch later) --------------------
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockSynthesize(notes: string): Promise<SynthesisVM> {
  await sleep(700);

  const mentionsDb = /db|database|sqlite|postgres/i.test(notes);

  return {
    summary:
      "MVP flow confirmed: paste/upload notes → synthesize → review/edit → export. Focus on clarity and trust with editable structured outputs.",
    actionItems: [
      {
        id: crypto.randomUUID(),
        text: "Replace mock synthesis with POST /api/synthesize (Express backend)",
        owner: "Rachael",
        due: "This week",
        priority: "high",
        done: false,
      },
      {
        id: crypto.randomUUID(),
        text: "Add empty states + error states for each tab",
        owner: "Rachael",
        due: "Next",
        priority: "medium",
        done: false,
      },
      {
        id: crypto.randomUUID(),
        text: mentionsDb ? "Decide whether to persist runs in DB for MVP" : "Define export formats (Markdown first, then JSON)",
        owner: "Team",
        due: "",
        priority: "low",
        done: false,
      },
    ],
    decisions: [
      { id: crypto.randomUUID(), text: "Use shadcn/ui (Radix + Tailwind) as the component library." },
      { id: crypto.randomUUID(), text: "Ship a vertical slice UI before backend integration." },
    ],
    questions: [
      { id: crypto.randomUUID(), text: "What’s the minimum structure needed for MVP outputs?", status: "open" },
      { id: crypto.randomUUID(), text: "Do we store runs (history) or keep it stateless at first?", status: "open" },
    ],
  };
}

// -------------------- Export helpers --------------------
function toMarkdown(vm: SynthesisVM) {
  const lines: string[] = [];
  lines.push("# Notes Synthesis", "");
  lines.push("## Summary", vm.summary.trim(), "");
  lines.push("## Action Items");
  vm.actionItems.forEach((a) => {
    const meta = [
      a.owner ? `Owner: ${a.owner}` : null,
      a.due ? `Due: ${a.due}` : null,
      `Priority: ${a.priority}`,
      a.done ? "Status: done" : "Status: open",
    ].filter(Boolean);
    lines.push(`- [${a.done ? "x" : " "}] ${a.text}${meta.length ? ` (${meta.join(" • ")})` : ""}`);
  });
  lines.push("");
  lines.push("## Decisions");
  vm.decisions.forEach((d) => lines.push(`- ${d.text}`));
  lines.push("");
  lines.push("## Questions");
  vm.questions.forEach((q) => lines.push(`- (${q.status}) ${q.text}`));
  lines.push("");
  return lines.join("\n");
}

function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------- App --------------------
export default function App() {
  const [notes, setNotes] = React.useState<string>(
    "Met with mentor. Discussed MVP: paste/upload notes, synthesize structured outputs, edit, export.\nDecision: use shadcn/ui.\nAction: wire /api/synthesize.\nQuestion: store runs in DB or stateless?"
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"summary" | "actions" | "decisions" | "questions">("summary");

  // You can later swap SynthesisVM to SynthesizeResponse after your backend is ready.
  const [result, setResult] = React.useState<SynthesisVM | null>(null);

  async function onSynthesize() {
    if (!notes.trim()) {
      toast("Paste some notes first.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await mockSynthesize(notes);

      // Example: if you want to prove the shared types compile without using them yet:
      // const _typecheckOnly: SynthesizeResponse | null = null;
      // const _item: SynthItem | null = null;

      setResult(res);
      setActiveTab("summary");
      toast("Synthesis ready.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setIsLoading(false);
    setActiveTab("summary");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Notes Synthesizer</h1>
            <p className="text-sm text-muted-foreground">
              Paste meeting notes, synthesize structured outputs, then edit and export.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={reset} disabled={isLoading}>
              Reset
            </Button>
            <Button variant="destructive" onClick={onSynthesize} disabled={isLoading}>
              {isLoading ? "Synthesizing…" : "Synthesize"}
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Paste your transcript or rough notes. Upload can come next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Meeting notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste notes here…"
                  className="min-h-[280px] resize-none"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Tip: explicit “Action/Decision/Question” lines improve structure.
                </p>
                <Button variant="outline" onClick={() => setNotes("")} disabled={isLoading}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>Vertical slice output (mock synthesis for now).</CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !isLoading && (
                <div className="rounded-xl border p-6 text-sm text-muted-foreground">
                  Click <span className="font-medium">Synthesize</span> to see structured results.
                </div>
              )}

              {isLoading && (
                <div className="space-y-3">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <Separator className="my-4" />
                  <div className="h-24 w-full rounded bg-muted" />
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Mock run</Badge>
                    <Badge variant="outline">V0 vertical slice</Badge>
                    <div className="ml-auto">
                      <ExportDialog result={result} />
                    </div>
                  </div>

                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                      <TabsTrigger value="decisions">Decisions</TabsTrigger>
                      <TabsTrigger value="questions">Questions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-4">
                      <Card className="rounded-2xl">
                        <CardHeader>
                          <CardTitle className="text-base">Meeting summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            value={result.summary}
                            onChange={(e) => setResult({ ...result, summary: e.target.value })}
                            className="min-h-[160px] resize-none"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">Edits are local state for now.</p>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="actions" className="mt-4">
                      <ActionItemsPanel
                        items={result.actionItems}
                        onChange={(items) => setResult({ ...result, actionItems: items })}
                      />
                    </TabsContent>

                    <TabsContent value="decisions" className="mt-4">
                      <SimpleListPanel
                        title="Decisions"
                        items={result.decisions}
                        onChange={(items) => setResult({ ...result, decisions: items })}
                        placeholder="Add a decision…"
                      />
                    </TabsContent>

                    <TabsContent value="questions" className="mt-4">
                      <QuestionsPanel
                        items={result.questions}
                        onChange={(items) => setResult({ ...result, questions: items })}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground">
          Next: swap <code className="px-1 py-0.5 rounded bg-muted">mockSynthesize()</code> for a real{" "}
          <code className="px-1 py-0.5 rounded bg-muted">fetch("/api/synthesize")</code>.
        </div>
      </div>
    </div>
  );
}

// -------------------- Export dialog --------------------
function ExportDialog({ result }: { result: SynthesisVM }) {
  const markdown = React.useMemo(() => toMarkdown(result), [result]);

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    toast("Copied to clipboard.");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Export</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>Copy or download formatted output.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[320px] rounded-lg border p-3">
          <pre className="text-xs whitespace-pre-wrap">{markdown}</pre>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={copy}>
            Copy to clipboard
          </Button>
          <Button onClick={() => downloadText("notes-synthesis.md", markdown, "text/markdown;charset=utf-8")}>
            Download .md
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------- Panels --------------------
function priorityVariant(p: Priority): "default" | "secondary" | "destructive" | "outline" {
  if (p === "high") return "destructive";
  if (p === "medium") return "default";
  return "secondary";
}

function ActionItemsPanel({
  items,
  onChange,
}: {
  items: ActionItemVM[];
  onChange: (items: ActionItemVM[]) => void;
}) {
  function update(id: string, patch: Partial<ActionItemVM>) {
    onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function add() {
    onChange([
      {
        id: crypto.randomUUID(),
        text: "New action item",
        owner: "",
        due: "",
        priority: "low",
        done: false,
      },
      ...items,
    ]);
  }

  function remove(id: string) {
    onChange(items.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Action items</h3>
        <Button size="sm" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id} className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={a.done}
                  onChange={(e) => update(a.id, { done: e.target.checked })}
                  className="h-4 w-4"
                />
                <Badge variant={priorityVariant(a.priority)} className="capitalize">
                  {a.priority}
                </Badge>

                <div className="ml-auto">
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                    Remove
                  </Button>
                </div>
              </div>

              <Textarea
                value={a.text}
                onChange={(e) => update(a.id, { text: e.target.value })}
                className="min-h-[84px] resize-none"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Owner</Label>
                  <Input value={a.owner ?? ""} onChange={(e) => update(a.id, { owner: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Due</Label>
                  <Input value={a.due ?? ""} onChange={(e) => update(a.id, { due: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={a.priority}
                    onChange={(e) => update(a.id, { priority: e.target.value as Priority })}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SimpleListPanel<T extends { id: string; text: string }>({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = React.useState("");

  function add() {
    if (!draft.trim()) return;
    onChange([{ id: crypto.randomUUID(), text: draft.trim() } as T, ...items]);
    setDraft("");
  }

  function update(id: string, text: string) {
    onChange(items.map((x) => (x.id === id ? ({ ...x, text } as T) : x)));
  }

  function remove(id: string) {
    onChange(items.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>

      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        <Button variant="secondary" onClick={add}>
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((x) => (
          <Card key={x.id} className="rounded-2xl">
            <CardContent className="p-4 flex items-start gap-2">
              <Textarea
                value={x.text}
                onChange={(e) => update(x.id, e.target.value)}
                className="min-h-[64px] resize-none"
              />
              <Button variant="ghost" onClick={() => remove(x.id)}>
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QuestionsPanel({
  items,
  onChange,
}: {
  items: { id: string; text: string; status: "open" | "answered" }[];
  onChange: (items: { id: string; text: string; status: "open" | "answered" }[]) => void;
}) {
  const [draft, setDraft] = React.useState("");

  function add() {
    if (!draft.trim()) return;
    onChange([{ id: crypto.randomUUID(), text: draft.trim(), status: "open" }, ...items]);
    setDraft("");
  }

  function update(id: string, patch: Partial<{ text: string; status: "open" | "answered" }>) {
    onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function remove(id: string) {
    onChange(items.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Questions</h3>

      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a question…" />
        <Button variant="secondary" onClick={add}>
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((q) => (
          <Card key={q.id} className="rounded-2xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={q.status === "open" ? "default" : "secondary"} className="capitalize">
                  {q.status}
                </Badge>

                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update(q.id, { status: q.status === "open" ? "answered" : "open" })}
                  >
                    Toggle
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(q.id)}>
                    Remove
                  </Button>
                </div>
              </div>

              <Textarea
                value={q.text}
                onChange={(e) => update(q.id, { text: e.target.value })}
                className="min-h-[72px] resize-none"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
