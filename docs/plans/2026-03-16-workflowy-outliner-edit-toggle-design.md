# Workflowy-Style Outliner Editable Nodes + UI Toggle Design

## Goals

- Enable inline editing for all outline rows.
- Persist changes to browser storage on every keystroke.
- Remove visual chrome from the outline editor surface.
- Provide a top toggle to compare three visual styles for depth guide lines.

## Scope

### In Scope

- Replace static row text with always-editable inputs.
- Shared row state across all visual variants.
- Three switchable view styles:
  - `layeredGuides` (full-height gradient rails on list container)
  - `rowPseudoGuides` (row-level pseudo-element guide rails)
  - `domGuideColumns` (DOM-rendered vertical guide columns behind content)
- Local storage save on each change.
- Optional persistence of selected style mode.

### Out of Scope

- Keyboard hierarchy operations (indent/outdent shortcuts).
- Node insert/delete interactions.
- Collapse/expand tree behavior.
- Multi-user or server persistence.

## Architecture

The implementation remains centered in the existing client component:

1. `OutlinerWireframe` owns `rows` and `uiStyle` state.
2. `rows` is initialized via `loadOutline()` and saved via `saveOutline(rows)` in an effect.
3. `uiStyle` controls CSS/markup variant selection for guide-line rendering.
4. A top toggle switches visual mode without changing data.

This keeps behavior logic singular while allowing side-by-side style evaluation in one screen.

## Data Flow

1. On mount, load rows from `localStorage` fallback logic.
2. Render each row as a controlled input.
3. On input change, update only the target row text in state.
4. Persist `rows` on every state change.
5. Switch style mode with toggle buttons; rows stay shared.

## UX And Visual Direction

- No card/chrome container around the list body.
- Inputs visually blend into page: transparent background, no borders, no focus rings that look like form controls.
- Bullets remain visible and aligned.
- Vertical depth guides are always subtle and non-intrusive.
- Toggle UI stays minimal but clearly indicates active style.

## Error Handling

- Preserve current storage guards (`try/catch`, shape validation, fallback to defaults).
- Empty row text is valid and still saved.
- Storage write failures are non-fatal (typing still works in-memory).

## Verification

- Typing in any row updates instantly.
- Refresh retains edited text.
- Switching among all 3 styles preserves current edits.
- All 3 styles show vertically aligned depth guides.
- Mobile layout remains readable and editable.

## Future Upgrades

- Add Enter/new-row and Backspace/delete-row behavior.
- Add keyboard-driven hierarchy manipulation.
- Add collapse/expand affordances.
