---
name: pocketbase
description: Use when doing ANY task involving the self-hosted PocketBase dev backend — reading/writing data via its REST API or JS SDK, auth flows, schema/collection changes, backups, or ops on the dev02 instance. Covers dev-vs-prod switching (PocketBase dev, Supabase prod), the service-account pattern, and dev02 operational gotchas.
---

# PocketBase (self-hosted dev backend)

PocketBase is the **dev-only** backend for TrainWithGouli. Production uses Supabase.
Never suggest replacing the prod stack with PocketBase in implementation work without
explicit user approval.

## Instances

| Env | Backend | URL |
|---|---|---|
| dev | PocketBase (self-hosted, dev02) | `https://pocketbase.mzm.co.in` |
| prod | Supabase Cloud | (existing Supabase project) |

Dev is **Tailscale-only** (DNS resolves to dev02's Tailscale IP; UFW binds 80/443 to
tailscale0). If a request times out, the machine is likely off Tailscale — that is a
network issue, not a PocketBase outage.

URL map: admin UI at `/_/` (NOT `/` — root is an intentional 404), REST API at `/api/`.

## Accounts

- **Personal superuser**: `madebymzm@gmail.com` — human login only, never in code/automation.
- **Service superuser**: `pocketbase-service@mzm.co.in` — the PocketBase equivalent of a
  Supabase `service_role` key. Used by backend code, automation, and scripts.
  - Full read/write. **Never expose client-side** (browser bundles, `NEXT_PUBLIC_` vars).
  - Creds live on dev02 at `~/.config/pocketbase-backup/creds` (mode 600). For app
    deployments, inject via env vars (`POCKETBASE_SERVICE_EMAIL`, `POCKETBASE_SERVICE_PASSWORD`)
    — never hardcode, never commit.
  - Tokens: `POST /api/collections/_superusers/auth-with-password` → JWT, ~14 day default
    lifetime. Backend code should re-auth on 401, not cache a token forever.

## Code patterns (Next.js app)

Install: `npm i pocketbase`

```ts
// Server-side data access (Route Handlers, Server Components)
import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.POCKETBASE_URL); // dev: https://pocketbase.mzm.co.in
await pb.collection("_superusers").authWithPassword(
  process.env.POCKETBASE_SERVICE_EMAIL!,
  process.env.POCKETBASE_SERVICE_PASSWORD!,
);
const records = await pb.collection("trainers").getList(1, 20, { filter: "active = true" });
```

```ts
// Client-side: end-user auth, scoped to that user
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
await pb.collection("users").authWithPassword(email, password);
// pb.authStore.token / pb.authStore.model now carry the user
```

Dev/prod switching: a single `BackendAdapter` interface per feature (Supabase impl +
PocketBase impl) selected by `NEXT_PUBLIC_BACKEND=supabase|pocketbase`. Keep SDK calls
out of components — behind the adapter only.

## Critical differences from Supabase (where agents go wrong)

1. **No SQL migrations.** Schema = "collections" managed via admin UI (`/_/`) or the
   Collections API. There is no `supabase/migrations/` equivalent — when changing schema,
   document the collection shape in the task summary, and apply it via the Collections API
   or instruct the user to use the admin UI. Field types: `text`, `number`, `bool`,
   `date`, `select`, `file`, `relation`, `json`, `email`, `url`, `editor`, `autodate`.
2. **API rules instead of RLS.** Each collection has list/view/create/update/delete rules
   (e.g. `@request.auth.id != ""`). Default for new collections is **admin-only** — a
   common bug is "401 on everything" because rules weren't opened up.
3. **No `service_role` key concept** — auth is always as some account (see Accounts).
4. **Phone OTP is not built in** (unlike Supabase GoTrue). It requires a custom hook
   calling an SMS provider. Do not promise phone-OTP parity in dev without building that hook.
5. **Realtime**: `pb.collection("x").subscribe("*", cb)` over websockets — works through
   the nginx gateway (Upgrade headers already configured).
6. **File uploads**: `pb.collection("x").create({ fileField: new FormData... })` — files
   live in `/pb_data/storage/`, served at `/api/files/<collection>/<recordId>/<filename>`.

## Ops on dev02 (SSH: `ssh dev02`, rootless user `mz`)

| Piece | Location |
|---|---|
| Container | `pocketbase` (Podman, `localhost/pocketbase:0.40.4`) |
| Quadlet | `~/.config/containers/systemd/pocketbase.container` (linger on, Restart=always) |
| Data volume | `pocketbase-data` → `/pb_data` |
| Podman network | `pocketbase` (nginx-gateway is also attached — that's how the gateway reaches it) |
| Gateway config | `/opt/nginx-gateway/env/dev02/conf.d/pocketbase.conf` |
| Backups | `~/pocketbase-backup.sh` + `pocketbase-backup.timer` (nightly 03:30 UTC, keeps last 14) |

### Gotchas (learned the hard way — respect these)

- **The image is `FROM scratch`: NO shell.** `podman exec pocketbase ls` fails. Inspect
  data via the volume mountpoint on the host: `~/.local/share/containers/storage/volumes/pocketbase-data/_data`.
- **Backup API names must end in `.zip`** — otherwise 400 `validation_match_invalid`.
  Backups land in `/pb_data/backups/<name>.zip` (+ `.attrs` sidecar); delete both on cleanup.
- **Select-field `default` is silently stripped by the Collections API (0.40.4).** A required select with no working default breaks OAuth2 auto-create ("Failed to authenticate" 400, log shows `failed to save linked rel ... Value must be unique`). Keep fields that OAuth2 auto-create must pass **optional** and treat empty/missing as the client case in app code (2026-09-17: `users.role` made optional for this reason).
- **Collections created via the API have NO default fields.** Admin-UI creation gives you `created`/`updated` autodate fields automatically; API creation gives you nothing extra — sorting by `-created` then fails with an opaque 400 "Something went wrong while processing your request". Always add `{name:"created",type:"autodate",onCreate:true,onUpdate:false}` + `{name:"updated",type:"autodate",onCreate:true,onUpdate:true}` explicitly.
- **FROM scratch = no CA certs.** Outbound HTTPS to real providers (e.g. Google `oauth2.googleapis.com/token` during OAuth2 login) fails with `x509: certificate signed by unknown authority`. Fix: quadlet mounts `/etc/ssl/certs:/etc/ssl/serts:ro` — see `pocketbase.container` `Volume=/etc/ssl/certs:/etc/ssl/certs:ro` (added 2026-09-17). Restarting PocketBase changes the container IP → reload the nginx gateway or you get 502s.
- **Docker Hub is unreachable/rate-limited from dev02.** To upgrade PocketBase: download
  the linux_amd64 zip from GitHub releases, replace the binary in `~/pocketbase-build/`,
  `podman build -t localhost/pocketbase:<ver> .`, update the quadlet image tag,
  `systemctl --user daemon-reload && systemctl --user restart pocketbase`.
- Gateway backends must share a Podman network with `nginx-gateway`; loopback-published
  ports are NOT reachable from the gateway container.
- TLS: Let's Encrypt DNS-01 via GoDaddy (`sudo certbot --authenticator dns-godaddy ...`);
  renewal hook `/etc/letsencrypt/renewal-hooks/deploy/copy-certs-to-gateway.sh` copies
  certs and reloads nginx.

### Quick admin API cheat sheet

```bash
BASE=https://pocketbase.mzm.co.in
TOKEN=$(curl -sf -X POST $BASE/api/collections/_superusers/auth-with-password \
  -H 'Content-Type: application/json' \
  -d "{\"identity\":\"$PB_SERVICE_EMAIL\",\"password\":\"$PB_SERVICE_PASSWORD\"}" | jq -r .token)

curl -sf "$BASE/api/collections/trainers/records" -H "Authorization: $TOKEN"
curl -sf -X POST "$BASE/api/backups" -H "Authorization: $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"manual_'"$(date +%F_%H%M)"'.zip"}'
```

Full API docs: `https://pocketbase.mzm.co.in/api/` (auto-generated by PocketBase) or
https://pocketbase.io/docs.
