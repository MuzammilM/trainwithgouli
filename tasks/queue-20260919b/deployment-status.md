# Deployment Status — queue-20260919b

| Field | Value |
|---|---|
| agent | deploy-agent |
| status | **SUCCESS** |
| environment | dev |
| version | 0.12.0 (minor — features) |
| image | `docker.io/muzammilmomin/trainwithgouli:frontend-v0.12.0` |
| image digest | `sha256:dea2d292e3d96fe731e27663a904797b97c0db88dad6adc8d0de6039a05d2e6b` |
| release commit | `a5423b2 release: 0.12.0 — queue 2026-0919b UI batch` (pushed `9b57c1e..a5423b2`) |
| live URL | https://trainwithgouli.mzm.co.in |
| live badge | **v0.12.0** |
| gateway reload | **yes** (config unmodified) |
| last_updated | 2026-09-20 |

## Pre-flight

- `git fetch` → HEAD == origin/main == `9b57c1e`, tree clean (only untracked `tasks/*`).
- All 5 queue commits present as ancestors of HEAD: `14bff9a`, `15d32ec`, `914ba04`, `9b57c1e`, `e1525c3`.
- `version.js` was `0.11.3`; `frontend-v0.12.0` absent on Docker Hub → free.

## Steps executed

1. **Version bump** — `version.js` `0.11.3 → 0.12.0` + prepended history entry:
   `{ version: '0.12.0', date: '2026-09-20', description: 'Queue 2026-0919b: /days date fix, per-set checkboxes + R: reps chip, circuit highlight, DayBuilder sets radio + reps slider' }`.
   Commit `a5423b2`, pushed origin/main.
2. **Build + push** — `deploy/frontend/next/deploy-dev.sh` → `frontend-v0.12.0` + `frontend-latest` pushed
   (digest `sha256:dea2d292…`). Script still prints `Version: undefined` — cosmestic; `build-docker.sh` tagged correctly.
3. **Deploy** — `ssh dev` → `/home/mz/trainwithgouli` → `VERSION=0.12.0 podman-compose up -d frontend-next`.
   Only `frontend-next` recreated (`static`/`backend` skipped).
4. **Gateway** — container IP moved `10.89.3.30 → 10.89.3.31`; dev gateway static upstream → 502.
   Reloaded nginx (`nginx -t && nginx -s reload`) — **config unmodified, no routing change** → 200.
5. **Verify** — all green.

## Verification

| Check | Result |
|---|---|
| `trainwithgouli-frontend-next` | `frontend-v0.12.0`, Up (healthy) |
| `https://trainwithgouli.mzm.co.in/` | HTTP 200 |
| `https://trainwithgouli.mzm.co.in/today-client` | HTTP 200 |
| Live version badge | **v0.12.0** |
| Neighbors (smarann, manakeeshhub, nginx-gateway) | unaffected, healthy |
| PocketBase (dev02) | untouched |
| Backend / static builds | none (frontend-only) |

## Gateway reload detail

Two container recreates on this host both changed the `frontend-next` IP. The dev gateway
(`env/dev/conf.d/trainwithgouli.conf`) uses a static `upstream { server trainwithgouli-frontend-next:3000; }`
resolved at config-load, so a reload is required after each recreate. Reload used the existing
config only — no routing/config change. Recurring footgun; recommend `resolver` + variable `proxy_pass`.

## Actions NOT taken

- No `.env` / env-file reads.
- No backend or static image builds.
- No PocketBase touch.
- No gateway config change (reload only).
