# Deployment Status: TrainWithGouli Dev

**Date**: 2026-06-19
**Environment**: dev
**Version**: 0.2.0
**Image**: docker.io/muzammilmomin/trainwithgouli:frontend-v0.2.0
**Domain**: https://trainwithgouli.mzm.co.in

## Deployment Steps Completed

1. ✅ Built Docker image locally with Orb Stack
2. ✅ Pushed image to Docker Hub
3. ✅ Ensured `trainwithgouli` Podman network exists on dev
4. ✅ Copied `deploy/docker-compose.yml` to `dev:~/trainwithgouli/`
5. ✅ Started `trainwithgouli-frontend-next` container on dev
6. ✅ Enabled nginx gateway routing for `trainwithgouli.mzm.co.in`
7. ✅ Tested nginx config and reloaded gateway

## Verification

- Container status: `Up 39 seconds (healthy)`
- Health check: `healthy`
- Gateway internal test: Returns TrainWithGouli homepage HTML with HTTP 200

## Known Issues

- Next.js build shows deprecation warning: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- Supabase migrations have not been applied yet; auth and database features will not work until migrations are run
- Backend services (static, backend) are not deployed

## Next Steps

- Apply Supabase migrations
- Optionally fix Next.js middleware deprecation
- Deploy to production (requires approval)
- Merge feature branch to main (requires approval)
