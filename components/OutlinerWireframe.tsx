"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  loadCollapsedById,
  loadOutline,
  saveCollapsedById,
  saveOutline,
  type CollapsedById,
} from "@/lib/outline/storage";
import { findSubtreeEndIndex, insertSiblingRow, removeRow } from "@/lib/outline/rowOperations";
import { computeChildGuideSegments } from "@/lib/outline/treeGuides";
import type { OutlineRow } from "@/lib/outline/types";

type UiStyle = "layeredGuides" | "rowPseudoGuides" | "domGuideColumns";
type EditorMode = "insert" | "normal";

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
  const [mode, setMode] = useState<EditorMode>("insert");
  const [collapsedById, setCollapsedById] = useState<CollapsedById>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [pendingFocusRowId, setPendingFocusRowId] = useState<string | null>(null);
  const [guideSegments, setGuideSegments] = useState<RenderedGuideSegment[]>([]);
  const listRef = useRef<HTMLUListElement | null>(null);
  const bulletRefs = useRef<Record<string, HTMLElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  function setRowCollapsed(targetId: string, shouldCollapse: boolean) {
    if (!parentRowIds.has(targetId)) {
      return;
    }

    setCollapsedById((prev) => {
      const isCollapsed = Boolean(prev[targetId]);
      if (isCollapsed === shouldCollapse) {
        return prev;
      }

      const next = { ...prev };
      if (shouldCollapse) {
        next[targetId] = true;
      } else {
        delete next[targetId];
      }

      return next;
    });
  }

  function handleInsertSiblingRow(targetId: string) {
    const insertion = insertSiblingRow(rows, targetId);
    if (!insertion.insertedRowId) {
      return;
    }

    setRows(insertion.rows);
    setPendingFocusRowId(insertion.insertedRowId);
  }

  function handleRemoveEmptyRow(targetId: string, rowIndex: number) {
    const nextRows = removeRow(rows, targetId);
    if (nextRows === rows) {
      return;
    }

    const previousVisibleRow = visibleRows[rowIndex - 1];
    const nextVisibleRow = visibleRows[rowIndex + 1];

    setRows(nextRows);
    setCollapsedById((prev) => {
      if (!(targetId in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[targetId];
      return next;
    });
    setPendingFocusRowId(previousVisibleRow?.id ?? nextVisibleRow?.id ?? null);
  }

  function focusRowInput(targetId: string, placeCursorAtEnd = false) {
    const targetInput = inputRefs.current[targetId];
    if (!targetInput) {
      return;
    }

    targetInput.focus();

    if (!placeCursorAtEnd) {
      return;
    }

    const cursorPosition = targetInput.value.length;
    targetInput.setSelectionRange(cursorPosition, cursorPosition);
  }

  useLayoutEffect(() => {
    if (!pendingFocusRowId) {
      return;
    }

    focusRowInput(pendingFocusRowId);
    setPendingFocusRowId(null);
  }, [pendingFocusRowId, visibleRows]);

  function focusPreviousVisibleRow(currentIndex: number) {
    const previousRow = visibleRows[currentIndex - 1];
    if (previousRow) {
      focusRowInput(previousRow.id);
    }
  }

  function focusNextVisibleRow(currentIndex: number) {
    const nextRow = visibleRows[currentIndex + 1];
    if (nextRow) {
      focusRowInput(nextRow.id);
    }
  }

  function focusParentVisibleRow(currentIndex: number) {
    const currentRow = visibleRows[currentIndex];
    if (!currentRow) {
      return;
    }

    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      const candidate = visibleRows[index];
      if (candidate.depth < currentRow.depth) {
        focusRowInput(candidate.id);
        return;
      }
    }
  }

  function focusFirstChildVisibleRow(currentIndex: number) {
    const currentRow = visibleRows[currentIndex];
    const candidate = visibleRows[currentIndex + 1];

    if (currentRow && candidate && candidate.depth > currentRow.depth) {
      focusRowInput(candidate.id);
    }
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLInputElement>, targetId: string, rowIndex: number) {
    const currentRow = visibleRows[rowIndex];

    if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
      if (mode === "insert") {
        event.preventDefault();
        handleInsertSiblingRow(targetId);
      }

      return;
    }

    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      !event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      if (mode === "insert" && currentRow?.text === "") {
        event.preventDefault();
        handleRemoveEmptyRow(targetId, rowIndex);
      }

      return;
    }

    if (event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      setRows((prevRows) => shiftRowAndSubtreeDepth(prevRows, targetId, event.shiftKey));
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setMode("normal");
      return;
    }

    if (mode === "normal" && event.metaKey && !event.altKey && !event.ctrlKey) {
      if (event.key === "j") {
        event.preventDefault();
        setRowCollapsed(targetId, false);
        return;
      }

      if (event.key === "k") {
        event.preventDefault();
        setRowCollapsed(targetId, true);
        return;
      }
    }

    if (mode !== "normal" || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "i") {
      event.preventDefault();
      setMode("insert");
      requestAnimationFrame(() => {
        focusRowInput(targetId, true);
      });
      return;
    }

    if (event.key === "j") {
      event.preventDefault();
      focusNextVisibleRow(rowIndex);
      return;
    }

    if (event.key === "k") {
      event.preventDefault();
      focusPreviousVisibleRow(rowIndex);
      return;
    }

    if (event.key === "h") {
      event.preventDefault();
      focusParentVisibleRow(rowIndex);
      return;
    }

    if (event.key === "l") {
      event.preventDefault();
      focusFirstChildVisibleRow(rowIndex);
      return;
    }

    event.preventDefault();
  }

  return (
    <div className="outline-ui">
      <div className="outline-status-bar">
        <div
          className={`outline-mode-indicator outline-mode-indicator--${mode}`}
          role="status"
          aria-live="polite"
        >
          {mode.toUpperCase()}
        </div>
      </div>

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
                  ref={(node) => {
                    inputRefs.current[row.id] = node;
                  }}
                  className="outline-input"
                  value={row.text}
                  onChange={(event) => handleRowChange(row.id, event.target.value)}
                  onKeyDown={(event) => handleRowKeyDown(event, row.id, index)}
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
