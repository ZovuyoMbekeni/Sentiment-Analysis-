import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { classifyTexts, type Classification } from "@/lib/sentiment.functions";
import { cleanText } from "@/lib/analysis";
import { useResults } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel, Section, SentimentBadge } from "./shared";

const EMOJIS = ["😍", "👍", "😊", "🤩", "🥳", "😡", "🙄", "😢", "💔", "👎", "😂", "🤔"] as const;

export function AnalyseText() {
  const classify = useServerFn(classifyTexts);
  const { addRows } = useResults();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<(Classification & { cleaned: string }) | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(e: string) {
    const el = areaRef.current;
    const at = el ? (el.selectionStart ?? text.length) : text.length;
    const next = text.slice(0, at) + e + text.slice(at);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = at + e.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  async function run() {
    const cleaned = cleanText(text);
    if (!cleaned) { toast.error("Please enter some text to analyse."); return; }
    if (cleaned.length > 4000) { toast.error("Text is too long (max 4,000 characters)."); return; }
    setBusy(true);
    try {
      const [r] = await classify({ data: { texts: [cleaned] } });
      if (!r) throw new Error("Model returned no classification.");
      setLast({ ...r, cleaned });
      addRows([{ id: crypto.randomUUID(), original: text, cleaned, ...r, date: new Date().toISOString().slice(0, 10), source: "text" }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Analyse Text" step="Steps 2–4" subtitle="Text is cleaned (whitespace, HTML, links removed) and sent to a large language model that classifies its sentiment. Each result is added to the dashboard.">
      <Panel className="space-y-4">
        <Textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I really enjoyed using this application. It is easy to use and very helpful."
          aria-label="Text to analyse"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{text.length} / 4000</span>
          <Button onClick={run} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Analyse Sentiment
          </Button>
        </div>
      </Panel>
      {last && (
        <Panel className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <SentimentBadge label={last.label} />
            <span className="font-mono text-sm">Confidence {(last.confidence * 100).toFixed(0)}%</span>
          </div>
          <p className="text-sm">{last.explanation}</p>
          <p className="font-mono text-xs text-muted-foreground">Preprocessed input: “{last.cleaned}”</p>
        </Panel>
      )}
    </Section>
  );
}
