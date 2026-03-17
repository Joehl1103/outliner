import { defaultOutline } from "@/lib/outline/defaultOutline";
import type { OutlineRow } from "@/lib/outline/types";

export const OUTLINE_STORAGE_KEY = "outliner.m1.rows";

function cloneRows(rows: OutlineRow[]): OutlineRow[] {
  return rows.map((row) => ({ ...row }));
}

function isOutlineRow(value: unknown): value is OutlineRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<OutlineRow>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.text === "string" &&
    typeof candidate.depth === "number" &&
    Number.isInteger(candidate.depth) &&
    candidate.depth >= 0
  );
}

function isOutlineRowArray(value: unknown): value is OutlineRow[] {
  return Array.isArray(value) && value.every((row) => isOutlineRow(row));
}

export function saveOutline(rows: OutlineRow[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(OUTLINE_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore storage write failures to keep UI usable.
  }
}

export function loadOutline(): OutlineRow[] {
  const fallback = cloneRows(defaultOutline);

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(OUTLINE_STORAGE_KEY);

    if (!raw) {
      saveOutline(fallback);
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isOutlineRowArray(parsed)) {
      saveOutline(fallback);
      return fallback;
    }

    return cloneRows(parsed);
  } catch {
    saveOutline(fallback);
    return fallback;
  }
}
