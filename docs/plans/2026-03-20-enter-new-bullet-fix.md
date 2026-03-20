# Enter Key New Bullet Fix Plan

## Goal

Make `Enter` create a new bullet instead of a multiline row.

## Intended Behavior

- Pressing `Enter` in insert mode creates a blank sibling row.
- The new row should use the same depth as the current row.
- If the current row has descendants, the new sibling should be inserted after the full subtree.
- Focus should move to the new row so typing can continue immediately.

## Verification

- Add component tests for leaf-row insertion.
- Add component tests for parent-row insertion after descendants.
- Run `npm test`.
- Run `npm run build`.
