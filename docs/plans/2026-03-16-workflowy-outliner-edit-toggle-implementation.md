# Workflowy-Style Outliner Edit Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add always-editable outline rows with save-on-keystroke behavior and a top toggle that switches among three guide-line UI variants.

**Architecture:** Keep one shared `rows` state and one shared persistence path in `OutlinerWireframe`, then layer style variation through a `uiStyle` mode state that changes classes/markup only. This avoids duplicated behavior code and guarantees edits persist regardless of chosen style.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Vitest.

---

### Task 1: Add Storage Tests For Editable Behavior

**Files:**
- Modify: `tests/outline-storage.test.ts`

**Step 1: Write failing tests for persistence roundtrip**

Add tests that save edited row text with `saveOutline()` and verify `loadOutline()` returns the updated value.

**Step 2: Run tests to verify failure or gap**

Run: `npm test`
Expected: Either failure exposing missing behavior or pass confirming storage layer already supports edits.

**Step 3: Update minimal test coverage only if needed**

If behavior already passes, keep implementation unchanged and retain new regression assertions.

**Step 4: Re-run tests**

Run: `npm test`
Expected: PASS.

### Task 2: Implement Editable Rows And Style Toggle

**Files:**
- Modify: `components/OutlinerWireframe.tsx`
- Modify: `app/page.tsx`

**Step 1: Write failing component tests for editing + style toggle**

Create a component test file to verify:
- row inputs render editable values,
- typing updates the underlying state and triggers persisted save behavior,
- style toggle switches active mode.

**Step 2: Run test to verify failure**

Run: `npm test`
Expected: FAIL due missing editable/toggle implementation.

**Step 3: Implement minimal component changes**

In `OutlinerWireframe`:
- render controlled inputs,
- update row text on each change,
- persist on each `rows` change,
- add toggle for 3 style modes,
- keep one shared row dataset.

In `app/page.tsx`:
- remove visual chrome wrapper and keep a minimal page shell only.

**Step 4: Re-run tests**

Run: `npm test`
Expected: PASS.

### Task 3: Add Three Visual Guide Variants With No Chrome

**Files:**
- Modify: `app/globals.css`

**Step 1: Implement `layeredGuides` style**

Add list-container background rails using repeating linear gradients.

**Step 2: Implement `rowPseudoGuides` style**

Add row pseudo-element vertical guides aligned to depth columns.

**Step 3: Implement `domGuideColumns` style**

Add classes for DOM-backed guide columns rendered behind list content.

**Step 4: Ensure no chrome UI**

Remove card-like borders/shadows and input chrome while preserving readability and focus visibility.

**Step 5: Validate manually in dev**

Run: `npm run dev`
Expected: Toggle shows distinct styles, bullets align, rows remain editable.

### Task 4: Verify And Update Docs

**Files:**
- Modify: `README.md`

**Step 1: Update scope notes**

Document editable rows + style toggle behavior.

**Step 2: Run full verification**

Run: `npm test`
Run: `npm run build`
Expected: both PASS.

**Step 3: Commit**

Run:

```bash
git add components/OutlinerWireframe.tsx app/page.tsx app/globals.css tests/ README.md docs/plans/
git commit -m "feat: add editable nodes with guide-style toggle"
```
