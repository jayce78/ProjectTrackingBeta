import React from "react";
import { Download, Upload, RefreshCcw, Moon, Sun } from "lucide-react";
import { exportExcel } from "../utils/excelExport";
import { STORAGE_KEY_CONST } from "../utils/storage";

export default function Header({ projects, setProjects, setSelectedId, theme, setTheme }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-zinc-900/80 dark:border-zinc-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Project Tracker</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Export JSON */}
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700"
            onClick={() => {
              const blob = new Blob([JSON.stringify(projects, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `project-tracker-${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> Export JSON
            </span>
          </button>

          {/* Export Excel */}
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700"
            onClick={() => exportExcel(projects)}
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> Export Excel
            </span>
          </button>

          {/* Import JSON */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700">
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

          {/* Dark mode toggle */}
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle dark mode"
          >
            <span className="inline-flex items-center gap-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
