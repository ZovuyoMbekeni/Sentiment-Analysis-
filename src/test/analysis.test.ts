import { describe, it, expect } from "vitest";
import { computeStats, cleanText, timeSeries, type ResultRow } from "@/lib/analysis";

const row = (label: ResultRow["label"], date: string | null = null): ResultRow => ({
  id: Math.random().toString(),
  original: "x",
  cleaned: "x",
  label,
  confidence: 0.8,
  explanation: "",
  date,
  source: "csv",
});

describe("analysis", () => {
  it("computes counts and percentages from real rows", () => {
    const s = computeStats([row("Positive"), row("Positive"), row("Negative"), row("Neutral")]);
    expect(s).toMatchObject({ total: 4, positive: 2, negative: 1, neutral: 1, pctPositive: 50, pctNegative: 25 });
  });
  it("returns zeros with no data", () => {
    expect(computeStats([]).total).toBe(0);
    expect(computeStats([]).pctPositive).toBe(0);
  });
  it("cleans whitespace and urls but keeps words", () => {
    expect(cleanText("  Great   app <b>!</b> https://x.y ")).toBe("Great app !");
  });
  it("no time series without dates", () => {
    expect(timeSeries([row("Positive"), row("Negative")])).toEqual([]);
  });
});

import { cleanText as _clean } from "@/lib/analysis";
import { it as _it, expect as _expect } from "vitest";
_it("keeps emojis when cleaning text so they can be analysed", () => {
  _expect(_clean("Love it 😍👍 <b>x</b>")).toContain("😍👍");
});
