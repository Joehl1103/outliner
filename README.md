# Outliner MVP

Workflowy-style outliner MVP wireframe built with Next.js.

## Current Scope

- Always-editable rows (changes saved per keystroke)
- Press `Enter` to create a new sibling bullet
- Press `Backspace` on an empty bullet to remove it and focus the previous bullet
- Browser persistence via `localStorage`
- Seeded default outline on first load
- 3-way guide style toggle (`Layered Guides`, `Row Guides`, `DOM Columns`)
- Vim-style `INSERT` / `NORMAL` mode indicator centered at the top of the editor
- In `NORMAL` mode, plain `j/k` moves between rows, while `cmd+j` expands and `cmd+k` collapses the current row's children

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm test
npm run build
```
