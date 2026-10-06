import { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { useResults } from "@/lib/store";
import { toCsv } from "@/lib/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Panel, Section, SentimentBadge } from "./shared";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Positive", "Negative", "Neutral"] as const;
const PAGE = 15;

export function Results() {
  const { rows, clear } = useResults();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => rows.filter((r) => (filter === "All" || r.label === filter) && r.original.toLowerCase().includes(q.toLowerCase())),
    [rows, filter, q],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const view = filtered.slice(cur * PAGE, cur * PAGE + PAGE);

  function exportCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sentiment-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Section
      title="Results"
      step="Step 5 · Calculate Results"
      subtitle="Every analysed text with its predicted sentiment and model confidence."
      actions={rows.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>
          <Button variant="ghost" onClick={() => confirm("Clear all results?") && clear()}><Trash2 /> Clear</Button>
        </div>
      )}
    >
      {rows.length === 0 ? <EmptyState /> : (
        <Panel className="space-y-4 p-0">
          <div className="flex flex-wrap items-center gap-3 border-b p-4">
            <div className="flex gap-1 rounded-md bg-muted p-1">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => { setFilter(f); setPage(0); }} className={cn("rounded px-3 py-1 text-sm", filter === f ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}>
                  {f}
                </button>
              ))}
            </div>
            <Input className="max-w-xs" placeholder="Search text…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} of {rows.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-2">Original text</th><th className="px-4 py-2">Sentiment</th><th className="px-4 py-2">Confidence</th><th className="hidden px-4 py-2 md:table-cell">Date</th></tr>
              </thead>
              <tbody>
                {view.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="max-w-xl px-4 py-3" title={r.explanation}>{r.original}</td>
                    <td className="px-4 py-3"><SentimentBadge label={r.label} /></td>
                    <td className="px-4 py-3 font-mono">{(r.confidence * 100).toFixed(0)}%</td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">{r.date ?? "—"}</td>
                  </tr>
                ))}
                {view.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No rows match.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2 border-t p-3">
            <Button size="sm" variant="outline" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</Button>
            <span className="text-xs">Page {cur + 1} / {pages}</span>
            <Button size="sm" variant="outline" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</Button>
          </div>
        </Panel>
      )}
    </Section>
  );
}
