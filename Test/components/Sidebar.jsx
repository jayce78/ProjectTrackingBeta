import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { pctComplete } from "../utils/time";
import { TEMPLATES } from "../utils/templates";
import { colorForId, withOpacity } from "../utils/colors";

export default function Sidebar({
  projects,
  selectedId,
  setSelectedId,
  addProject,
  deleteProject,
  newProject,
  setNewProject,
  newProjectTemplate,
  setNewProjectTemplate,
}) {
  return (
    <aside className="lg:col-span-4 xl:col-span-3">
      {/* New Project */}
      <div className="mb-4 rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="border-b p-4 font-medium dark:border-zinc-800">New Project</div>
        <div className="space-y-3 p-4">
          <label className="text-sm text-gray-700 dark:text-zinc-300">Name</label>
          <input
            className="w-full rounded-lg border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700"
            placeholder="Vessel Name/Project Number"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
          />

          <label className="text-sm text-gray-700 dark:text-zinc-300">Template</label>
          <select
            className="w-full rounded-lg border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700"
            value={newProjectTemplate}
            onChange={(e) => setNewProjectTemplate(e.target.value)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            onClick={() => newProject.trim() && (addProject(newProject.trim()), setNewProject(""))}
          >
            Add Project
          </button>
        </div>
      </div>

      {/* Projects list */}
      <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="border-b p-4 font-medium dark:border-zinc-800">Projects</div>
        <div className="p-4 space-y-2">
          <AnimatePresence>
            {projects.map((p) => {
              const color = colorForId(p.id);
              const percent = pctComplete(p);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl border p-3 dark:border-zinc-800 cursor-pointer"
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    // soft tinted background + colored border accent
                    backgroundColor: withOpacity(color, 0.08),
                    borderColor: withOpacity(color, 0.35),
                    boxShadow:
                      selectedId === p.id
                        ? `0 0 0 2px ${withOpacity(color, 0.5)}`
                        : "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                        title={p.name}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-gray-600 dark:text-zinc-400">
                          Created {format(parseISO(p.createdAt), "PP p")}
                        </div>
                      </div>
                    </div>

                    <button
                      className="rounded p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(p.id);
                      }}
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-zinc-400">
                      <span>{percent}%</span>
                      <span>
                        {p.tasks.filter((t) => t.status === "done").length}/{p.tasks.length} done
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: color,
                          transition: "width 300ms ease",
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {projects.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              No projects yet. Create one above.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
