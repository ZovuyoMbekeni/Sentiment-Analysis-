import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { generateInsights } from "@/lib/sentiment.functions";
import { buildSummary, computeStats, timeSeries, topTerms } from "@/lib/analysis";
import { useResults } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, Section } from "./shared";

export function Insights() {
  const { rows, insights, setInsights } = useResults();
  const gen = useServerFn(generateInsights);
  const [busy, setBusy] = useState(false);
  if (!rows.length) return <Section title="AI-Generated Insights" step="Step 7 · Generate Insights"><EmptyState /></Section>;

  const s = computeStats(rows);
  const dominant = [["Positive", s.positive], ["Negative", s.negative], ["Neutral", s.neutral]].sort((a, b) => Number(b[1]) - Number(a[1]));
  const tie = dominant[0]![1] === dominant[1]![1];
  const neg = topTerms(rows.filter((r) => r.label === "Negative"), 8);
  const pos = topTerms(rows.filter((r) => r.label === "Positive"), 8);
  const ts = timeSeries(rows.filter((r) => r.source === "csv"));
  let trend: string | null = null;
  if (ts.length >= 2) {
    const share = (t: (typeof ts)[number]) => { const n = t.Positive + t.Negative + t.Neutral; return n ? (t.Positive / n) * 100 : 0; };
    const a = share(ts[0]!), b = share(ts[ts.length - 1]!);
    trend = `Positive share moved from ${a.toFixed(0)}% (${ts[0]!.period}) to ${b.toFixed(0)}% (${ts[ts.length - 1]!.period}).`;
  }

  async function run() {
    setBusy(true);
    try {
      const r = await gen({ data: { summary: buildSummary(rows) } });
      setInsights(r.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate insights.");
    } finally { setBusy(false); }
  }

  const Terms = ({ items, cls }: { items: { term: string; count: number }[]; cls: string }) =>
    items.length ? <div className="flex flex-wrap gap-1.5">{items.map((t) => <span key={t.term} className={`rounded border px-2 py-0.5 font-mono text-xs ${cls}`}>{t.term} · {t.count}</span>)}</div> : <p className="text-sm text-muted-foreground">Not enough texts.</p>;

  return (
    <Section title="AI-Generated Insights" step="Step 7 · Generate Insights" subtitle="Calculated statistics (left) are computed directly from the data. The AI interpretation (right) is written by a language model from those statistics.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Calculated statistics</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Dominant sentiment: <strong>{tie ? "No single dominant sentiment (tie)" : dominant[0][0]}</strong> across {s.total} texts.</li>
            <li>{s.pctPositive}% positive, {s.pctNegative}% negative, {s.pctNeutral}% neutral.</li>
            <li>Average model confidence: {(s.avgConfidence * 100).toFixed(0)}%.</li>
            {trend && <li>{trend}</li>}
          </ul>
          <div className="space-y-2"><p className="text-sm font-medium">Recurring words in negative texts</p><Terms items={neg} cls="bg-negative-soft text-negative border-negative/30" /></div>
          <div className="space-y-2"><p className="text-sm font-medium">Recurring words in positive texts</p><Terms items={pos} cls="bg-positive-soft text-positive border-positive/30" /></div>
        </Panel>
        <Panel className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">AI interpretation</p>
            <Button size="sm" onClick={run} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {insights ? "Regenerate" : "Generate insights"}</Button>
          </div>
          {insights ? (
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {insights.split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").replace(/\*\*/g, "").trim()).filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Click “Generate insights” to have the model interpret the current results.</p>}
        </Panel>
      </div>
    </Section>
  );
}
