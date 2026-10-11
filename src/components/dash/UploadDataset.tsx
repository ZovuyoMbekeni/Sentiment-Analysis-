import { useState } from "react";
import Papa from "papaparse";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { classifyTexts } from "@/lib/sentiment.functions";
import { cleanText, parseDate, type ResultRow } from "@/lib/analysis";
import { useResults } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, Section } from "./shared";

const MAX_ROWS = 1000;
const BATCH = 25;
const NONE = "__none__";

export function UploadDataset({ onDone }: { onDone: () => void }) {
  const classify = useServerFn(classifyTexts);
  const { addRows } = useResults();
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [textCol, setTextCol] = useState("");
  const [dateCol, setDateCol] = useState(NONE);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  function onFile(f: File | undefined) {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) { toast.error("Invalid file format. Please upload a .csv file."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("File is too large (max 10 MB)."); return; }
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const fields = (res.meta.fields ?? []).filter(Boolean);
        if (!fields.length || !res.data.length) {
          toast.error("The CSV is empty or has no header row.");
          return;
        }
        setFileName(f.name);
        setData(res.data);
        setCols(fields);
        const guessText = fields.find((c) => /text|review|comment|feedback|content|message|tweet/i.test(c)) ?? fields[0];
        const guessDate = fields.find((c) => /date|time|created/i.test(c));
        setTextCol(guessText ?? "");
        setDateCol(guessDate ?? NONE);
        if (res.data.length > MAX_ROWS) toast.warning(`Large dataset: only the first ${MAX_ROWS} rows will be analysed.`);
      },
      error: () => toast.error("Could not read this CSV file."),
    });
  }

  async function analyse() {
    if (!textCol) { toast.error("Select the column that contains the text."); return; }
    const prepared = data
      .slice(0, MAX_ROWS)
      .map((r) => ({ original: r[textCol] ?? "", cleaned: cleanText(r[textCol]).slice(0, 4000), date: dateCol !== NONE ? parseDate(r[dateCol]) : null }))
      .filter((r) => r.cleaned.length > 0);
    const skipped = Math.min(data.length, MAX_ROWS) - prepared.length;
    if (!prepared.length) { toast.error(`Column "${textCol}" contains no text.`); return; }
    setProgress({ done: 0, total: prepared.length });
    const out: ResultRow[] = [];
    try {
      for (let i = 0; i < prepared.length; i += BATCH) {
        const chunk = prepared.slice(i, i + BATCH);
        const res = await classify({ data: { texts: chunk.map((c) => c.cleaned) } });
        res.forEach((r, j) => out.push({ id: crypto.randomUUID(), ...chunk[j]!, ...r, source: "csv" }));
        setProgress({ done: out.length, total: prepared.length });
      }
      addRows(out);
      toast.success(`Analysed ${out.length} rows${skipped ? ` (${skipped} empty rows skipped)` : ""}.`);
      setData([]); setCols([]); setFileName("");
      onDone();
    } catch (e) {
      if (out.length) addRows(out);
      toast.error(`${e instanceof Error ? e.message : "Analysis failed."}${out.length ? ` ${out.length} rows were saved before the error.` : ""}`);
    } finally {
      setProgress(null);
    }
  }

  const dated = dateCol !== NONE ? data.slice(0, 50).filter((r) => parseDate(r[dateCol])).length : 0;

  return (
    <Section title="Upload Dataset" step="Step 1 · Collect Data" subtitle={`Upload a CSV with a header row. Choose the text column (and an optional date column). Up to ${MAX_ROWS} rows are analysed in batches of ${BATCH}.`}>
      <Panel className="space-y-5">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/50">
          <Upload className="size-6 text-primary" />
          <span className="text-sm font-medium">{fileName || "Choose a CSV file"}</span>
          <span className="text-xs text-muted-foreground">{fileName ? `${data.length} rows · ${cols.length} columns` : "Click to browse"}</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {cols.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Text column</p>
                <Select value={textCol} onValueChange={setTextCol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{cols.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Date column (optional)</p>
                <Select value={dateCol} onValueChange={setDateCol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No date column</SelectItem>
                    {cols.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {dateCol !== NONE && <p className="text-xs text-muted-foreground">{dated}/{Math.min(50, data.length)} sampled values are valid dates.</p>}
              </div>
            </div>
            <div className="overflow-x-auto rounded border">
              <p className="border-b bg-muted px-3 py-1.5 text-xs font-medium">Preview (first 3 rows of “{textCol}”)</p>
              {data.slice(0, 3).map((r, i) => <p key={i} className="truncate px-3 py-1.5 text-sm">{r[textCol] || <em className="text-muted-foreground">empty</em>}</p>)}
            </div>
            {progress ? (
              <div className="space-y-2">
                <Progress value={(progress.done / progress.total) * 100} />
                <p className="text-xs text-muted-foreground">Classifying {progress.done} / {progress.total}…</p>
              </div>
            ) : (
              <Button onClick={analyse}>Analyse {Math.min(data.length, MAX_ROWS)} rows</Button>
            )}
          </>
        )}
        {progress && cols.length === 0 && <Loader2 className="animate-spin" />}
      </Panel>
    </Section>
  );
}
