import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ResultRow } from "./analysis";

interface Ctx {
  rows: ResultRow[];
  addRows: (r: ResultRow[]) => void;
  clear: () => void;
  insights: string | null;
  setInsights: (s: string | null) => void;
}
const C = createContext<Ctx | null>(null);
const KEY = "sentiment-results-v1";

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [insights, setInsights] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setRows(JSON.parse(v));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(rows));
  }, [rows, loaded]);
  return (
    <C.Provider
      value={{
        rows,
        addRows: (r) => {
          setRows((p) => [...p, ...r]);
          setInsights(null);
        },
        clear: () => {
          setRows([]);
          setInsights(null);
        },
        insights,
        setInsights,
      }}
    >
      {children}
    </C.Provider>
  );
}
export function useResults() {
  const c = useContext(C);
  if (!c) throw new Error("useResults outside provider");
  return c;
}
