import type { OutlineRow } from "@/lib/outline/types";

export type ChildGuideSegment = {
  key: string;
  depth: number;
  parentIndex: number;
  startIndex: number;
  endIndex: number;
};

export function computeChildGuideSegments(rows: OutlineRow[]): ChildGuideSegment[] {
  const lastIndexByDepth = new Map<number, number>();
  const groupMap = new Map<string, number[]>();

  rows.forEach((row, index) => {
    if (row.depth <= 0) {
      lastIndexByDepth.set(0, index);
      return;
    }

    const parentIndex = lastIndexByDepth.get(row.depth - 1);
    if (typeof parentIndex === "number") {
      const groupKey = `${row.depth}:${parentIndex}`;
      const indices = groupMap.get(groupKey) ?? [];
      indices.push(index);
      groupMap.set(groupKey, indices);
    }

    lastIndexByDepth.set(row.depth, index);
  });

  const segments: ChildGuideSegment[] = [];
  for (const [groupKey, indices] of groupMap.entries()) {
    if (indices.length < 2) {
      continue;
    }

    const [depthPart, parentPart] = groupKey.split(":");
    const depth = Number(depthPart);
    const parentIndex = Number(parentPart);
    const startIndex = indices[0];
    const endIndex = indices[indices.length - 1];

    segments.push({
      key: `${depth}-${parentIndex}-${startIndex}-${endIndex}`,
      depth,
      parentIndex,
      startIndex,
      endIndex,
    });
  }

  return segments.sort((a, b) => {
    if (a.startIndex === b.startIndex) {
      return a.depth - b.depth;
    }

    return a.startIndex - b.startIndex;
  });
}
