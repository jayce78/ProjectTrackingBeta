// Null-safe helpers
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const norm = (s) => (s == null ? "" : String(s)).toLowerCase();

export function getAllTags(project) {
  if (!project || !Array.isArray(project.tasks)) return [];
  const set = new Set();
  for (const t of project.tasks) {
    for (const tag of toArray(t?.tags)) {
      const v = String(tag).trim();
      if (v) set.add(v);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * filterTasks(project, statusFilter, tagFilter, searchQuery)
 * - statusFilter: "all" | "todo" | "in_progress" | "done"
 * - tagFilter: "" (no filter) OR exact tag string
 * - searchQuery: matched against title, description, and tags (case-insensitive, substring)
 */
export function filterTasks(project, statusFilter = "all", tagFilter = "", searchQuery = "") {
  if (!project || !Array.isArray(project.tasks)) return [];
  const wantStatus = statusFilter || "all";
  const wantTag = norm(tagFilter);
  const q = norm(searchQuery);

  return project.tasks.filter((t) => {
    // status
    if (wantStatus !== "all" && t?.status !== wantStatus) return false;

    // tag (exact match, case-insensitive)
    if (wantTag) {
      const has = toArray(t?.tags).some((tag) => norm(tag) === wantTag);
      if (!has) return false;
    }

    // search in title / description / tags
    if (q) {
      const hayTitle = norm(t?.title);
      const hayDesc = norm(t?.description);
      const hayTags = toArray(t?.tags).map(norm).join(" ");
      if (!hayTitle.includes(q) && !hayDesc.includes(q) && !hayTags.includes(q)) {
        return false;
      }
    }

    return true;
  });
}
