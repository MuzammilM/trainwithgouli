# Queue — 2026-09-27 (b)

| # | Item | Type | Status | Task ID |
|---|------|------|--------|---------|
| Q-1 | Streak counter tile (week starts Mon, target 5/wk) replacing WORKING SETS + TOTAL REPS | feature | completed | feature-week-streak-tile-20260927 |
| Q-2 | Explain progress-bar logic | question | completed | — answered in chat |
| Q-3 | Two shareable card versions w/ toggle; v2 = no exercise list, bigger central heatmap | feature | completed | feature-share-card-variants-20260927 |

## Q-1 design
- Count distinct local dates Mon–Sun (current week) with a workout_day having ≥1 done entry
- Tile: WEEK STREAK value "3/5"; tiles become EXERCISES / WEEK STREAK / DURATION
- Pure helpers in share-stats.ts; page fetches this week's days (service or user token)

## Q-3 design
- ShareCard variant: 'full' (current) | 'simple'
- simple: no EXERCISE LIST; heatmap ~520px centered horizontally (x 260–780, y 580–1100);
  focus bars move to bottom-left (y ~1140–1410, zone C)
- ShareCardClient: segmented toggle [Full|Simple]; PNG capture uses active variant

## Deploy: dev after Q-3 (established pattern)
