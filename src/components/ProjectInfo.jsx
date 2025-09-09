import React from "react";
import { format, parseISO } from "date-fns";
import { pctComplete } from "../utils/time";

export default function ProjectInfo({ selected }) {
  if (!selected) return null;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border p-4 dark:border-zinc-800">
        <div className="text-sm font-medium mb-2">Project Info</div>
        <div className="space-y-1 text-sm text-gray-600 dark:text-zinc-400">
          <div className="flex items-center justify-between"><span>Created</span><span>{format(parseISO(selected.createdAt), "PP p")}</span></div>
          <div className="flex items-center justify-between"><span>Total Tasks</span><span>{selected.tasks.length}</span></div>
          <div className="flex items-center justify-between"><span>Completed</span><span>{selected.tasks.filter((t) => t.status === "done").length}</span></div>
          <div className="flex items-center justify-between"><span>Progress</span><span>{pctComplete(selected)}%</span></div>
        </div>
      </div>
    </div>
  );
}
