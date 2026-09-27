# Deployment Status — feature-multi-circuit-20260919

| Field | Value |
|---|---|
| agent | deploy-agent |
| status | **SUCCESS** |
| environment | dev |
| version | 0.12.2 (patch — small feature) |
| image | `docker.io/muzammilmomin/trainwithgouli:frontend-v0.12.2` |
| image digest | `sha256:5355d2a10d42dd048e0aaa7a6650da1c233523a981ab63bfda0bdc1b0762a7b4` |
| release commit | `4f5c1a3 release: 0.12.2 — multi-exercise circuits` (pushed `c1e51c6..4f5c1a3`) |
| live URL | https://trainwithgouli.mzm.co.in |
| live badge | **v0.12.2** |
| gateway reload | **yes** (config unmodified) |
| last_updated | 2026-09-20 |

## Pre-flight

- `git fetch` → HEAD == origin/main == `c1e51c6`, tree clean (only untracked `tasks/*`).
- `c1e51c6` (circuits of 3+ / GROUP WITH NEXT) confirmed present as ancestor of HEAD.
- `version.js` was `0.12.1`; `frontend-v0.12.2` absent on Docker Hub → free.

## Steps executed

1. **Version bump** — `version.js` `0.12.1 → 0.12.2` + prepended history entry:
   `{ version: '0.12.2', date: '2026-09-20', description: 'Circuits of 3+ — GROUP WITH NEXT absorbs into an existing circuit' }`.
   Commit `4f5c1a3`, pushed origin/main.
2. **Build + push** — `deploy/frontend/next/deploy-dev.sh` → `frontend-v0.12.2` + `frontend-latest`
   (digest `sha256:5355d2a1…`). Script's `Version: undefined` line is cosmetic; `build-docker.sh` tagged correctly.
3. **Deploy** — `ssh dev` → `/home/mz/trainwithgouli` → `VERSION=0.12.2 podman-compose up -d frontend-next`.
   Only `frontend-next` recreated (`static`/`backend` skipped).
4. **Gateway** — container IP moved `10.89.3.32 → 10.89.3.33`; static upstream → 502.
   Reloaded nginx (`nginx -t && nginx -s reload`) — **config unmodified, no routing change** → 200.
5. **Verify** — all green.

## Verification

| Check | Result |
|---|---|
| `trainwithgouli-frontend-next` | `frontend-v0.12.2`, Up (healthy) |
| `https://trainwithgouli.mzm.co.in/` | HTTP 200 |
| `https://trainwithgouli.mzm.co.in/today-client` | HTTP 200 |
| Live version badge | **v0.12.2** |
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
