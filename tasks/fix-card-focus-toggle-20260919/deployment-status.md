# Deployment Status — fix-card-focus-toggle-20260919

| Field | Value |
|---|---|
| agent | deploy-agent |
| status | **SUCCESS** |
| environment | dev |
| version | 0.12.3 (patch — bugfix) |
| image | `docker.io/muzammilmomin/trainwithgouli:frontend-v0.12.3` |
| image digest | `sha256:779467329b7c15e77beaea0a51656e603b108183d4e54c196549dbf1f81e1cb9` |
| release commit | `e6977cb release: 0.12.3 — card focus fix` (pushed `cffa1f5..e6977cb`) |
| live URL | https://trainwithgouli.mzm.co.in |
| live badge | **v0.12.3** |
| gateway reload | **yes** (config unmodified) |
| last_updated | 2026-09-20 |

## Pre-flight

- `git fetch` → HEAD == origin/main == `cffa1f5`, tree clean (only untracked `tasks/*`).
- `cffa1f5` (card tap sets focus, whole card clickable) confirmed present as ancestor of HEAD.
- `version.js` was `0.12.2`; `frontend-v0.12.3` absent on Docker Hub → free.

## Steps executed

1. **Version bump** — `version.js` `0.12.2 → 0.12.3` + prepended history entry:
   `{ version: '0.12.3', date: '2026-09-20', description: 'Card tap sets focus instead of toggling — whole card clickable' }`.
   Commit `e6977cb`, pushed origin/main.
2. **Build + push** — `deploy/frontend/next/deploy-dev.sh` → `frontend-v0.12.3` + `frontend-latest`
   (digest `sha256:77946732…`). Script's `Version: undefined` line is cosmetic; `build-docker.sh` tagged correctly.
3. **Deploy** — `ssh dev` → `/home/mz/trainwithgouli` → `VERSION=0.12.3 podman-compose up -d frontend-next`.
   Only `frontend-next` recreated (`static`/`backend` skipped).
4. **Gateway** — container IP moved `10.89.3.33 → 10.89.3.34`; static upstream → 502.
   Reloaded nginx (`nginx -t && nginx -s reload`) — **config unmodified, no routing change** → 200.
5. **Verify** — all green.

## Verification

| Check | Result |
|---|---|
| `trainwithgouli-frontend-next` | `frontend-v0.12.3`, Up (healthy) |
| `https://trainwithgouli.mzm.co.in/` | HTTP 200 |
| `https://trainwithgouli.mzm.co.in/today-client` | HTTP 200 |
| Live version badge | **v0.12.3** |
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
