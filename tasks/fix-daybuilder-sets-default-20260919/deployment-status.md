# Deployment Status — fix-daybuilder-sets-default-20260919

| Field | Value |
|---|---|
| agent | deploy-agent |
| status | **SUCCESS** |
| environment | dev |
| version | 0.12.1 (patch — bugfix) |
| image | `docker.io/muzammilmomin/trainwithgouli:frontend-v0.12.1` |
| image digest | `sha256:c3663fa9b095747da826494b88a7001b9c64c0ec3d7705426c2c8273cff816d0` |
| release commit | `cb2f0fd release: 0.12.1 — DayBuilder sets default fix` (pushed `0b1de15..cb2f0fd`) |
| live URL | https://trainwithgouli.mzm.co.in |
| live badge | **v0.12.1** |
| gateway reload | **yes** (config unmodified) |
| last_updated | 2026-09-20 |

## Pre-flight

- `git fetch` → HEAD == origin/main == `0b1de15`, tree clean (only untracked `tasks/*`).
- `0b1de15` (DayBuilder sets hidden-input fix) confirmed present as ancestor of HEAD.
- `version.js` was `0.12.0`; `frontend-v0.12.1` absent on Docker Hub → free.

## Steps executed

1. **Version bump** — `version.js` `0.12.0 → 0.12.1` + prepended history entry:
   `{ version: '0.12.1', date: '2026-09-20', description: 'DayBuilder sets fix — hidden input per row, no more defaulting to 1' }`.
   Commit `cb2f0fd`, pushed origin/main.
2. **Build + push** — `deploy/frontend/next/deploy-dev.sh` → `frontend-v0.12.1` + `frontend-latest`
   (digest `sha256:c3663fa9…`). Script's `Version: undefined` line is cosmetic; `build-docker.sh` tagged correctly.
3. **Deploy** — `ssh dev` → `/home/mz/trainwithgouli` → `VERSION=0.12.1 podman-compose up -d frontend-next`.
   Only `frontend-next` recreated (`static`/`backend` skipped).
4. **Gateway** — container IP moved `10.89.3.31 → 10.89.3.32`; static upstream → 502.
   Reloaded nginx (`nginx -t && nginx -s reload`) — **config unmodified, no routing change** → 200.
5. **Verify** — all green.

## Verification

| Check | Result |
|---|---|
| `trainwithgouli-frontend-next` | `frontend-v0.12.1`, Up (healthy) |
| `https://trainwithgouli.mzm.co.in/` | HTTP 200 |
| `https://trainwithgouli.mzm.co.in/today-coach` | HTTP 200 |
| Live version badge | **v0.12.1** |
| Neighbors (smarann, manakeeshhub, nginx-gateway) | unaffected, healthy |
| PocketBase (dev02) | untouched |
| Backend / static builds | none (frontend-only) |

## Gateway reload detail

The dev gateway (`env/dev/conf.d/trainwithgouli.conf`) uses a static
`upstream { server trainwithgouli-frontend-next:3000; }` resolved at config-load, so a reload is
required after each `frontend-next` recreate. Reload used the existing config only — no
routing/config change. Recommend `resolver` + variable `proxy_pass` to remove the 502 window.

## Actions NOT taken

- No `.env` / env-file reads.
- No backend or static image builds.
- No PocketBase touch.
- No gateway config change (reload only).
