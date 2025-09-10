import { durationFromTask, median, pctComplete } from "./time";

export function calculateMetrics(selected) {
  if (!selected) return null;
  const doneTasks = selected.tasks.filter((t) => t.status === "done");
  const durations = doneTasks.map((t) => durationFromTask(t));
  const ordered = doneTasks
    .filter((t) => t.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const gaps = [];
  for (let i = 1; i < ordered.length; i++) {
    gaps.push(new Date(ordered[i].completedAt) - new Date(ordered[i - 1].completedAt));
  }
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const med = median(durations);
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  return { count: selected.tasks.length, completed: doneTasks.length, percent: pctComplete(selected), avgDuration: avg, medianDuration: med, avgGap };
}