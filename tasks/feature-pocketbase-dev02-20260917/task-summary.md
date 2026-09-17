# PocketBase on dev02 — Setup Summary

**Task ID**: feature-pocketbase-dev02-20260917
**Date**: 2026-09-17
**Status**: completed
**DO NOT COMMIT THIS FILE** — contains live credentials (kept local-only).

## Access

- **URL**: https://pocketbase.mzm.co.in (admin UI at `/_`)
- **Network**: Tailscale-only (UFW: 80/443 bound to tailscale0; DNS resolves to dev02 Tailscale IP 100.88.224.55)
- **Superuser (personal)**: `madebymzm@gmail.com`
- **Password**: `xyl4PKJoC5RkXnUFD9SG`
- **Service superuser (app/automation)**: `pocketbase-service@mzm.co.in`
- **Service password**: `zKe3mkdgasY2uRPaV8fV` — backup script and any backend integration should use THIS account, not the personal one (creds live on dev02 at `~/.config/pocketbase-backup/creds`, mode 600)
- **PB_ENCRYPTION_KEY** (on dev02, in quadlet): `c1a43b4bcf7cdac5caac3fcd3a533bec20ea6eac555d8d670deccc83e7551de9`

## Deployment (dev02, rootless podman as user `mz`)

| Piece | Location |
|---|---|
| Image | Built locally: `localhost/pocketbase:0.40.4` (scratch + static binary from GitHub releases; sha256 `14ec215b…`) — Docker Hub pulls were blocked on this network, so the binary was fetched from GitHub and built on-host |
| Quadlet | `~/.config/containers/systemd/pocketbase.container` (linger enabled, auto-restart) |
| Data volume | `pocketbase-data` → `/pb_data` (mountpoint `~/.local/share/containers/storage/volumes/pocketbase-data/_data`) |
| Host port | `127.0.0.1:8090` → 8080 (local-only; backup script uses it) |
| Podman network | `pocketbase` (gateway + pocketbase both attached) |

## Backups

- Script: `~/pocketbase-backup.sh` (rootless user `mz`), authenticates as service superuser `pocketbase-service@mzm.co.in`
- Timer: `pocketbase-backup.timer` — nightly 03:30 UTC, `Persistent=true`
- Method: PocketBase admin API `POST /api/backups` (name MUST end in `.zip`)
- Storage: `/pb_data/backups/` (inside named volume); retention: last 14
- Verified: manual run produced `auto_2026-09-17_0730.zip` ✓

## Gateway (nginx-gateway container on dev02)

- Config: `/opt/nginx-gateway/env/dev02/conf.d/pocketbase.conf` (host volume → container)
- Pattern copied from `speaches.conf`; `proxy.conf` include already carries websocket headers
- TLS: Let's Encrypt DNS-01 via GoDaddy plugin (`certbot --authenticator dns-godaddy`)
- Renewal hook updated: `/etc/letsencrypt/renewal-hooks/deploy/copy-certs-to-gateway.sh` now copies both speaches + pocketbase certs and reloads nginx

## Verification (all ✓)

- `https://pocketbase.mzm.co.in/api/health` → 200
- Admin UI `/_/` → 200
- Superuser auth → 200
- HTTP→HTTPS redirect → 301
- Backup end-to-end → zip created, retention works
- Container restart policy: `Restart=always`, linger on

## Notes / gotchas for future ops

1. `FROM scratch` image has NO shell — never `podman exec` into it expecting `sh`/`ls`; inspect data via the named volume mountpoint on the host.
2. Backup API name must end in `.zip` or it 400s with `validation_match_invalid`.
3. Docker Hub is unreachable/rate-limited from dev02 and the local Mac — GitHub-release-binary → local build is the workaround used here.
4. Gateway backends must share a podman network with nginx-gateway; loopback-published ports are NOT reachable from the gateway container.
5. certbot on dev02 requires `sudo -n`; GoDaddy DNS creds at `/etc/letsencrypt/godaddy.ini`.
