"use client";

import { useEffect, useState } from "react";
import { loadOutline } from "@/lib/outline/storage";
import type { OutlineRow } from "@/lib/outline/types";

export function OutlinerWireframe() {
  const [rows, setRows] = useState<OutlineRow[]>([]);

  useEffect(() => {
    setRows(loadOutline());
  }, []);

  return (
    <ul className="outline-list" aria-label="Outliner rows">
      {rows.map((row) => (
        <li
          key={row.id}
          className="outline-row"
          style={{ paddingLeft: `${0.55 + row.depth * 1.4}rem` }}
        >
          <span className="outline-bullet" aria-hidden="true">
            •
          </span>
          <span>{row.text}</span>
        </li>
      ))}
    </ul>
  );
}
