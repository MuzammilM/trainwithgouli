# Execution Log — feature-opencode-remote-dev02-20260921

| Time (UTC) | Step | Action | Result |
|---|---|---|---|
| 11:20 | 0-4 | Planning phases: dev02 survey, opencode2 research, plan + 2 revision rounds, execute authorization | task-summary persisted |
| 14:36 | 5.1 | Mac reference: `tailscale serve status` = `https://device01.taild68ded.ts.net → proxy http://localhost:4096` (opencode v1.18.31 serve, 0.0.0.0:4096) | reference captured |
| 14:37 | 5.2 | Swapfile: /swapfile 2G (fallocate, mkswap, swapon, fstab) | ✅ Swap 2.0Gi |
| 14:37 | 5.3 | `curl -fsSL https://opencode.ai/v2/install \| bash` | ✅ opencode v2.0.12 + opencode2 shim at ~/.opencode/bin |
| 14:39 | 5.4 | ~/.config/opencode/opencode.json (mcp.servers.basic-memory, remote, oauth:false) | config written |
| 14:39 | 5.5 | systemd user service opencode2.service (serve --hostname 0.0.0.0 --port 4096, Restart=always, linger) | ✅ active/enabled, ~119 MiB |
| 14:40 | 5.6a | ufw `allow in on tailscale0 to any port 4096 proto tcp` | ✅ rules 8/12 |
| 14:40 | 5.6b | `sudo tailscale set --operator=mz`; `tailscale serve --bg http://localhost:4096` | ✅ https://dev02.taild68ded.ts.net → localhost:4096 (tailnet only) |
| 14:41 | 5.7 | Mac→dev02 checks: :8000→400, :4096→401 (tailnet path OK); https DNS name → 000 | partial |
| 14:44 | 5.7 | Diagnosis: tailscaled netstack serve (invisible in ss); ACME dns-01 "invalid" ×5 → LE failed-validation rate limit suspected; tailscaled 1.102.2 old | pending self-heal ~1h |
| 14:49 | 5.4-fix | Removed invalid `enabled` field; restart; verified MCP via authenticated GET /api/mcp | ✅ basic-memory "connected" |
| 14:52 | 6 | Learning note + pending-actions + task-summary finalized | ✅ |

## Final state
- LIVE NOW: http://100.88.224.55:4096/ (web dashboard, basic-auth password in journal — rotates per restart)
- CONFIGURED, CERT PENDING: https://dev02.taild68ded.ts.net/ (ACME rate-limit window; retest ~16:00 UTC)
- Deferred by user: provider `/connect`

## Follow-up (2026-09-22 00:50 dev02 local): repos copied
- ~/code/{smarann,trainwithgouli,manakeeshhub} via brew rsync 3.5.0 -az (git included; build artifacts/.env excluded)
- Verified: git integrity OK, HEADs match Mac, no env/secret leakage
