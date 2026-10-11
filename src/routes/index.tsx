import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, LayoutDashboard, Sparkles, UploadCloud, Table2, PieChart, BrainCircuit, Info, Menu, X } from "lucide-react";
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

const NAV = [
  { t: "Dashboard", icon: LayoutDashboard },
  { t: "Analyse Text", icon: Sparkles },
  { t: "Upload Dataset", icon: UploadCloud },
  { t: "Results", icon: Table2 },
  { t: "Visualisations", icon: PieChart },
  { t: "Insights", icon: BrainCircuit },
  { t: "About", icon: Info },
] as const;
type Tab = (typeof NAV)[number]["t"];

function App() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [open, setOpen] = useState(false);
  const { rows } = useResults();
  const go = (t: Tab) => { setTab(t); setOpen(false); };
  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ t, icon: Icon }) => (
        <button key={t} onClick={() => go(t)} aria-current={tab === t ? "page" : undefined}
          className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            tab === t ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
          {tab === t && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />}
          <Icon className={cn("size-4", tab === t ? "text-primary" : "")} /> {t}
        </button>
      ))}
    </nav>
  );
  const brand = (
    <div className="flex items-center gap-2.5 px-2">
      <div className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
        <Activity className="size-4" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Sentiment</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Analytics</p>
      </div>
    </div>
  );
  const footer = (
    <div className="rounded-lg border bg-card/60 p-3">
      <p className="text-xs text-muted-foreground">Texts analysed</p>
      <p className="mt-1 font-mono text-2xl text-primary">{rows.length}</p>
    </div>
  );
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar/80 p-4 backdrop-blur md:flex">
        {brand}
        {nav}
        <div className="mt-auto">{footer}</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4">
            <div className="flex items-center justify-between">{brand}<button aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            {nav}
            <div className="mt-auto">{footer}</div>
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/70 px-4 py-3 backdrop-blur md:px-8">
          <button className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <p className="text-sm text-muted-foreground">Workspace <span className="mx-1.5">/</span><span className="text-foreground">{tab}</span></p>
          <span className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-positive shadow-[0_0_8px_var(--color-positive)]" /> Live session
          </span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {tab === "Dashboard" && <Dashboard />}
          {tab === "Analyse Text" && <AnalyseText />}
          {tab === "Upload Dataset" && <UploadDataset onDone={() => setTab("Results")} />}
          {tab === "Results" && <Results />}
          {tab === "Visualisations" && <Visualisations />}
          {tab === "Insights" && <Insights />}
          {tab === "About" && <About />}
        </main>
      </div>
    </div>
  );
}
