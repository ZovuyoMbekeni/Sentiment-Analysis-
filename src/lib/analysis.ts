import type { Label } from "./sentiment.functions";

export interface ResultRow {
  id: string;
  original: string;
  cleaned: string;
  label: Label;
  confidence: number;
  explanation: string;
  date: string | null; // ISO yyyy-mm-dd
  source: "text" | "csv";
}

/** Preprocess: strip control chars/URLs/HTML, collapse whitespace. Original is kept separately. */
export function cleanText(raw: unknown): string {
  if (raw == null) return "";
  return String(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(
  "a an the and or but if then so to of in on at for with from by is are was were be been being am i me my we our you your he she it its they them their this that these those there here not no very just really too also can could would should will do does did have has had as about into out up down over than more most much many some any all get got one two its it's i'm don't dont im ive i've product app".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

export function topTerms(rows: ResultRow[], n = 10): Array<{ term: string; count: number }> {
  const m = new Map<string, number>();
  for (const r of rows) for (const w of new Set(tokenize(r.cleaned))) m.set(w, (m.get(w) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term, count]) => ({ term, count }));
}

export interface Stats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  pctPositive: number;
  pctNegative: number;
  pctNeutral: number;
  avgConfidence: number;
}

export function computeStats(rows: ResultRow[]): Stats {
  const total = rows.length;
  const c = (l: Label) => rows.filter((r) => r.label === l).length;
  const positive = c("Positive");
  const negative = c("Negative");
  const neutral = c("Neutral");
  const pct = (x: number) => (total ? Math.round((x / total) * 1000) / 10 : 0);
  return {
    total,
    positive,
    negative,
    neutral,
    pctPositive: pct(positive),
    pctNegative: pct(negative),
    pctNeutral: pct(neutral),
    avgConfidence: total ? rows.reduce((s, r) => s + r.confidence, 0) / total : 0,
  };
}

export function parseDate(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  const d = new Date(String(v).trim());
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function timeSeries(rows: ResultRow[]) {
  const dated = rows.filter((r) => r.date);
  if (dated.length < 2) return [];
  const days = new Set(dated.map((r) => r.date!));
  const key = (d: string) => (days.size > 60 ? d.slice(0, 7) : d);
  const m = new Map<string, { period: string; Positive: number; Negative: number; Neutral: number }>();
  for (const r of dated) {
    const k = key(r.date!);
    const e = m.get(k) ?? { period: k, Positive: 0, Negative: 0, Neutral: 0 };
    e[r.label]++;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => a.period.localeCompare(b.period));
}

function esc(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: ResultRow[]): string {
  const head = "original_text,sentiment,confidence,explanation,date";
  const body = rows.map((r) =>
    [esc(r.original), r.label, r.confidence.toFixed(3), esc(r.explanation), r.date ?? ""].join(","),
  );
  return [head, ...body].join("\n");
}

/** Build a factual summary for the LLM interpretation step. */
export function buildSummary(rows: ResultRow[]): string {
  const s = computeStats(rows);
  const neg = rows.filter((r) => r.label === "Negative");
  const pos = rows.filter((r) => r.label === "Positive");
  const ts = timeSeries(rows);
  const sample = (a: ResultRow[]) =>
    a
      .slice(0, 15)
      .map((r) => `- ${r.cleaned.slice(0, 220)}`)
      .join("\n");
  return [
    `Total: ${s.total}. Positive ${s.positive} (${s.pctPositive}%), Negative ${s.negative} (${s.pctNegative}%), Neutral ${s.neutral} (${s.pctNeutral}%).`,
    `Top terms in negative texts: ${topTerms(neg, 12).map((t) => `${t.term}(${t.count})`).join(", ") || "none"}`,
    `Top terms in positive texts: ${topTerms(pos, 12).map((t) => `${t.term}(${t.count})`).join(", ") || "none"}`,
    ts.length ? `Counts over time: ${ts.map((t) => `${t.period}: +${t.Positive}/-${t.Negative}/=${t.Neutral}`).join("; ")}` : "No date information.",
    `Negative samples:\n${sample(neg) || "none"}`,
    `Positive samples:\n${sample(pos) || "none"}`,
  ].join("\n\n");
}
