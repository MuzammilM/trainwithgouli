# Deployment Status — fix-today-plan-not-visible-20260919

| Field | Value |
|---|---|
| agent | deploy-agent |
| status | **SUCCESS** |
| environment | dev |
| version | 0.11.3 |
| image | `docker.io/muzammilmomin/trainwithgouli:frontend-v0.11.3` |
| image digest | `sha256:a2cd2ad85794c4ec3561ab223fba54e7c7466eaf4f0cc9460fef158141e30df8` |
| release commit | `0453a95 release: 0.11.3 — PB date range filters` (pushed `8fc212b..0453a95`) |
| live URL | https://trainwithgouli.mzm.co.in |
| live badge | **v0.11.3** |
| last_updated | 2026-09-19 |

## Pre-flight (state re-check)

- `git fetch` + `status -sb`: `## main...origin/main`, clean (only untracked `tasks/*`).
- HEAD == origin/main == `8fc212b` — contains the PB date-range fix ✓
- `version.js` was `0.11.2`; `frontend-v0.11.3` absent on Docker Hub → free ✓

## Steps executed

1. **Version bump** — `version.js` `0.11.2 → 0.11.3` + prepended history
   `{ version: '0.11.3', date: '2026-09-19', description: 'PB date range filters — /today-client day lookup + saveDaySheet upsert' }`.
   Commit `0453a95`, pushed to origin/main.
2. **Build + push** — `deploy/frontend/next/deploy-dev.sh` → `frontend-v0.11.3` + `frontend-latest` pushed to Docker Hub.
   (Script printed `deploy_version=undefined` — see Caveats; build tag itself was correct.)
3. **Deploy** — Ansible playbook path is **stale** (see Caveats). Deployed via the real dev mechanism:
   `ssh dev` → `/home/mz/trainwithgouli` → `VERSION=0.11.3 podman-compose up -d frontend-next`.
   Only `frontend-next` recreated (`static`/`backend` excluded, as they are not running).
4. **Gateway** — container IP moved `10.89.3.29 → 10.89.3.30`; dev gateway uses a static
   upstream so it 502'd. Reloaded nginx (`nginx -t && nginx -s reload`) — **config unchanged, no routing change** → 200.
5. **Verify** — all green (below).

## Verification

| Check | Result |
|---|---|
| `trainwithgouli-frontend-next` | `frontend-v0.11.3`, Up (healthy) |
| `https://trainwithgouli.mzm.co.in/` | HTTP 200 |
| `https://trainwithgouli.mzm.co.in/today-client` | HTTP 200 (no 502) |
| Live version badge | **v0.11.3** |
| Other projects (smarann, manakeeshhub, gateway) | unchanged, healthy |
| PocketBase (dev02) | untouched |
| Backend / static builds | none (frontend-only) |

## Caveats / follow-ups

1. **Ansible playbook is stale and unusable for dev.** `playbooks/deploy.yml` +
   `inventory/dev.yml` target `/opt/trainwithgouli` with `become: false` → fails at
   "Ensure deployment directory exists" (permission denied; user `mz` can't create `/opt`).
   It also deploys an `nginx-proxy.conf` topology that conflicts with the shared
   `nginx-gateway`. The **actual** dev deploy is `/home/mz/trainwithgouli` (repo
   `deploy/docker-compose.yml`, identical hash) run as `podman-compose up -d frontend-next`.
   Recommend updating inventory/role to `/home/mz/trainwithgouli` + frontend-next-only.
2. `deploy/frontend/next/deploy-dev.sh` prints `deploy_version=undefined` — its
   `node -e "require(version.js).VERSION"` extraction fails (module shape), so its
   printed Ansible command is wrong. `scripts/frontend/next/build-docker.sh` (grep-based)
   tags correctly. Recommend fixing the deploy-dev.sh extraction.
3. Dev gateway static upstream requires a reload after every `frontend-next` recreate.
   Consider `resolver` + variable `proxy_pass` in `env/dev/conf.d/trainwithgouli.conf`
   to avoid 502 windows.

## Actions NOT taken

- No `.env` / env-file reads.
- No backend or static image builds.
- No PocketBase restart/touch.
- No gateway config/routing change (reload only, config unmodified).
