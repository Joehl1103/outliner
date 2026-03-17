# Workflowy-Style Outliner MVP Wireframe Design

## Goals

- Ship a very basic Workflowy-style wireframe in Next.js.
- Include browser persistence from day one.
- Keep scope intentionally narrow: visual shell only, no editing interactions yet.

## Scope

### In Scope

- Next.js App Router scaffold.
- Single page (`/`) with centered outliner wireframe layout.
- Render simple bullet rows.
- Persist row data in `localStorage`.
- Seed defaults on first load.
- Recover safely from missing or invalid storage data.

### Out of Scope

- Authentication or multi-user support.
- Server/database persistence.
- Editing rows, keyboard shortcuts, nesting controls, collapse/expand.

## Architecture

The app uses a single route and a small client-side data flow:

1. `app/page.tsx` renders the top-level page shell and outliner component.
2. `components/OutlinerWireframe.tsx` (client component) loads persisted rows and renders the wireframe.
3. `lib/outline/defaultOutline.ts` defines starter rows.
4. `lib/outline/storage.ts` handles `localStorage` read/write via a versioned key.

This keeps rendering concerns separate from persistence concerns and makes later upgrades (editing, nesting, DB persistence) straightforward.

## Data Model

```ts
type OutlineRow = {
  id: string
  text: string
  depth: number
}
```

- `id` is a stable row identifier.
- `text` is the visible row content.
- `depth` is only used for visual indentation in this MVP.

## Data Flow

1. Component mounts on the client.
2. `loadOutline()` attempts to parse persisted JSON.
3. If valid rows exist, render them.
4. If no rows or invalid shape, fall back to default rows and save defaults.
5. Render a static-looking wireframe list.

## Error Handling

- Wrap `localStorage` operations in `try/catch`.
- If parsing or shape validation fails, reset to defaults.
- Use a versioned storage key (for future migration safety).

## Verification

- First load shows seeded rows.
- Refresh preserves rows from `localStorage`.
- Corrupted storage resets to defaults without runtime errors.
- Layout remains readable on desktop and mobile.

## Future Upgrades

- Add editing interactions (add/delete/indent/outdent).
- Add collapse/expand for hierarchical browsing.
- Replace `localStorage` with API + DB persistence.
