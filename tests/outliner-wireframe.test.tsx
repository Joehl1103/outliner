import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { OutlinerWireframe } from "@/components/OutlinerWireframe";
import { OUTLINE_COLLAPSE_STORAGE_KEY, OUTLINE_STORAGE_KEY } from "@/lib/outline/storage";

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

  it("collapses and expands descendants for parent rows", async () => {
    localStorage.clear();
    const { container } = render(<OutlinerWireframe />);

    const collapseButton = await screen.findByRole("button", { name: "Collapse MVP scope" });
    await userEvent.click(collapseButton);

    expect(screen.queryByDisplayValue("Wireframe visuals")).toBeNull();
    expect(screen.queryByDisplayValue("Browser persistence")).toBeNull();
    expect(localStorage.getItem(OUTLINE_COLLAPSE_STORAGE_KEY)).toContain("row-2");

    expect(container.querySelectorAll(".outline-guide-segment")).toHaveLength(2);

    const expandButton = await screen.findByRole("button", { name: "Expand MVP scope" });
    await userEvent.click(expandButton);

    expect(await screen.findByDisplayValue("Wireframe visuals")).not.toBeNull();
    expect(await screen.findByDisplayValue("Browser persistence")).not.toBeNull();
    expect(container.querySelectorAll(".outline-guide-segment")).toHaveLength(3);
  });

  it("restores collapsed state from localStorage on remount", async () => {
    localStorage.clear();

    const firstRender = render(<OutlinerWireframe />);
    const collapseButton = await screen.findByRole("button", { name: "Collapse MVP scope" });
    await userEvent.click(collapseButton);
    firstRender.unmount();

    render(<OutlinerWireframe />);

    expect(await screen.findByRole("button", { name: "Expand MVP scope" })).not.toBeNull();
    expect(screen.queryByDisplayValue("Wireframe visuals")).toBeNull();
    expect(screen.queryByDisplayValue("Browser persistence")).toBeNull();
  });

  it("keeps leaf rows as plain bullets without toggle controls", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const list = await screen.findByRole("list", { name: "Outliner rows" });
    expect(list.getAttribute("data-ui-style")).toBe("layeredGuides");
    expect(screen.queryByRole("button", { name: /Wireframe visuals/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /What to edit next\?/i })).toBeNull();
  });
});
