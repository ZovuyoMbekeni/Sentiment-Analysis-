import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity } from "lucide-react";
import { ResultsProvider, useResults } from "@/lib/store";
import { Dashboard } from "@/components/dash/Dashboard";
import { AnalyseText } from "@/components/dash/AnalyseText";
import { UploadDataset } from "@/components/dash/UploadDataset";
import { Results } from "@/components/dash/Results";
import { Visualisations } from "@/components/dash/Visualisations";
import { Insights } from "@/components/dash/Insights";
import { About } from "@/components/dash/About";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentiment Analysis Dashboard — AI for Data Analysis" },
      { name: "description", content: "Classify text and CSV datasets as positive, negative or neutral, visualise results and generate AI insights." },
      { property: "og:title", content: "Sentiment Analysis Dashboard" },
      { property: "og:description", content: "Analyse real text data with AI: classification, charts and insights." },
    ],
  }),
  component: () => (
    <ResultsProvider>
      <App />
    </ResultsProvider>
  ),
});

const TABS = ["Dashboard", "Analyse Text", "Upload Dataset", "Results", "Visualisations", "Insights", "About"] as const;
type Tab = (typeof TABS)[number];

function App() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const { rows } = useResults();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Activity className="size-5 text-primary" /> Sentiment Analysis Dashboard
            <span className="ml-2 rounded bg-muted px-2 py-0.5 font-mono text-xs font-normal text-muted-foreground">{rows.length} analysed</span>
          </div>
          <nav className="-mx-1 flex gap-1 overflow-x-auto" aria-label="Main">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} aria-current={tab === t ? "page" : undefined}
                className={cn("whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === "Dashboard" && <Dashboard />}
        {tab === "Analyse Text" && <AnalyseText />}
        {tab === "Upload Dataset" && <UploadDataset onDone={() => setTab("Results")} />}
        {tab === "Results" && <Results />}
        {tab === "Visualisations" && <Visualisations />}
        {tab === "Insights" && <Insights />}
        {tab === "About" && <About />}
      </main>
    </div>
  );
}
