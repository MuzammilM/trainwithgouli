# Learnings — feature-social-share-card-20260925

## 1. Subagent "looped"/"Task cancelled" = session issue, not reasoning
- code-research-agent cancelled ×2, UI Implementer cancelled ×1 on dispatch, then completed
  with an **empty result on success**.
- Handling that worked: (a) retry once; (b) if cancelled again, do the bounded work inline
  (orchestrator has Read/Grep/Bash); (c) NEVER trust an empty task_result — immediately
  `git status`/`git log` the worktree and review the diff before proceeding.
- Suspected trigger: opencode session/agent cache (cf. 2026-09-15 emoji-field learning).
  A full opencode restart is the documented fix; retry-after works when user declines restart.

## 2. bash tool PATH
- `npm`/`node` not on the bash tool's default PATH. Always
  `export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"` before npm/node/deploy scripts.
- deploy-dev.sh silently printed `deploy_version=undefined` when node was missing (build
  tags were still correct via its grep fallback, but the printed ansible command was wrong).

## 3. Dev-server deploy chain (shared rootless host)
Three latent issues broke EVERY dev deploy until fixed (commit eacc54a):
- inventory dev.yml deploy_dir=/opt/trainwithgouli → permission denied; real dir is
  /home/mz/trainwithgouli (matches the google_sa.json volume mount).
- Role used `playbook_dir/../../deploy/...` → resolves to infra/deploy (not found);
  must be `../../../deploy/`.
- Playbook "verify ≥2 containers" is wrong for shared-dev (1 frontend container; gateway
  is external). Verify via gateway curl instead.
- **After any podman-compose recreate, the shared nginx gateway needs
  `cd /opt/nginx-gateway && ENV=dev podman-compose exec nginx nginx -s reload`** — upstream
  container names resolve to IPs at config load; recreates get new IPs → 502.

## 4. Template-overlay UI: measure before implementing
For "background art + absolutely-positioned overlay" cards, measure the template
programmatically first (Pillow: find long horizontal red/white lines) and pin zone
coordinates to those measurements. The UI agent guessed zones wrong (table placed in the
footer zone); pixel measurements are the source of truth.

## 5. basic-memory MCP unavailable in orchestrator sessions here
Tools not exposed in the function catalog this session. Mirror task context to
./tasks/{task-id}/ only; re-check tool availability each session.

## 6. Next 16 redirect() behavior
redirect() in an async server page returns HTTP 200 + NEXT_REDIRECT RSC instruction for
document GETs (client performs navigation), NOT a 307. Verify auth gating by grepping the
HTML for NEXT_REDIRECT, not by status code.
