"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { loadOutline, saveOutline } from "@/lib/outline/storage";
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

export function OutlinerWireframe() {
  const [rows, setRows] = useState<OutlineRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [guideSegments, setGuideSegments] = useState<RenderedGuideSegment[]>([]);
  const listRef = useRef<HTMLUListElement | null>(null);
  const bulletRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const structuralSegments = useMemo(() => computeChildGuideSegments(rows), [rows]);

  useEffect(() => {
    setRows(loadOutline());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveOutline(rows);
    }
  }, [hasLoaded, rows]);

  useLayoutEffect(() => {
    function measureGuides() {
      const listElement = listRef.current;
      if (!listElement) {
        setGuideSegments([]);
        return;
      }

      const listRect = listElement.getBoundingClientRect();
      const measured = structuralSegments.flatMap((segment) => {
        const startRow = rows[segment.startIndex];
        const endRow = rows[segment.endIndex];
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
  }, [rows, structuralSegments]);

  function handleRowChange(targetId: string, nextText: string) {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === targetId ? { ...row, text: nextText } : row)),
    );
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
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="outline-row"
              style={{ paddingLeft: `${BASE_INDENT_REM + row.depth * DEPTH_STEP_REM}rem` }}
            >
              <span
                ref={(node) => {
                  bulletRefs.current[row.id] = node;
                }}
                className="outline-bullet"
                aria-hidden="true"
              >
                •
              </span>
              <input
                className="outline-input"
                value={row.text}
                onChange={(event) => handleRowChange(row.id, event.target.value)}
                aria-label={`Row ${index + 1}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
