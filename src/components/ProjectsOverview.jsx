import React, { useMemo, memo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Cell,
} from "recharts";
import { pctComplete } from "../utils/time";

function ProjectsOverview({ projects, onSelect }) {
  const data = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        name: p.name.length > 20 ? p.name.slice(0, 17) + "…" : p.name,
        percent: pctComplete(p),
      })),
    [projects]
  );

  // Define some simple colors
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (!projects.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="p-4 font-medium">Projects Overview — % Complete</div>
      <div className="h-72 px-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 16, left: 8, bottom: 24 }}
            isAnimationActive={false} // prevent re-animation on parent re-render
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                const { id } = e.activePayload[0].payload;
                onSelect?.(id);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-20}
              dy={18}
              tickMargin={8}
            />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v) => [`${v}%`, "% complete"]}
              labelFormatter={(label) => `Project: ${label}`}
            />
            <Bar dataKey="percent" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              <LabelList
                dataKey="percent"
                position="top"
                formatter={(v) => `${v}%`}
                isAnimationActive={false}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs px-1 text-zinc-500 dark:text-zinc-400">
          Tip: tap/click a bar to jump to that project.
        </p>
      </div>
    </div>
  );
}

// memoize to avoid rerender unless props change
export default memo(ProjectsOverview);
