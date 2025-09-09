const STORAGE_KEY = "project-tracker:data:v2";
export const THEME_KEY = "project-tracker-theme";

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveData(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

export const STORAGE_KEY_CONST = STORAGE_KEY;
