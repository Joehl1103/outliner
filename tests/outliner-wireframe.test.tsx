import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { OutlinerWireframe } from "@/components/OutlinerWireframe";
import type { OutlineRow } from "@/lib/outline/types";
import { OUTLINE_COLLAPSE_STORAGE_KEY, OUTLINE_STORAGE_KEY } from "@/lib/outline/storage";

afterEach(() => {
  cleanup();
});

function loadSavedRows(): OutlineRow[] {
  const saved = localStorage.getItem(OUTLINE_STORAGE_KEY);
  expect(saved).not.toBeNull();

  return JSON.parse(saved as string) as OutlineRow[];
}

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

  it("indents a row and its descendants when Tab is pressed", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const questionsInput = await screen.findByDisplayValue("Questions");
    await userEvent.click(questionsInput);
    await userEvent.keyboard("{Tab}");

    const rows = loadSavedRows();
    expect(rows.find((row) => row.id === "row-5")?.depth).toBe(2);
    expect(rows.find((row) => row.id === "row-6")?.depth).toBe(3);
    expect(rows.find((row) => row.id === "row-7")?.depth).toBe(3);
  });

  it("outdents a row and its descendants when Shift+Tab is pressed", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const mvpScopeInput = await screen.findByDisplayValue("MVP scope");
    await userEvent.click(mvpScopeInput);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

    const rows = loadSavedRows();
    expect(rows.find((row) => row.id === "row-2")?.depth).toBe(0);
    expect(rows.find((row) => row.id === "row-3")?.depth).toBe(1);
    expect(rows.find((row) => row.id === "row-4")?.depth).toBe(1);
  });

  it("does not outdent top-level rows when Shift+Tab is pressed", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const rootInput = await screen.findByDisplayValue("Project Brain Dump");
    await userEvent.click(rootInput);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

    const rows = loadSavedRows();
    expect(rows.find((row) => row.id === "row-1")?.depth).toBe(0);
  });

  it("navigates between adjacent rows with j and k in normal mode", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const mvpScopeInput = (await screen.findByDisplayValue("MVP scope")) as HTMLInputElement;
    await userEvent.click(mvpScopeInput);
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("j");

    const wireframeInput = (await screen.findByDisplayValue("Wireframe visuals")) as HTMLInputElement;
    expect(document.activeElement).toBe(wireframeInput);
    expect(mvpScopeInput.value).toBe("MVP scope");

    await userEvent.keyboard("k");
    expect(document.activeElement).toBe(mvpScopeInput);
  });

  it("navigates hierarchy with h and l in normal mode", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const childInput = (await screen.findByDisplayValue("Wireframe visuals")) as HTMLInputElement;
    await userEvent.click(childInput);
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("h");

    const parentInput = (await screen.findByDisplayValue("MVP scope")) as HTMLInputElement;
    expect(document.activeElement).toBe(parentInput);

    await userEvent.keyboard("l");
    expect(document.activeElement).toBe(childInput);
  });

  it("returns to insert mode with i after normal mode", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const mvpScopeInput = (await screen.findByDisplayValue("MVP scope")) as HTMLInputElement;
    await userEvent.click(mvpScopeInput);
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("i");
    await userEvent.keyboard("!");

    expect(mvpScopeInput.value).toBe("MVP scope!");
  });

  it("shows a top-centered mode indicator and updates it on Escape and i", async () => {
    localStorage.clear();
    const { container } = render(<OutlinerWireframe />);

    const statusBar = container.querySelector(".outline-status-bar");
    const canvas = container.querySelector(".outline-canvas");
    expect(statusBar).not.toBeNull();
    expect(canvas).not.toBeNull();
    expect(statusBar?.nextElementSibling).toBe(canvas);

    const modeIndicator = await screen.findByRole("status");
    expect(modeIndicator.textContent).toBe("INSERT");

    const mvpScopeInput = await screen.findByDisplayValue("MVP scope");
    await userEvent.click(mvpScopeInput);
    await userEvent.keyboard("{Escape}");

    expect(modeIndicator.textContent).toBe("NORMAL");

    await userEvent.keyboard("i");
    expect(modeIndicator.textContent).toBe("INSERT");
  });

  it("keeps rows visible and blocks plain text input in normal mode", async () => {
    localStorage.clear();
    render(<OutlinerWireframe />);

    const mvpScopeInput = (await screen.findByDisplayValue("MVP scope")) as HTMLInputElement;
    await userEvent.click(mvpScopeInput);
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("x");

    expect(await screen.findByDisplayValue("Project Brain Dump")).not.toBeNull();
    expect(await screen.findByDisplayValue("MVP scope")).not.toBeNull();
    expect(mvpScopeInput.value).toBe("MVP scope");
  });
});
