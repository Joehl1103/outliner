"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  loadCollapsedById,
  loadOutline,
  saveCollapsedById,
  saveOutline,
  type CollapsedById,
} from "@/lib/outline/storage";
import { computeChildGuideSegments } from "@/lib/outline/treeGuides";
import type { OutlineRow } from "@/lib/outline/types";

type UiStyle = "layeredGuides" | "rowPseudoGuides" | "domGuideColumns";

const ACTIVE_UI_STYLE: UiStyle = "layeredGuides";

const BASE_INDENT_REM = 0.55;
const DEPTH_STEP_REM = 1.4;

type RenderedGuideSegment = {
  key: string;
  left: number;
  top: number;
  height: number;
};

function findParentRowIds(rows: OutlineRow[]): Set<string> {
  const parentRowIds = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const nextRow = rows[index + 1];

    if (nextRow && nextRow.depth > row.depth) {
      parentRowIds.add(row.id);
    }
  }

  return parentRowIds;
}

function computeVisibleRows(
  rows: OutlineRow[],
  parentRowIds: Set<string>,
  collapsedById: CollapsedById,
): OutlineRow[] {
  const visibleRows: OutlineRow[] = [];
  let hiddenFromDepth: number | null = null;

  rows.forEach((row) => {
    if (hiddenFromDepth !== null) {
      if (row.depth > hiddenFromDepth) {
        return;
      }

      hiddenFromDepth = null;
    }

    visibleRows.push(row);

    if (parentRowIds.has(row.id) && collapsedById[row.id]) {
      hiddenFromDepth = row.depth;
    }
  });

  return visibleRows;
}

function findSubtreeEndIndex(rows: OutlineRow[], startIndex: number): number {
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

function shiftRowAndSubtreeDepth(rows: OutlineRow[], targetId: string, outdent: boolean): OutlineRow[] {
  const rowIndex = rows.findIndex((row) => row.id === targetId);
  if (rowIndex < 0) {
    return rows;
  }

  const row = rows[rowIndex];
  const delta = outdent ? -1 : 1;

  if (outdent && row.depth === 0) {
    return rows;
  }

  if (!outdent) {
    if (rowIndex === 0) {
      return rows;
    }

    const maxAllowedDepth = rows[rowIndex - 1].depth + 1;
    if (row.depth >= maxAllowedDepth) {
      return rows;
    }
  }

  const subtreeEndIndex = findSubtreeEndIndex(rows, rowIndex);
  return rows.map((candidate, index) => {
    if (index < rowIndex || index > subtreeEndIndex) {
      return candidate;
    }

    return { ...candidate, depth: candidate.depth + delta };
  });
}

export function OutlinerWireframe() {
  const [rows, setRows] = useState<OutlineRow[]>([]);
  const [collapsedById, setCollapsedById] = useState<CollapsedById>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [guideSegments, setGuideSegments] = useState<RenderedGuideSegment[]>([]);
  const listRef = useRef<HTMLUListElement | null>(null);
  const bulletRefs = useRef<Record<string, HTMLElement | null>>({});

  const parentRowIds = useMemo(() => findParentRowIds(rows), [rows]);
  const visibleRows = useMemo(
    () => computeVisibleRows(rows, parentRowIds, collapsedById),
    [rows, parentRowIds, collapsedById],
  );

  const structuralSegments = useMemo(() => computeChildGuideSegments(visibleRows), [visibleRows]);

  useEffect(() => {
    setRows(loadOutline());
    setCollapsedById(loadCollapsedById());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveOutline(rows);
    }
  }, [hasLoaded, rows]);

  useEffect(() => {
    if (hasLoaded) {
      saveCollapsedById(collapsedById);
    }
  }, [collapsedById, hasLoaded]);

  useLayoutEffect(() => {
    function measureGuides() {
      const listElement = listRef.current;
      if (!listElement) {
        setGuideSegments([]);
        return;
      }

      const listRect = listElement.getBoundingClientRect();
      const measured = structuralSegments.flatMap((segment) => {
        const startRow = visibleRows[segment.startIndex];
        const endRow = visibleRows[segment.endIndex];
        if (!startRow || !endRow) {
          return [];
        }

        const startBullet = bulletRefs.current[startRow.id];
        const endBullet = bulletRefs.current[endRow.id];
        if (!startBullet || !endBullet) {
          return [];
        }

        const startRect = startBullet.getBoundingClientRect();
        const endRect = endBullet.getBoundingClientRect();
        const startCenterY = startRect.top - listRect.top + startRect.height / 2;
        const endCenterY = endRect.top - listRect.top + endRect.height / 2;
        const centerX = startRect.left - listRect.left + startRect.width / 2;

        return [
          {
            key: segment.key,
            left: centerX,
            top: startCenterY,
            height: Math.max(0, endCenterY - startCenterY),
          },
        ];
      });

      setGuideSegments(measured);
    }

    measureGuides();
    window.addEventListener("resize", measureGuides);
    return () => {
      window.removeEventListener("resize", measureGuides);
    };
  }, [structuralSegments, visibleRows]);

  function handleRowChange(targetId: string, nextText: string) {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === targetId ? { ...row, text: nextText } : row)),
    );
  }

  function handleRowCollapseToggle(targetId: string) {
    setCollapsedById((prev) => {
      const next = { ...prev };

      if (next[targetId]) {
        delete next[targetId];
      } else {
        next[targetId] = true;
      }

      return next;
    });
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLInputElement>, targetId: string) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    event.preventDefault();
    setRows((prevRows) => shiftRowAndSubtreeDepth(prevRows, targetId, event.shiftKey));
  }

  return (
    <div className="outline-ui">
      <div className={`outline-canvas outline-canvas--${ACTIVE_UI_STYLE}`}>
        <div className="outline-guide-layer" aria-hidden="true">
          {guideSegments.map((segment) => (
            <span
              key={segment.key}
              className={`outline-guide-segment outline-guide-segment--${ACTIVE_UI_STYLE}`}
              style={{
                left: `${segment.left}px`,
                top: `${segment.top}px`,
                height: `${segment.height}px`,
              }}
            />
          ))}
        </div>

        <ul
          ref={listRef}
          className={`outline-list outline-list--${ACTIVE_UI_STYLE}`}
          data-ui-style={ACTIVE_UI_STYLE}
          aria-label="Outliner rows"
        >
          {visibleRows.map((row, index) => {
            const isParent = parentRowIds.has(row.id);
            const isCollapsed = Boolean(collapsedById[row.id]);
            const rowName = row.text.trim() || `Row ${index + 1}`;

            return (
              <li
                key={row.id}
                className="outline-row"
                style={{ paddingLeft: `${BASE_INDENT_REM + row.depth * DEPTH_STEP_REM}rem` }}
              >
                {isParent ? (
                  <button
                    type="button"
                    ref={(node) => {
                      bulletRefs.current[row.id] = node;
                    }}
                    className={`outline-disclosure ${
                      isCollapsed ? "outline-disclosure--collapsed" : "outline-disclosure--expanded"
                    }`}
                    onClick={() => handleRowCollapseToggle(row.id)}
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${rowName}`}
                  >
                    +
                  </button>
                ) : (
                  <span
                    ref={(node) => {
                      bulletRefs.current[row.id] = node;
                    }}
                    className="outline-bullet"
                    aria-hidden="true"
                  >
                    •
                  </span>
                )}
                <input
                  className="outline-input"
                  value={row.text}
                  onChange={(event) => handleRowChange(row.id, event.target.value)}
                  onKeyDown={(event) => handleRowKeyDown(event, row.id)}
                  aria-label={`Row ${index + 1}`}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
