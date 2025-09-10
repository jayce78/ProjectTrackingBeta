export function filterTasks(selected, statusFilter, tagFilter, searchQuery) {
  if (!selected) return [];
  let list = [...selected.tasks];
  if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
  if (tagFilter) {
    list = list.filter((t) => {
      const tags = Array.isArray(t.tags) ? t.tags : (t.tags || "").split(",").map((x) => x.trim());
      return tags.includes(tagFilter);
    });
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter((t) => {
      const tags = Array.isArray(t.tags) ? t.tags : (t.tags || "").split(",").map((x) => x.trim());
      return t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || tags.some((tag) => tag.toLowerCase().includes(q));
    });
  }
  list.sort((a, b) => {
    const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    const order = { in_progress: 0, todo: 1, done: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });
  return list;
}

export function getAllTags(selected) {
  if (!selected) return [];
  return Array.from(new Set(selected.tasks.flatMap((t) =>
    (Array.isArray(t.tags) ? t.tags : (t.tags || "").split(",")).map((s) => String(s).trim()).filter(Boolean)
  ))).sort((a, b) => a.localeCompare(b));
}