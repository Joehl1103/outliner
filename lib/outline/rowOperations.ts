import type { OutlineRow } from "@/lib/outline/types";

export type InsertSiblingRowResult = {
  insertedRowId: string | null;
  rows: OutlineRow[];
};

function createNextRowId(rows: OutlineRow[]): string {
  const highestExistingId = rows.reduce((highestId, row) => {
    const match = /^row-(\d+)$/.exec(row.id);

    if (!match) {
      return highestId;
    }

    return Math.max(highestId, Number(match[1]));
  }, 0);

  return `row-${highestExistingId + 1}`;
}

export function findSubtreeEndIndex(rows: OutlineRow[], startIndex: number): number {
  const parentDepth = rows[startIndex]?.depth;
  if (typeof parentDepth !== "number") {
    return startIndex;
  }

  let endIndex = startIndex;

  for (let index = startIndex + 1; index < rows.length; index += 1) {
    if (rows[index].depth <= parentDepth) {
      break;
    }

    endIndex = index;
  }

  return endIndex;
}

export function insertSiblingRow(rows: OutlineRow[], targetId: string): InsertSiblingRowResult {
  const targetIndex = rows.findIndex((row) => row.id === targetId);
  if (targetIndex < 0) {
    return { insertedRowId: null, rows };
  }

  const targetRow = rows[targetIndex];
  const insertionIndex = findSubtreeEndIndex(rows, targetIndex) + 1;
  const insertedRow: OutlineRow = {
    id: createNextRowId(rows),
    text: "",
    depth: targetRow.depth,
  };

  return {
    insertedRowId: insertedRow.id,
    rows: [...rows.slice(0, insertionIndex), insertedRow, ...rows.slice(insertionIndex)],
  };
}

export function removeRow(rows: OutlineRow[], targetId: string): OutlineRow[] {
  const targetIndex = rows.findIndex((row) => row.id === targetId);
  if (targetIndex < 0 || rows.length <= 1) {
    return rows;
  }

  const subtreeEndIndex = findSubtreeEndIndex(rows, targetIndex);
  const promotedChildren = rows
    .slice(targetIndex + 1, subtreeEndIndex + 1)
    .map((row) => ({ ...row, depth: row.depth - 1 }));

  return [...rows.slice(0, targetIndex), ...promotedChildren, ...rows.slice(subtreeEndIndex + 1)];
}
