import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { OutlinerWireframe } from "@/components/OutlinerWireframe";
import { OUTLINE_STORAGE_KEY } from "@/lib/outline/storage";

afterEach(() => {
  cleanup();
});

describe("OutlinerWireframe", () => {
  it("renders editable rows and saves changes on each keystroke", async () => {
    localStorage.clear();
    const { container } = render(<OutlinerWireframe />);

    const firstRowInput = await screen.findByDisplayValue("Project Brain Dump");
    await userEvent.clear(firstRowInput);
    await userEvent.type(firstRowInput, "Project Alpha");

    expect((firstRowInput as HTMLInputElement).value).toBe("Project Alpha");

    const saved = localStorage.getItem(OUTLINE_STORAGE_KEY);
    expect(saved).toContain("Project Alpha");

    expect(container.querySelectorAll(".outline-guide-segment")).toHaveLength(3);
  });

  it("uses layered guide mode without toggle buttons", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const list = await screen.findByRole("list", { name: "Outliner rows" });
    expect(list.getAttribute("data-ui-style")).toBe("layeredGuides");
    expect(screen.queryByRole("button", { name: "DOM Columns" })).toBeNull();
  });
});
