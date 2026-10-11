import type { ReactNode } from "react";
import type { Label } from "@/lib/sentiment.functions";
import { cn } from "@/lib/utils";

export const labelStyles: Record<Label, string> = {
  Positive: "bg-positive-soft text-positive border-positive/30",
  Negative: "bg-negative-soft text-negative border-negative/30",
  Neutral: "bg-neutral-soft text-neutral border-neutral/30",
};

export function SentimentBadge({ label }: { label: Label }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", labelStyles[label])}>
      <span className="size-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {label}
    </span>
  );
}

export function Section({ title, subtitle, step, children, actions }: { title: string; subtitle?: string; step?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {step && <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">{step}</p>}
          <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card/80 p-5 shadow-glow backdrop-blur", className)}>{children}</div>;
}

export function EmptyState({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center text-sm text-muted-foreground">
      {children ?? "No sentiment data available yet. Upload a CSV dataset or analyse text to begin."}
    </div>
  );
}
