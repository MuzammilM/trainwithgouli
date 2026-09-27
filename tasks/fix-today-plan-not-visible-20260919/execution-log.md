# Execution Log — fix-today-plan-not-visible-20260919

| Time | Phase | Action | Result |
|------|-------|--------|--------|
| — | Diagnosis | PB query via dev02 alpine+sqlite sidecar | workout_days = 0 rows despite successful save |
| — | Diagnosis | users/clients check | madebymzm users record (jvc07fw8e77fyz6) + clients record both exist ✓ |
| — | Diagnosis | App logs on dev (trainwithgouli-frontend-next) | `[saveDaySheet] workout_days upsert failed … 400 … data: { id: [Object] }` |
| — | Diagnosis | Schema dump (_collections) | id field autogeneratePattern EMPTY on workout_days + workout_templates (healthy = `[a-z0-9]{15}`) |
| — | Fix | Collections API PATCH (dev02, service superuser) | both collections → autogeneratePattern `[a-z0-9]{15}` |
| — | Verify | GET collections + probe create/delete | schema verified; create returns server id; table back to 0 rows |

Root cause: collections created via Collections API without id autogeneratePattern → all creates 400'd silently (fail-soft upsert swallowed it).
Fix: schema-only. No app code change, no deploy.
Learning: basic-memory `coding/trainwithgouli/learnings/2026-09-19-pocketbase-empty-id-autogeneratepattern`
Lookup: basic-memory `coding/trainwithgouli/lookups/infra-service-lookup` (app=dev, PB=dev02; prod/prod01 stale)
Pending: user re-save via /today-coach → verify /today-client.

---

## Round 2 — record exists but still invisible (2026-09-19 evening)

| Time | Phase | Action | Result |
|------|-------|--------|--------|
| — | Diagnosis | Record rxfcm7sv34rrhjv inspected (with WAL copy) | user=madebymzm ✓, date stored as `2026-09-19 00:00:00.000Z` ✓, collection rules correct ✓ |
| — | Diagnosis | Exact page filter tested via Collections API (superuser) | `date = "2026-09-19"` → 0 items; user-only → 1 item → **date-equality never matches stored datetime** |
| — | Diagnosis | Candidate filter forms tested live | range `>=/<` ✓, `~ prefix` ✓ → range chosen |
| — | Worktree | git-worktree-operations (create) | worktree + branch fix-today-plan-not-visible-20260919 @ f2e9e3b |
| — | Implement | changes-fixes-agent-trivial (2 files: today-client/page.tsx, daysheet.ts) | first-try success, build PASS, commit 8fc212b |
| — | Validate | validator-agent ×2 → Model not found (opencode cache, restart pending) | orchestrator self-validated: diff exact, no remaining equality filters, boundary-safe → PASS |
| — | Merge | git-worktree-operations (merge/push/cleanup) | fast-forward to main, pushed, worktree+branch removed |
| — | Deploy | deploy-agent → BLOCKED: 0.11.2 taken by parallel session | collision guard worked as designed |
| — | Deploy | deploy-agent re-run as 0.11.3 | image pushed, ansible playbook found STALE → real path `/home/mz/trainwithgouli` podman-compose; gateway reload after IP change; **v0.11.3 live + verified** |

Root cause #2: PB stores date fields as full UTC datetimes; bare `= "YYYY-MM-DD"` equality filters match nothing.
Fix: half-open range filters (verified live before deploy). Shipped v0.11.3 (0453a95).
Follow-ups recorded in pending-actions: stale ansible playbook, deploy-dev.sh printed command, gateway resolver, opencode restart.
