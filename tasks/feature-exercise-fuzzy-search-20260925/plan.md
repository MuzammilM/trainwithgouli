# Plan — feature-exercise-fuzzy-search-20260925

## Goal
Replace the plain `<select>` in `ExercisePicker.tsx` with an accessible fuzzy-search combobox while keeping the same public props so DayBuilder and TemplateForm require no changes.

## Acceptance Criteria
1. Typing in the exercise field fuzzy-filters exercise names (subsequence match, sensible ranking — e.g. starts-with/word-boundary bonus).
2. A dropdown shows matches; clicking or pressing Enter selects; Escape closes; ArrowUp/Down navigate; full ARIA combobox semantics (role=combobox, listbox, aria-expanded, aria-activedescendant, aria-controls).
3. Body-part chips still combine with the fuzzy query.
4. Selecting an exercise still calls `onSelect(name, exercise)` exactly as before.
5. Selected value renders when `selectedName` is set externally (edit flows in TemplateForm).
6. No new dependencies (small inline fuzzy scorer, case-insensitive).
7. Works on mobile (the coach uses a phone — large touch targets in dropdown).
8. `npm run build` (or lint/build per repo scripts) passes.

## Subagent Sequence
| # | Subagent | Purpose |
|---|----------|---------|
| 1 | git-worktree-operations | Create worktree `~/workspace/worktrees/trainwithgouli/feature-exercise-fuzzy-search-20260925` off main |
| 2 | code-research-agent | Verify ExercisePicker consumers/props; check Next.js version docs note; recommend fuzzy scoring approach |
| 3 | changes-fixes-agent | Rewrite ExercisePicker as fuzzy combobox (single file) |
| 4 | validator-agent | Validate implementation vs acceptance criteria |
| 5 | git-worktree-operations | Merge/push/cleanup (after user confirms) |
| (6) | deploy-agent | Only if user explicitly approves deploy |

## Out of Scope
- Backend changes, DB changes, other pickers.
