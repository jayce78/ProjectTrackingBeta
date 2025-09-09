import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
import { Percent, Clock, BarChart2, Calendar } from "lucide-react";
import { formatDuration } from "../utils/time";

export default function Metrics({ metrics, durationSeries, completionTrend }) {
  if (!metrics) return null;
  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <div className="p-4 font-medium flex items-center gap-2"><Percent className="h-4 w-4" /> Progress — {metrics.percent}%</div>
          <div className="p-4">
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-zinc-800"><div className="h-3 rounded-full bg-indigo-600" style={{ width: `${metrics.percent || 0}%` }} /></div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <div><div className="text-xs uppercase opacity-60">Tasks</div><div className="font-medium">{metrics.completed}/{metrics.count}</div></div>
              <div><div className="text-xs uppercase opacity-60">Avg Duration</div><div className="font-medium">{formatDuration(metrics.avgDuration)}</div></div>
              <div><div className="text-xs uppercase opacity-60">Median Duration</div><div className="font-medium">{formatDuration(metrics.medianDuration)}</div></div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <div className="p-4 font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Avg Gap Between Completions</div>
          <div className="p-4"><div className="text-2xl font-semibold">{formatDuration(metrics.avgGap)}</div><p className="mt-1 text-xs opacity-70">Based on consecutive task completions.</p></div>
        </div>
      </div>
      <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-4 font-medium flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Task Durations (Completed)</div>
        <div className="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={durationSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" />
              <XAxis ... stroke="var(--axis-text)" />
              <YAxis ... stroke="var(--axis-text)" />
              <Bar dataKey="ms" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-4 font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> Completion Trend</div>
        <div className="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" />
              <XAxis ... stroke="var(--axis-text)" />
              <YAxis ... stroke="var(--axis-text)" />
              <Line type="monotone" dataKey="done" dot={false} stroke="var(--chart-2)" strokeWidth={2} />

            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
