import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TaskSection from "./components/TaskSection";
import ProjectInfo from "./components/ProjectInfo";
import Metrics from "./components/Metrics";

import { saveData, loadData } from "./utils/storage";
import { TEMPLATES } from "./utils/templates";
import { v4 as uuidv4 } from "uuid";
import { useTheme } from "./hooks/useTheme";
import { calculateMetrics } from "./utils/metrics";
import { filterTasks, getAllTags } from "./utils/filterTasks";

export default function App() {
  const [projects, setProjects] = useState(loadData());
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? null);

  const [newProject, setNewProject] = useState("");
  const [newProjectTemplate, setNewProjectTemplate] = useState("vessel");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDueLocal, setNewTaskDueLocal] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [theme, setTheme] = useTheme();

  const [justCreated, setJustCreated] = useState(false);
  const taskSectionRef = useRef(null);
  const newTaskInputRef = useRef(null);

  useEffect(() => { saveData(projects); }, [projects]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  useEffect(() => {
    if (justCreated && selected && taskSectionRef.current) {
      taskSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => newTaskInputRef.current?.focus(), 100);
      setJustCreated(false);
    }
  }, [justCreated, selected]);

  // Timer for live updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Metrics and trends
  const metrics = useMemo(() => calculateMetrics(selected), [selected]);
  const completionTrend = useMemo(() => {
    if (!selected) return [];
    const events = selected.tasks
      .filter((t) => t.completedAt)
      .map((t) => ({ date: t.completedAt }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const points = [];
    let cum = 0;
    for (const e of events) { cum += 1; points.push({ date: e.date, done: cum }); }
    return points;
  }, [selected]);
  const durationSeries = useMemo(() => {
    if (!selected) return [];
    return selected.tasks
      .filter((t) => t.status === "done")
      .map((t, idx) => ({ name: `${idx + 1}. ${t.title}`, ms: t.elapsedMs }));
  }, [selected]);
  const allTags = useMemo(() => getAllTags(selected), [selected]);
  const filteredTasks = useMemo(
    () => filterTasks(selected, statusFilter, tagFilter, searchQuery),
    [selected, statusFilter, tagFilter, searchQuery]
  );

  // Project and task actions
  const addProject = (name) => {
    const template = TEMPLATES.find((t) => t.id === newProjectTemplate) || TEMPLATES[0];
    const defaultTasks = (template.tasks || []).map((title) => ({
      id: uuidv4(), title, description: "", status: "todo", createdAt: new Date().toISOString(),
      activeStart: null, elapsedMs: 0, completedAt: null, dueAt: null, tags: [],
    }));
    const p = { id: uuidv4(), name, createdAt: new Date().toISOString(), tasks: defaultTasks };
    setProjects((prev) => [p, ...prev]); setSelectedId(p.id); setJustCreated(true);
  };

  const deleteProject = (id) => { setProjects((prev) => prev.filter((p) => p.id !== id)); if (selectedId === id) setSelectedId(null); };

  const addTask = (title, description) => {
    if (!selected) return;
    const tags = newTaskTags.split(",").map((s) => s.trim()).filter(Boolean);
    const t = { id: uuidv4(), title, description, status: "todo", createdAt: new Date().toISOString(), activeStart: null, elapsedMs: 0, completedAt: null, dueAt: newTaskDueLocal ? new Date(newTaskDueLocal).toISOString() : null, tags };
    setProjects((prev) => prev.map((p) => (p.id === selected.id ? { ...p, tasks: [t, ...p.tasks] } : p)));
  };

  const updateTask = (taskId, patch) => {
    if (!selected) return;
    setProjects((prev) => prev.map((p) => (p.id === selected.id ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) } : p)));
  };

  const removeTask = (taskId) => {
    if (!selected) return;
    setProjects((prev) => prev.map((p) => (p.id === selected.id ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p)));
  };

  const startTask = (taskId) => {
    const task = selected?.tasks.find((x) => x.id === taskId);
    if (!task || task.status === "done" || task.activeStart) return;
    updateTask(taskId, { status: "in_progress", activeStart: new Date().toISOString() });
  };

  const pauseTask = (taskId) => {
    const task = selected?.tasks.find((x) => x.id === taskId);
    if (!task || !task.activeStart) return;
    const inc = new Date().getTime() - new Date(task.activeStart).getTime();
    updateTask(taskId, { status: "todo", activeStart: null, elapsedMs: (task.elapsedMs || 0) + Math.max(0, inc) });
  };

  const completeTask = (taskId) => {
    const task = selected?.tasks.find((x) => x.id === taskId);
    if (!task) return;
    let inc = 0;
    if (task.activeStart) { inc = new Date().getTime() - new Date(task.activeStart).getTime(); }
    updateTask(taskId, { status: "done", activeStart: null, elapsedMs: (task.elapsedMs || 0) + Math.max(0, inc), completedAt: new Date().toISOString() });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-900 dark:text-zinc-100">
      <Header projects={projects} setProjects={setProjects} setSelectedId={setSelectedId} theme={theme} setTheme={setTheme} />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <Sidebar projects={projects} selectedId={selectedId} setSelectedId={setSelectedId} addProject={addProject} deleteProject={deleteProject} newProject={newProject} setNewProject={setNewProject} newProjectTemplate={newProjectTemplate} setNewProjectTemplate={setNewProjectTemplate} />
        <section className="lg:col-span-8 xl:col-span-9 space-y-6">
          {!selected ? (
            <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
              <div className="p-4 font-medium">Select or create a project</div>
              <div className="p-4 text-sm text-gray-600 dark:text-zinc-400">Pick a project on the left or add a new one to start tracking tasks.</div>
            </div>
          ) : (
            <>
              <TaskSection
                selected={selected} filteredTasks={filteredTasks} allTags={allTags}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                tagFilter={tagFilter} setTagFilter={setTagFilter}
                newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle}
                newTaskDesc={newTaskDesc} setNewTaskDesc={setNewTaskDesc}
                newTaskDueLocal={newTaskDueLocal} setNewTaskDueLocal={setNewTaskDueLocal}
                newTaskTags={newTaskTags} setNewTaskTags={setNewTaskTags}
                addTask={addTask} startTask={startTask} pauseTask={pauseTask} completeTask={completeTask}
                removeTask={removeTask} updateTask={updateTask}
                taskSectionRef={taskSectionRef} newTaskInputRef={newTaskInputRef}
              />
              <ProjectInfo selected={selected} />
              <Metrics metrics={metrics} durationSeries={durationSeries} completionTrend={completionTrend} />
            </>
          )}
        </section>
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-xs text-gray-500 dark:text-zinc-400">
        Split-component version. Data saves to localStorage.
      </footer>
    </div>
  );
}