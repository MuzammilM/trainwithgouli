---
agent: deploy-agent
task_id: feature-fuzzy-exercise-picker-20260926
current_phase: "Phase 5: Status Report"
status: "completed"
last_updated: 2026-09-26T02:49:00Z
environment: dev
version: 0.12.4
image_tag: "docker.io/muzammilmomin/trainwithgouli:frontend-v0.12.4"
deployed_url: https://trainwithgouli.mzm.co.in
verification_passed: true
---

# Deployment Status — feature-fuzzy-exercise-picker-20260926

## Result: ✅ DEPLOYED (dev / server01)

Supersedes the earlier BLOCKED note (that run was blocked on a `prod` target that
does not exist). User confirmed dev is the only app host and authorized the deploy.

## Summary

| Item | Value |
|---|---|
| Deployed version | **0.12.4** |
| Image tag | `docker.io/muzammilmomin/trainwithgouli:frontend-v0.12.4` (digest `sha256:a111eef3e845457ed38dd0b7983a98e59773105955913eaad762ee879597161d`) |
| Platform | `linux/amd64` (verified via `docker image inspect`) |
| Container | `trainwithgouli-frontend-next` — Up, **healthy**, image `frontend-v0.12.4` |
| Live URL | https://trainwithgouli.mzm.co.in — HTTP 200 |
| Version badge | `v0.12.4` (page HTML) |
| Routes | `/` 200, `/days` 200, `/today-coach` 200 |
| Gateway | `nginx-gateway` `nginx -t` ok + `nginx -s reload` fired (upstream IP refresh) |
| Impact on other projects | None — manakeeshhub/smarann containers untouched |

## Actions performed

1. Sanity check: local `version.js` = origin/main = live badge = **0.12.3**. Passed.
2. Bumped repo-root `version.js` to 0.12.4 (VERSION + VERSION_HISTORY entry dated
   2026-09-26, "ExercisePicker: fuzzy search combobox in day builder").
3. Commit `32798d2` `release: 0.12.4` pushed to `origin/main` (`9f05936..32798d2`).
4. `scripts/frontend/next/build-docker.sh --push` → built + pushed `frontend-v0.12.4`
   and `frontend-latest`.
5. `ssh dev` → `podman pull docker.io/muzammilmomin/trainwithgouli:frontend-v0.12.4`.
6. `ssh dev 'cd /home/mz/trainwithgouli && VERSION=0.12.4 podman-compose up -d frontend-next'`
   → recreated container on `frontend-v0.12.4`.
7. Gateway reload: `podman exec nginx-gateway nginx -t && podman exec nginx-gateway nginx -s reload`
   → syntax ok, signal accepted.
8. Verified container health = `healthy`; live HTTP 200; badge `v0.12.4`; routes 200.

## Notes / issues

- Entry point used the proven mechanism (repo-root `version.js` bump →
  `build-docker.sh --push` → `podman-compose up -d frontend-next` + gateway reload),
  NOT `infra/ansible/playbooks/deploy.yml` (stale / `deploy_dir=/opt/trainwithgouli`
  does not exist on the host; live working_dir is `/home/mz/trainwithgouli`).
- `deploy/deploy-lock.sh` still does not exist in this repo — no lock available.
- `https://trainwithgouli.mzm.co.in/version.js` returns 404 (Next.js does not serve
  that path); version is verified via the footer badge in page HTML.
- Unrelated `.opencode/agents/*.md` local modifications were left untouched.
- No `.env` files accessed. Compose used its existing `frontend.env` (not read by us).

## Rollback

Redeploy the previous image:
```
ssh dev 'cd /home/mz/trainwithgouli && VERSION=0.12.3 podman-compose up -d frontend-next'
ssh dev 'podman exec nginx-gateway nginx -s reload'
```
