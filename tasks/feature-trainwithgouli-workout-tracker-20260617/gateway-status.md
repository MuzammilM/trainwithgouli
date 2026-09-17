# Gateway Status: TrainWithGouli Dev Enablement

**Date**: 2026-06-19
**Environment**: dev
**Domain**: trainwithgouli.mzm.co.in
**Upstream**: trainwithgouli-frontend-next:3000

## Changes Made

1. Updated `~/workspace/nginx-gateway/env/dev/conf.d/trainwithgouli.conf`:
   - Changed upstream from `trainwithgouli-static:8080` to `trainwithgouli-frontend-next:3000`
   - Removed backend upstreams (not yet deployed)
   - Simplified location blocks for Next.js frontend

2. Removed `~/workspace/nginx-gateway/env/dev/disabled/trainwithgouli.conf`

3. Synced gateway config to dev server at `/opt/nginx-gateway/`

4. Tested nginx config: `nginx -t` passed

5. Reloaded nginx gateway: `ENV=dev podman-compose exec nginx nginx -s reload`

## Verification

- Container `trainwithgouli-frontend-next` is healthy on dev
- Gateway successfully routes `Host: trainwithgouli.mzm.co.in` to the Next.js app
- Returns 200 with TrainWithGouli homepage HTML

## Notes

- Gateway container mounts from `/opt/nginx-gateway/`, not `~/nginx-gateway/`
- Initial sync to `~/nginx-gateway/` was incorrect; corrected to `/opt/nginx-gateway/`
