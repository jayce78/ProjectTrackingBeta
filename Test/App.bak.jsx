import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Upload,
  Download,
  Play,
  Pause,
  Percent,
  BarChart2,
  RefreshCcw,
} from "lucide-react";

/* =========================
   Predefined Tasks Template
   ========================= */
const DEFAULT_TASK_TITLES = [
  "IT Ready Check list Sent",
  "IT Ready Check list Received",
  "IP Address changed in Admin",
  "GA Requested and uploaded",
  "Vessel Image included",
  "Gateway PC Online",
  "Vessel Ready"
];

/* =========================
   Local Storage Helpers
   ========================= */
const STORAGE_KEY = "project-tracker:data:v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveData(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

// Build and download an Excel workbook with Projects, Tasks, and Metrics
function exportExcel(projects) {
  // ---- Sheet 1: Projects summary
  const projectsRows = projects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    createdAt: p.createdAt,
    taskCount: p.tasks.length,
    doneCount: p.tasks.filter((t) => t.status === "done").length,
    percentComplete: Math.round(
      (p.tasks.filter((t) => t.status === "done").length / Math.max(p.tasks.length || 1, 1)) * 100
    ),
  }));
  const wsProjects = XLSX.utils.json_to_sheet(projectsRows);

  // ---- Sheet 2: Tasks (one row per task)
  const tasksRows = [];
  projects.forEach((p) => {
    p.tasks.forEach((t, idx) => {
      const ms =
        (t.startedAt || t.createdAt) && t.completedAt
          ? new Date(t.completedAt) - new Date(t.startedAt || t.createdAt)
          : undefined;

      tasksRows.push({
        projectId: p.id,
        projectName: p.name,
        taskIndex: idx + 1,
        taskId: t.id,
        title: t.title,
        description: t.description || "",
        status: t.status,
        createdAt: t.createdAt || "",
        startedAt: t.startedAt || "",
        completedAt: t.completedAt || "",
        durationMs: typeof ms === "number" ? ms : "",
        durationReadable:
          typeof ms === "number"
            ? (() => {
                const s = Math.max(0, Math.floor(ms / 1000));
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                const sec = s % 60;
                return `${h ? h + "h " : ""}${m ? m + "m " : ""}${sec}s`.trim();
              })()
            : "",
      });
    });
  });
  const wsTasks = XLSX.utils.json_to_sheet(tasksRows);

  // ---- (Optional) Sheet 3: Metrics per project
  const metricsRows = projects.map((p) => {
    const done = p.tasks.filter((t) => t.status === "done");
    const durations = done
      .map((t) =>
        (t.startedAt || t.createdAt) && t.completedAt
          ? new Date(t.completedAt) - new Date(t.startedAt || t.createdAt)
          : undefined
      )
      .filter((x) => typeof x === "number");

    const avg =
      durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const sorted = [...durations].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length === 0 ? 0 : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // gaps between consecutive completions
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
      percentComplete: Math.round((done.length / Math.max(p.tasks.length || 1, 1)) * 100),
      avgDurationMs: Math.round(avg),
      medianDurationMs: Math.round(median),
      avgGapMs: Math.round(avgGap),
    };
  });
  const wsMetrics = XLSX.utils.json_to_sheet(metricsRows);

  // ---- Create workbook & save
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsProjects, "Projects");
  XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");
  XLSX.utils.book_append_sheet(wb, wsMetrics, "Metrics");

  const filename = `project-tracker-${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}


/* =========================
   Utilities
   ========================= */
const nowISO = () => new Date().toISOString();
const durationMs = (a, b) => (!a || !b ? undefined : new Date(b) - new Date(a));
const formatDuration = (ms) => {
  if (ms === undefined) return "—";
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
};
const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const pctComplete = (p) => {
  const total = p.tasks.length || 1;
  const done = p.tasks.filter((t) => t.status === "done").length;
  return Math.round((done / total) * 100);
};

/* =========================
   Main App
   ========================= */
export default function App() {
  const [projects, setProjects] = useState(loadData());
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? null);

  // UI local state
  const [newProject, setNewProject] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  // For focusing task input after creating a project
  const [justCreated, setJustCreated] = useState(false);
  const taskSectionRef = useRef(null);
  const newTaskInputRef = useRef(null);

  useEffect(() => {
    saveData(projects);
  }, [projects]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  // After creating project, scroll to tasks and focus input
  useEffect(() => {
    if (justCreated && selected && taskSectionRef.current) {
      taskSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => newTaskInputRef.current?.focus(), 100);
      setJustCreated(false);
    }
  }, [justCreated, selected]);

  /* -------- Derived Metrics -------- */
  const metrics = useMemo(() => {
    if (!selected) return null;
    const doneTasks = selected.tasks.filter((t) => t.status === "done");
    const durations = doneTasks
      .map((t) => durationMs(t.startedAt ?? t.createdAt, t.completedAt))
      .filter((d) => typeof d === "number" && !Number.isNaN(d));

    const ordered = [...doneTasks].sort(
      (a, b) =>
        new Date(a.completedAt || 0).getTime() -
        new Date(b.completedAt || 0).getTime()
    );
    const gaps = [];
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i - 1].completedAt && ordered[i].completedAt) {
        gaps.push(
          new Date(ordered[i].completedAt) -
            new Date(ordered[i - 1].completedAt)
        );
      }
    }
    const avg =
      durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      count: selected.tasks.length,
      completed: doneTasks.length,
      percent: pctComplete(selected),
      avgDuration: avg,
      medianDuration: median(durations),
      avgGap: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0,
    };
  }, [selected]);

  const completionTrend = useMemo(() => {
    if (!selected) return [];
    const events = selected.tasks
      .filter((t) => t.completedAt)
      .map((t) => ({ date: t.completedAt }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const points = [];
    let cum = 0;
    for (const e of events) {
      cum += 1;
      points.push({ date: e.date, done: cum });
    }
    return points;
  }, [selected]);

  const durationSeries = useMemo(() => {
    if (!selected) return [];
    return selected.tasks
      .filter((t) => t.status === "done")
      .map((t, idx) => ({
        name: `${idx + 1}. ${t.title}`,
        ms: durationMs(t.startedAt ?? t.createdAt, t.completedAt) || 0,
      }));
  }, [selected]);

  /* -------- Actions -------- */
  const addProject = (name) => {
    const defaultTasks = DEFAULT_TASK_TITLES.map((title) => ({
      id: uuidv4(),
      title,
      description: "",
      status: "todo",
      createdAt: nowISO(),
      // if you later add fields like dueAt/weight, initialize them here
    }));

    const p = { id: uuidv4(), name, createdAt: nowISO(), tasks: defaultTasks };
    setProjects((prev) => [p, ...prev]);
    setSelectedId(p.id);
    setJustCreated(true);
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addTask = (title, description) => {
    if (!selected) return;
    const t = {
      id: uuidv4(),
      title,
      description,
      status: "todo",
      createdAt: nowISO(),
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === selected.id ? { ...p, tasks: [t, ...p.tasks] } : p))
    );
  };

  const updateTask = (taskId, patch) => {
    if (!selected) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selected.id
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
          : p
      )
    );
  };

  const removeTask = (taskId) => {
    if (!selected) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selected.id ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      )
    );
  };

  const startTask = (taskId) =>
    updateTask(taskId, { status: "in_progress", startedAt: nowISO() });
  const pauseTask = (taskId) =>
    updateTask(taskId, { status: "todo" });
  const completeTask = (taskId) =>
    updateTask(taskId, { status: "done", completedAt: nowISO() });

  /* =========================
     Render
     ========================= */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Project Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                const blob = new Blob([JSON.stringify(projects, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `project-tracker-${new Date()
                  .toISOString()
                  .slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </span>
            </button>
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => exportExcel(projects)}
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" /> Export Excel
              </span>
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
              <Upload className="h-4 w-4" /> Import
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const data = JSON.parse(String(reader.result));
                      if (Array.isArray(data)) {
                        setProjects(data);
                        setSelectedId(data[0]?.id ?? null);
                      } else {
                        alert("Invalid JSON structure");
                      }
                    } catch {
                      alert("Invalid JSON file");
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
              onClick={() => {
                if (confirm("Clear all data? This cannot be undone.")) {
                  setProjects([]);
                  setSelectedId(null);
                  localStorage.removeItem(STORAGE_KEY);
                }
              }}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" /> Reset
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="mb-4 rounded-2xl border bg-white">
            <div className="border-b p-4 font-medium">New Project</div>
            <div className="space-y-3 p-4">
              <label className="text-sm text-gray-700">Name</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="e.g., Vessel Name"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
              />
              <button
                className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                onClick={() => newProject.trim() && (addProject(newProject.trim()), setNewProject(""))}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Project
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white">
            <div className="border-b p-4 font-medium">Projects</div>
            <div className="p-4 space-y-2">
              <AnimatePresence>
                {projects.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`rounded-xl border p-3 ${
                      selectedId === p.id ? "ring-2 ring-indigo-500" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button className="text-left" onClick={() => setSelectedId(p.id)}>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          Created {format(parseISO(p.createdAt), "PP p")}
                        </div>
                      </button>
                      <button
                        className="rounded p-2 text-red-500 hover:bg-red-50"
                        onClick={() => deleteProject(p.id)}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                        <span>{pctComplete(p)}%</span>
                        <span>
                          {p.tasks.filter((t) => t.status === "done").length}/{p.tasks.length} done
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-200">
                        <div
                          className="h-3 rounded-full bg-indigo-600"
                          style={{ width: `${pctComplete(p)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {projects.length === 0 && (
                <p className="text-sm text-gray-500">No projects yet. Create one above.</p>
              )}
            </div>
          </div>
        </aside>

        {/* Main area */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-6">
          {!selected ? (
            <div className="rounded-2xl border bg-white">
              <div className="p-4 font-medium">Select or create a project</div>
              <div className="p-4 text-sm text-gray-600">
                Pick a project on the left or add a new one to start tracking tasks.
              </div>
            </div>
          ) : (
            <>
              {/* ===== TASKS FIRST ===== */}
              <div ref={taskSectionRef} className="rounded-2xl border bg-white">
                <div className="p-4 font-medium">Tasks — {selected.name}</div>
                <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        ref={newTaskInputRef}
                        className="flex-1 rounded-lg border px-3 py-2"
                        placeholder="Task title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                      />
                      <button
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                        onClick={() => {
                          if (!newTaskTitle.trim()) return;
                          addTask(newTaskTitle.trim(), newTaskDesc.trim() || undefined);
                          setNewTaskTitle("");
                          setNewTaskDesc("");
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Plus className="h-4 w-4" /> Add
                        </span>
                      </button>
                    </div>
                    <textarea
                      className="w-full rounded-lg border px-3 py-2"
                      placeholder="Optional description"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                    />
                    <div className="space-y-2">
                      {selected.tasks.length === 0 && (
                        <p className="text-sm text-gray-500">No tasks yet.</p>
                      )}
                      <AnimatePresence>
                        {selected.tasks.map((t) => (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="rounded-xl border bg-white p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">{t.title}</div>
                                {t.description && (
                                  <div className="text-sm text-gray-600">{t.description}</div>
                                )}
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                                    <Clock className="h-3 w-3" /> Created{" "}
                                    {format(parseISO(t.createdAt), "PP p")}
                                  </span>
                                  {t.startedAt && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                                      <Play className="h-3 w-3" /> Started{" "}
                                      {format(parseISO(t.startedAt), "PP p")}
                                    </span>
                                  )}
                                  {t.completedAt && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-green-700">
                                      <CheckCircle2 className="h-3 w-3" /> Done{" "}
                                      {format(parseISO(t.completedAt), "PP p")}
                                    </span>
                                  )}
                                  {t.status === "done" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                                      <BarChart2 className="h-3 w-3" /> Duration{" "}
                                      {formatDuration(
                                        durationMs(t.startedAt ?? t.createdAt, t.completedAt)
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {t.status !== "in_progress" && t.status !== "done" && (
                                  <button
                                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                                    onClick={() => startTask(t.id)}
                                  >
                                    <span className="inline-flex items-center gap-1">
                                      <Play className="h-4 w-4" /> Start
                                    </span>
                                  </button>
                                )}
                                {t.status === "in_progress" && (
                                  <>
                                    <button
                                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                                      onClick={() => pauseTask(t.id)}
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        <Pause className="h-4 w-4" /> Pause
                                      </span>
                                    </button>
                                    <button
                                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                                      onClick={() => completeTask(t.id)}
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" /> Complete
                                      </span>
                                    </button>
                                  </>
                                )}
                                {t.status !== "done" && t.status !== "in_progress" && (
                                  <button
                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                                    onClick={() => completeTask(t.id)}
                                  >
                                    <span className="inline-flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4" /> Mark Done
                                    </span>
                                  </button>
                                )}
                                <button
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
                                  onClick={() => removeTask(t.id)}
                                >
                                  <span className="inline-flex items-center gap-1">
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Quick project meta */}
                  <div className="space-y-3">
                    <div className="rounded-2xl border p-4">
                      <div className="text-sm font-medium mb-2">Project Info</div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Created</span>
                          <span>{format(parseISO(selected.createdAt), "PP p")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Total Tasks</span>
                          <span>{selected.tasks.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Completed</span>
                          <span>{selected.tasks.filter((t) => t.status === "done").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Progress</span>
                          <span>{pctComplete(selected)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== METRICS & CHARTS AFTER TASKS ===== */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border bg-white">
                  <div className="p-4 font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4" /> Progress — {metrics?.percent}%
                  </div>
                  <div className="p-4">
                    <div className="h-3 w-full rounded-full bg-gray-200">
                      <div
                        className="h-3 rounded-full bg-indigo-600"
                        style={{ width: `${metrics?.percent || 0}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <div className="text-xs uppercase text-gray-500">Tasks</div>
                        <div className="font-medium">
                          {metrics?.completed}/{metrics?.count}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-gray-500">Avg Duration</div>
                        <div className="font-medium">{formatDuration(metrics?.avgDuration)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-gray-500">Median Duration</div>
                        <div className="font-medium">{formatDuration(metrics?.medianDuration)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white">
                  <div className="p-4 font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Avg Gap Between Completions
                  </div>
                  <div className="p-4">
                    <div className="text-2xl font-semibold">{formatDuration(metrics?.avgGap)}</div>
                    <p className="mt-1 text-xs text-gray-500">
                      Based on consecutive task completions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white">
                <div className="p-4 font-medium flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" /> Task Durations (Completed)
                </div>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={durationSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        hide={durationSeries.length > 8}
                        interval={0}
                        angle={-30}
                        dy={10}
                      />
                      <YAxis tickFormatter={(v) => `${Math.round(v / 60000)}m`} />
                      <Tooltip formatter={(v) => formatDuration(v)} />
                      <Bar dataKey="ms" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-white">
                <div className="p-4 font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Completion Trend
                </div>
                <div className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={completionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), "MM-dd")} />
                      <YAxis allowDecimals={false} />
                      <Tooltip labelFormatter={(d) => format(parseISO(String(d)), "PP p")} />
                      <Line type="monotone" dataKey="done" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-xs text-gray-500">
        Single-file demo. Data saves to localStorage.
      </footer>
    </div>
  );
}
