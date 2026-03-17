"use client";

import { useEffect, useState } from "react";
import { loadOutline, saveOutline } from "@/lib/outline/storage";
import type { OutlineRow } from "@/lib/outline/types";

type UiStyle = "layeredGuides" | "rowPseudoGuides" | "domGuideColumns";

const UI_STYLE_OPTIONS: Array<{ mode: UiStyle; label: string }> = [
  { mode: "layeredGuides", label: "Layered Guides" },
  { mode: "rowPseudoGuides", label: "Row Guides" },
  { mode: "domGuideColumns", label: "DOM Columns" },
];

const BASE_INDENT_REM = 0.55;
const DEPTH_STEP_REM = 1.4;
const GUIDE_COLUMNS = 6;

export function OutlinerWireframe() {
  const [rows, setRows] = useState<OutlineRow[]>([]);
  const [uiStyle, setUiStyle] = useState<UiStyle>("layeredGuides");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setRows(loadOutline());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveOutline(rows);
    }
  }, [hasLoaded, rows]);

  function handleRowChange(targetId: string, nextText: string) {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === targetId ? { ...row, text: nextText } : row)),
    );
  }

  return (
    <div className="outline-ui">
      <div className="outline-toggle" role="group" aria-label="Guide style selector">
        {UI_STYLE_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            className={`outline-toggle-button${uiStyle === option.mode ? " is-active" : ""}`}
            aria-pressed={uiStyle === option.mode}
            onClick={() => setUiStyle(option.mode)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={`outline-canvas outline-canvas--${uiStyle}`}>
        {uiStyle === "domGuideColumns" ? (
          <div className="outline-dom-guides" aria-hidden="true">
            {Array.from({ length: GUIDE_COLUMNS }).map((_, index) => (
              <span
                key={`guide-${index}`}
                className="outline-dom-guide"
                style={{ left: `${1.1 + index * DEPTH_STEP_REM}rem` }}
              />
            ))}
          </div>
        ) : null}

        <ul
          className={`outline-list outline-list--${uiStyle}`}
          data-ui-style={uiStyle}
          aria-label="Outliner rows"
        >
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="outline-row"
              style={{ paddingLeft: `${BASE_INDENT_REM + row.depth * DEPTH_STEP_REM}rem` }}
            >
              <span className="outline-bullet" aria-hidden="true">
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
