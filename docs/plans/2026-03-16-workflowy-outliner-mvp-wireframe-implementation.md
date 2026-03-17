# Workflowy-Style Outliner MVP Wireframe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimal Next.js Workflowy-style outliner wireframe that loads seeded rows and persists them in browser `localStorage`.

**Architecture:** Scaffold a small Next.js App Router app, add a focused client component for rendering a static wireframe, and isolate persistence/data defaults in `lib/outline/*` modules. The UI is intentionally read-only, but uses real client-side persistence so future editing features can build on a stable data model.

**Tech Stack:** Next.js (App Router), React, TypeScript, browser `localStorage`.

---

### Task 1: Scaffold Minimal Next.js App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

**Step 1: Initialize dependencies and scripts**

Create `package.json` with `next`, `react`, `react-dom`, TypeScript, and scripts (`dev`, `build`, `start`, `lint`).

**Step 2: Add base Next.js/TypeScript config**

Create `tsconfig.json`, `next.config.ts`, and `next-env.d.ts` with standard App Router defaults.

**Step 3: Add app shell files**

Create `app/layout.tsx`, `app/page.tsx`, and `app/globals.css` to render a basic page and ensure styles load.

**Step 4: Install dependencies and verify app boots**

Run: `npm install`
Run: `npm run build`
Expected: Successful Next.js production build.

### Task 2: Add Outline Data Model And Local Storage Layer

**Files:**
- Create: `lib/outline/types.ts`
- Create: `lib/outline/defaultOutline.ts`
- Create: `lib/outline/storage.ts`

**Step 1: Define shared type**

Add `OutlineRow` type (`id`, `text`, `depth`) in `lib/outline/types.ts`.

**Step 2: Create seeded default rows**

Add a small, realistic starter list in `lib/outline/defaultOutline.ts`.

**Step 3: Implement persistence utilities**

Create `loadOutline()` and `saveOutline()` in `lib/outline/storage.ts` with:
- versioned storage key,
- JSON parse guards,
- lightweight shape validation,
- safe fallback to defaults on failure.

**Step 4: Verify module correctness by lint/build**

Run: `npm run build`
Expected: Build passes with no TypeScript errors.

### Task 3: Build Workflowy-Style Wireframe Component

**Files:**
- Create: `components/OutlinerWireframe.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Step 1: Build client wireframe component**

Implement `OutlinerWireframe` as a client component that:
- loads rows on mount from `loadOutline()`,
- writes defaults using `saveOutline()` when storage is empty/invalid,
- renders a read-only bullet list with indentation from `depth`.

**Step 2: Wire component into page**

Render the component from `app/page.tsx` with a clean centered container and minimal heading.

**Step 3: Style the wireframe**

Update `app/globals.css` for a simple Workflowy-like look:
- generous whitespace,
- readable typography,
- subtle row hover background,
- mobile-friendly responsive layout.

**Step 4: Validate runtime behavior**

Run: `npm run build`
Run: `npm run dev` and manually verify:
- first load shows seeded rows,
- refresh keeps persisted rows,
- clearing/corrupting storage resets to defaults.

### Task 4: Document Run Instructions

**Files:**
- Create: `README.md`

**Step 1: Add concise setup docs**

Document install, dev, and build commands and mention current MVP constraints (read-only wireframe + `localStorage` persistence).

**Step 2: Final verification**

Run: `npm run build`
Expected: Build succeeds after documentation updates.
