import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useResults } from "@/lib/store";
import { computeStats, timeSeries } from "@/lib/analysis";
import { EmptyState, Panel, Section } from "./shared";

const COL = { Positive: "var(--positive)", Negative: "var(--negative)", Neutral: "var(--neutral)" };

export function Visualisations() {
  const { rows } = useResults();
  const s = computeStats(rows);
  const dist = [
    { name: "Positive", value: s.positive },
    { name: "Negative", value: s.negative },
    { name: "Neutral", value: s.neutral },
  ] as const;
  const ts = timeSeries(rows.filter((r) => r.source === "csv"));
  return (
    <Section title="Visualisations" step="Step 6 · Visualise Data" subtitle="Charts are drawn directly from the analysed results.">
      {rows.length === 0 ? <EmptyState /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <p className="mb-2 text-sm font-medium">Sentiment distribution</p>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={dist.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {dist.filter((d) => d.value > 0).map((d) => <Cell key={d.name} fill={COL[d.name]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel>
            <p className="mb-2 text-sm font-medium">Sentiment comparison (count)</p>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={[...dist]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{dist.map((d) => <Cell key={d.name} fill={COL[d.name]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel className="lg:col-span-2">
            <p className="mb-2 text-sm font-medium">Sentiment over time</p>
            {ts.length < 2 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">A date column is required for time-based analysis. Upload a CSV and select a date column with at least two distinct dates.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={ts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip /><Legend />
                    {(["Positive", "Negative", "Neutral"] as const).map((k) => <Line key={k} type="monotone" dataKey={k} stroke={COL[k]} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>
      )}
    </Section>
  );
}
