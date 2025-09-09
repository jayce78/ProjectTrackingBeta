import * as XLSX from "xlsx";
import { formatDuration, median, pctComplete, durationFromTask } from "./time";

export function exportExcel(projects) {
  const projectsRows = projects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    createdAt: p.createdAt,
    taskCount: p.tasks.length,
    doneCount: p.tasks.filter((t) => t.status === "done").length,
    percentComplete: pctComplete(p),
  }));
  const wsProjects = XLSX.utils.json_to_sheet(projectsRows);

  const tasksRows = [];
  projects.forEach((p) => {
    p.tasks.forEach((t, idx) => {
      const ms = durationFromTask(t);
      tasksRows.push({
        projectId: p.id,
        projectName: p.name,
        taskIndex: idx + 1,
        taskId: t.id,
        title: t.title,
        description: t.description || "",
        status: t.status,
        createdAt: t.createdAt || "",
        activeStart: t.activeStart || "",
        elapsedMs: t.elapsedMs || 0,
        completedAt: t.completedAt || "",
        dueAt: t.dueAt || "",
        tags: Array.isArray(t.tags) ? t.tags.join(", ") : (t.tags || ""),
        durationMs: typeof ms === "number" ? ms : "",
        durationReadable: typeof ms === "number" ? formatDuration(ms) : "",
      });
    });
  });
  const wsTasks = XLSX.utils.json_to_sheet(tasksRows);

  const metricsRows = projects.map((p) => {
    const done = p.tasks.filter((t) => t.status === "done");
    const durations = done.map((t) => durationFromTask(t));
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const med = median(durations);

    const ordered = done
      .filter((t) => t.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
    const gaps = [];
    for (let i = 1; i < ordered.length; i++) {
      gaps.push(new Date(ordered[i].completedAt) - new Date(ordered[i - 1].completedAt));
    }
    const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

    return {
      projectId: p.id,
      projectName: p.name,
      taskCount: p.tasks.length,
      completedCount: done.length,
      percentComplete: pctComplete(p),
      avgDurationMs: Math.round(avg),
      medianDurationMs: Math.round(med),
      avgGapMs: Math.round(avgGap),
    };
  });
  const wsMetrics = XLSX.utils.json_to_sheet(metricsRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsProjects, "Projects");
  XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");
  XLSX.utils.book_append_sheet(wb, wsMetrics, "Metrics");

  const filename = `project-tracker-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
