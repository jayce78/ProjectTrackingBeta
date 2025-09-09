import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Plus, Clock, Play, Pause, CheckCircle2, Trash2, Calendar, BarChart2, Search, Tag as TagIcon,
} from "lucide-react";
import { formatDuration, durationFromTask, cls } from "../utils/time";

export default function TaskSection({
  selected, filteredTasks, allTags, statusFilter, setStatusFilter, searchQuery, setSearchQuery,
  tagFilter, setTagFilter, newTaskTitle, setNewTaskTitle, newTaskDesc, setNewTaskDesc,
  newTaskDueLocal, setNewTaskDueLocal, newTaskTags, setNewTaskTags,
  addTask, startTask, pauseTask, completeTask, removeTask, updateTask,
  taskSectionRef, newTaskInputRef,
}) {
  return (
    <div ref={taskSectionRef} className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="p-4 font-medium">Tasks — {selected.name}</div>

      <div className="px-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {["all", "todo", "in_progress", "done"].map((s) => (
              <button
                key={s}
                className={cls(
                  "rounded-full px-3 py-1 text-xs border dark:border-zinc-700",
                  statusFilter === s ? "bg-indigo-600 text-white" : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                )}
                onClick={() => setStatusFilter(s)}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="pl-8 pr-3 py-1.5 rounded-md border text-sm dark:bg-zinc-900 dark:border-zinc-700"
              placeholder="Search title/desc/tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <TagIcon className="h-4 w-4 opacity-60" />
            <button
              className={cls(
                "rounded-full px-2 py-0.5 text-xs border dark:border-zinc-700",
                !tagFilter ? "bg-indigo-600 text-white" : "hover:bg-gray-50 dark:hover:bg-zinc-800"
              )}
              onClick={() => setTagFilter(null)}
            >
              all tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={cls(
                  "rounded-full px-2 py-0.5 text-xs border dark:border-zinc-700",
                  tagFilter === tag ? "bg-indigo-600 text-white" : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                )}
                onClick={() => setTagFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              ref={newTaskInputRef}
              className="rounded-lg border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <input
              className="rounded-lg border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700"
              placeholder="Tags (comma separated)"
              value={newTaskTags}
              onChange={(e) => setNewTaskTags(e.target.value)}
            />
            <textarea
              className="md:col-span-2 rounded-lg border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700"
              placeholder="Optional description"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-70">Due</label>
              <input
                type="datetime-local"
                className="rounded-lg border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700"
                value={newTaskDueLocal}
                onChange={(e) => setNewTaskDueLocal(e.target.value)}
              />
            </div>
            <div className="flex items-start md:justify-end">
              <button
                className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                onClick={() => {
                  if (!newTaskTitle.trim()) return;
                  addTask(newTaskTitle.trim(), newTaskDesc.trim() || undefined);
                  setNewTaskTitle("");
                  setNewTaskDesc("");
                  setNewTaskDueLocal("");
                  setNewTaskTags("");
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredTasks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-zinc-400">No tasks match.</p>
            )}
            <AnimatePresence>
              {filteredTasks.map((t) => {
                const overdue = t.dueAt && t.status !== "done" && new Date(t.dueAt) < new Date();
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cls(
                      "rounded-xl border bg-white p-3 dark:bg-zinc-900 dark:border-zinc-800",
                      overdue ? "border-red-300 dark:border-red-800" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium break-words">{t.title}</div>
                        {t.description && (
                          <div className="text-sm text-gray-600 dark:text-zinc-400 break-words">
                            {t.description}
                          </div>
                        )}

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-zinc-800">
                            <Clock className="h-3 w-3" /> Created {format(parseISO(t.createdAt), "PP p")}
                          </span>

                          {t.activeStart && t.status === "in_progress" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                              <Play className="h-3 w-3" /> Running {formatDuration(durationFromTask(t))}
                            </span>
                          )}

                          {t.completedAt && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-green-700 dark:bg-green-950 dark:text-green-200">
                              <CheckCircle2 className="h-3 w-3" /> Done {format(parseISO(t.completedAt), "PP p")}
                            </span>
                          )}

                          {t.status === "done" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-purple-700 dark:bg-purple-950 dark:text-purple-200">
                              <BarChart2 className="h-3 w-3" /> Duration {formatDuration(durationFromTask(t))}
                            </span>
                          )}

                          {(Array.isArray(t.tags) ? t.tags : (t.tags || "").split(","))
                            .map((x) => String(x).trim())
                            .filter(Boolean)
                            .map((tag) => (
                              <span key={t.id + tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-zinc-800">
                                <TagIcon className="h-3 w-3" /> {tag}
                              </span>
                            ))}

                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-zinc-800">
                            <Calendar className="h-3 w-3" />
                            <input
                              type="datetime-local"
                              className="bg-transparent outline-none"
                              value={t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 16) : ""}
                              onChange={(e) => updateTask(t.id, { dueAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                            />
                          </span>

                          {overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700 dark:bg-red-950 dark:text-red-200">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {t.status !== "in_progress" && t.status !== "done" && (
                          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700" onClick={() => startTask(t.id)}>
                            <span className="inline-flex items-center gap-1"><Play className="h-4 w-4" /> Start</span>
                          </button>
                        )}
                        {t.status === "in_progress" && (
                          <>
                            <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700" onClick={() => pauseTask(t.id)}>
                              <span className="inline-flex items-center gap-1"><Pause className="h-4 w-4" /> Pause</span>
                            </button>
                            <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700" onClick={() => completeTask(t.id)}>
                              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Complete</span>
                            </button>
                          </>
                        )}
                        {t.status !== "done" && t.status !== "in_progress" && (
                          <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700" onClick={() => completeTask(t.id)}>
                            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Mark Done</span>
                          </button>
                        )}
                        <button className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30" onClick={() => removeTask(t.id)}>
                          <span className="inline-flex items-center gap-1"><Trash2 className="h-4 w-4" /> Delete</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
