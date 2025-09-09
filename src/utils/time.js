export const nowISO = () => new Date().toISOString();

export const formatDuration = (ms) => {
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

export const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const pctComplete = (p) => {
  const total = p.tasks.length || 1;
  const done = p.tasks.filter((t) => t.status === "done").length;
  return Math.round((done / total) * 100);
};

export const durationFromTask = (t) => {
  if (!t) return 0;
  const runningExtra =
    t.activeStart ? new Date().getTime() - new Date(t.activeStart).getTime() : 0;
  if (t.status === "done") return t.elapsedMs || 0;
  return (t.elapsedMs || 0) + runningExtra;
};

export const unique = (arr) => Array.from(new Set(arr));
export const cls = (...xs) => xs.filter(Boolean).join(" ");
