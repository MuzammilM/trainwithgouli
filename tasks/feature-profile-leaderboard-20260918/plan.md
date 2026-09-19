# P5+P6: Profile/hardening + Leaderboard — feature-profile-leaderboard-20260918

## Schema (done by orchestrator on dev02)
- users.mobile (text, optional); users rules: list/view = self or coach; update = self
- CONSEQUENCE: client-role users can no longer enumerate users — pages must not rely on user-token users.getFullList for other users' data; use graceful fallbacks or the service client server-side

## P5 scope
1. /profile page: edit name + mobile (server action, self-update), prefilled, save + status. Nav: user name links to /profile.
2. addClient (lib/actions/clients.ts): after sheet verification, ALSO create users record for the client email if none exists (role client, verified true, random password) — fixes OAuth2 login permanently.
3. /clients list: show client name + mobile (resolved via service client by email, coaches only anyway).

## P6 scope
1. lib/google/sheets.ts: parseWeightKg(raw): null unless string is a clean number/range+optional kg ("60kg", "12.5kg", "12.5-15 kg"→max); EXCLUDE anything containing "bar" (case-insens), BW, M, steps, sec, etc.
2. /leaderboard page (auth required): service client aggregates ALL clients records → fetchClientHistory per sheet (existing cache) → entries {displayName, exercise, weightKg, weightRaw, date} with parseable weights only → exercise filter (All + distinct names) → top 20 by kg desc, ties by date. Display name: users.name or email local-part (service client lookup). IRON/RED table, ranked rows (# / lifter / exercise / weight / date).
3. Nav: "Leaderboard" link for all authenticated users.
