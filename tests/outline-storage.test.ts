import { describe, expect, it } from "vitest";
import { defaultOutline } from "@/lib/outline/defaultOutline";
import {
  loadCollapsedById,
  loadOutline,
  OUTLINE_COLLAPSE_STORAGE_KEY,
  OUTLINE_STORAGE_KEY,
  saveCollapsedById,
  saveOutline,
} from "@/lib/outline/storage";

describe("outline storage", () => {
  it("seeds defaults when storage is empty", () => {
    localStorage.clear();

    const rows = loadOutline();

    expect(rows).toEqual(defaultOutline);
    expect(localStorage.getItem(OUTLINE_STORAGE_KEY)).toContain("Project Brain Dump");
  });

  it("loads saved rows when storage has valid data", () => {
    localStorage.clear();
    const saved = [
      { id: "custom-1", text: "Saved row", depth: 0 },
      { id: "custom-2", text: "Nested saved row", depth: 1 },
    ];
    localStorage.setItem(OUTLINE_STORAGE_KEY, JSON.stringify(saved));

    const rows = loadOutline();

    expect(rows).toEqual(saved);
  });

  it("falls back to defaults when storage is invalid JSON", () => {
    localStorage.clear();
    localStorage.setItem(OUTLINE_STORAGE_KEY, "{" as string);

    const rows = loadOutline();

    expect(rows).toEqual(defaultOutline);
  });

  it("falls back to defaults when parsed shape is invalid", () => {
    localStorage.clear();
    localStorage.setItem(OUTLINE_STORAGE_KEY, JSON.stringify([{ bad: "shape" }]));

    const rows = loadOutline();

    expect(rows).toEqual(defaultOutline);
  });

  it("roundtrips edited row text through save and load", () => {
    localStorage.clear();
    const edited = defaultOutline.map((row) => ({ ...row }));
    edited[0].text = "Renamed top node";

    saveOutline(edited);
    const rows = loadOutline();

    expect(rows[0].text).toBe("Renamed top node");
  });

  it("returns empty collapse map when collapse storage is empty", () => {
    localStorage.clear();

    expect(loadCollapsedById()).toEqual({});
  });

  it("roundtrips collapse state through save and load", () => {
    localStorage.clear();
    const collapsed = { "row-2": true, "row-5": false };

    saveCollapsedById(collapsed);

    expect(loadCollapsedById()).toEqual(collapsed);
  });

  it("falls back to empty collapse map when parsed collapse shape is invalid", () => {
    localStorage.clear();
    localStorage.setItem(OUTLINE_COLLAPSE_STORAGE_KEY, JSON.stringify(["bad-shape"]));

    expect(loadCollapsedById()).toEqual({});
  });
});
