import { useResults } from "@/lib/store";
import { computeStats } from "@/lib/analysis";
import { EmptyState, Panel, Section } from "./shared";
import { cn } from "@/lib/utils";

const PIPE = ["Collect Data", "Clean Data", "Analyse Text", "Classify Sentiment", "Calculate Results", "Visualise Data", "Generate Insights"];

export function Dashboard() {
  const { rows } = useResults();
  const s = computeStats(rows);
  const cards = [
    { k: "Total analysed", v: s.total, sub: rows.length ? `avg. confidence ${(s.avgConfidence * 100).toFixed(0)}%` : "", c: "text-foreground" },
    { k: "Positive", v: s.positive, sub: `${s.pctPositive}%`, c: "text-positive" },
    { k: "Negative", v: s.negative, sub: `${s.pctNegative}%`, c: "text-negative" },
    { k: "Neutral", v: s.neutral, sub: `${s.pctNeutral}%`, c: "text-neutral" },
  ];
  return (
    <Section title="Sentiment Analysis Dashboard" subtitle="Live statistics calculated from every text you analyse in this session.">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {PIPE.map((p, i) => (
          <span key={p} className="flex items-center gap-1.5">
            <span className="rounded border bg-card px-2 py-1 font-mono">{i + 1}. {p}</span>
            {i < PIPE.length - 1 && <span className="text-muted-foreground">→</span>}
          </span>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <Panel key={c.k}>
                <p className="text-sm text-muted-foreground">{c.k}</p>
                <p className={cn("mt-2 font-mono text-4xl font-medium", c.c)}>{c.v}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>
              </Panel>
            ))}
          </div>
          <Panel>
            <p className="mb-3 text-sm font-medium">Sentiment split</p>
            <div className="flex h-4 overflow-hidden rounded-full bg-muted">
              <div className="bg-positive" style={{ width: `${s.pctPositive}%` }} />
              <div className="bg-neutral" style={{ width: `${s.pctNeutral}%` }} />
              <div className="bg-negative" style={{ width: `${s.pctNegative}%` }} />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>Positive {s.pctPositive}%</span><span>Neutral {s.pctNeutral}%</span><span>Negative {s.pctNegative}%</span>
            </div>
          </Panel>
        </>
      )}
    </Section>
  );
}
