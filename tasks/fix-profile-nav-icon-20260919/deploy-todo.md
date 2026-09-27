# Deploy Agent — fix-profile-nav-icon-20260919

Environment: **dev** (SSH `dev` / server01, Tailscale 100.73.187.82). prod/prod01 aliases STALE.

> NOTE: This session has no `todowrite` tool and the repo has no `deploy/deploy-lock.sh` or
> `deploy/bump-rel.sh` (REL flow not present). Checklist mirrored here instead. Deploy lock N/A.
> NOTE: `deploy/frontend/next/deploy-dev.sh` + `infra/ansible/playbooks/deploy.yml` are STALE
> (deploy_dir `/opt/trainwithgouli` does not exist; playbook targets a 3-service stack + own nginx).
> Real mechanism = queue-20260917 notes: build+push image, then on dev
> `cd ~/trainwithgouli && VERSION=X.Y.Z podman-compose up -d frontend-next`, then reload gateway.

## Checklist

- [x] Phase 1: Environment Confirmation — dev (prod aliases stale, do not use)
- [x] Phase 2: Pre-Deployment Checks — docker OK, version 0.11.2, image built/pushed amd64
- [x] Phase 3: Deployment Execution — commit d436333 → image frontend-v0.11.2 → container recreated → gateway reloaded
- [x] Phase 4: Post-Deployment Verification — container healthy; live badge 0.11.2; /profile 200
- [x] Phase 5: Status Report — deployment-status written to basic-memory

## Key Variables
- version: 0.11.2 (from 0.11.1, fix → patch)
- image: docker.io/muzammilmomin/trainwithgouli:frontend-v0.11.2
- container: trainwithgouli-frontend-next
- gateway: nginx-gateway (env/dev, conf.d/trainwithgouli.conf, upstream trainwithgouli-frontend-next:3000)
- url: https://trainwithgouli.mzm.co.in
