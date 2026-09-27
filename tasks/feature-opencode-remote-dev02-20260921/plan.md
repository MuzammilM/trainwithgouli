# Plan: opencode2 (v2) remote coding environment on dev02

Task ID: feature-opencode-remote-dev02-20260921
Mode: PLANNING ONLY (no execution authorized)
Canonical summary: coding/trainwithgouli/orchestrator-workflows/feature-opencode-remote-dev02-20260921/task-summary
Revision 3 (2026-09-21): locked — bind 0.0.0.0, Tailscale DNS hostname access, web dashboard client, providers deferred.

## dev02 survey (read-only, 2026-09-21)
- Ubuntu 24.04 LTS, 4× Xeon Gold 6138 @2GHz
- RAM: 7.8 GiB total, 2.0 used, **5.8 GiB available**, swap 0B
- Disk: 59G total, 13G used, **44G available (23%)**
- podman 4.9.3 + podman-compose 1.0.6; systemd --user running; ufw active (tailscale0-scoped rules)
- Existing: basic-memory :8000 (~1.3 GiB RSS), speaches (ubuntu), pocketbase :8080
- Missing: node/bun/opencode (not installed)
- uv 0.12.15, Python 3.12.3 present

## Resource verdict
- opencode server (Bun) ~100–300 MiB baseline → fits in 5.8 GiB available
- Watch item: no swap; add 2G swapfile if builds will run on dev02
- Disk ample; podman image growth is the long-term watch item

## Locked decisions (rev 3)
- Bind: 0.0.0.0 (all interfaces); reach via Tailscale MagicDNS hostname dev02.<tailnet>.ts.net
- Client: web dashboard over Tailscale
- Providers: deferred (user `/connect` later; never orchestrator)
- Firewall: ufw 4096/tcp on tailscale0 only (keeps 0.0.0.0 bind tailnet-reachable only)
- Basic auth: set at execution (confirm v2 support; fallback `opencode pair`)
- Binary: installer puts real binary at ~/.opencode/bin/opencode + legacy shim `opencode2` (execs opencode). Service invokes `opencode2` per user preference.

## Draft execution plan — opencode2 v2.0.6 (awaits "execute"/"implement")
- A. Install: 2G swapfile (default yes); `curl -fsSL https://opencode.ai/v2/install | bash` on dev02; verify 2.0.6
- B. Configure: dev02 basic-memory MCP at http://localhost:8000/mcp
- C. Runtime: systemd user service `opencode2 serve --hostname 0.0.0.0 --port 4096` (opencode2 = shim to v2 binary) + ufw 4096/tcp on tailscale0; basic auth at execution time
- D. Verify: health endpoint, /mcp status (basic-memory connected), web dashboard loads via Tailscale DNS
- E. Document: runbook in basic-memory; record ufw/service state

## Proposed defaults (if "execute" arrives without answers)
- Swapfile 2G: YES
- Repos: none for now
- Port: 4096 (confirm free at execution)
