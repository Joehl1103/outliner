import { describe, expect, it } from "vitest";
import { computeChildGuideSegments } from "@/lib/outline/treeGuides";
import type { OutlineRow } from "@/lib/outline/types";

describe("computeChildGuideSegments", () => {
  it("returns one segment per sibling group with 2+ children", () => {
    const rows: OutlineRow[] = [
      { id: "0", text: "Root", depth: 0 },
      { id: "1", text: "A", depth: 1 },
      { id: "2", text: "A.1", depth: 2 },
      { id: "3", text: "A.2", depth: 2 },
      { id: "4", text: "B", depth: 1 },
      { id: "5", text: "B.1", depth: 2 },
      { id: "6", text: "B.2", depth: 2 },
      { id: "7", text: "C", depth: 1 },
    ];

    const segments = computeChildGuideSegments(rows);

    expect(segments).toEqual([
      { key: "1-0-1-7", depth: 1, parentIndex: 0, startIndex: 1, endIndex: 7 },
      { key: "2-1-2-3", depth: 2, parentIndex: 1, startIndex: 2, endIndex: 3 },
      { key: "2-4-5-6", depth: 2, parentIndex: 4, startIndex: 5, endIndex: 6 },
    ]);
  });

  it("skips groups with only one child", () => {
    const rows: OutlineRow[] = [
      { id: "0", text: "Root", depth: 0 },
      { id: "1", text: "Only", depth: 1 },
      { id: "2", text: "Leaf", depth: 2 },
    ];

    expect(computeChildGuideSegments(rows)).toEqual([]);
  });
});
