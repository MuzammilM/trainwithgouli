# Queue — 2026-09-27

| # | Item | Type | Status | Task ID |
|---|------|------|--------|---------|
| Q-1 | Client sex classification (male/female, coach-set field) | feature | completed | feature-client-sex-field-20260927 |
| Q-2 | Sex-aware share card muscle map (female asset) | feature | completed | feature-female-muscle-map-20260927 |

## Q-1 — Client sex classification
- Add `sex` field (select: male | female) to PocketBase `clients` collection
- Coach UI: set it in Add-client / edit-client form (src/app/clients, lib/actions/clients.ts)
- Seed data: madebymzm@gmail.com = male, kainathjunaidi@gmail.com = female
- Falls back gracefully when unset (treated as male for Q-2 purposes)

## Q-2 — Female muscle map
- Asset: ~/workspace/smarann/gdrive/file_00000000c2d8820782c50bdfd4541ede.png
- Male clients → existing male map; female clients → female map
- Share page resolves sex via clients record (email match); passes to ShareCard → MuscleMap
- Female map needs the same treatment as male: trim black bg, transparent line art,
  hand-mapped region polygons (grid + PIL composite verification)
- Deploy to dev after Q-2 (user tests both flows end-to-end)

## Queue-level decisions
- Deploy target: dev (established session pattern; user tests on dev)
- PB schema change: add field via superuser API from dev container (no repo migrations
  tooling for PocketBase); field removal reverses it
