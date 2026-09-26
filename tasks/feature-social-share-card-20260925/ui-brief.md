# UI Brief — Daily Progress Share Card (/share/[date])

## Surface
Portrait 9:16 social share card (941×1672 design px) rendered as HTML over the
committed template art `public/share/card-template.png`, exported to PNG via
`modern-screenshot` at pixelRatio 2 (1882×3344).

## Register
Brand-flavored product surface: the CARD is a brand artifact (template art is the
source of truth for look/feel); the surrounding page chrome (controls, empty state)
follows the app's IRON/RED product register — border-2, uppercase, font-mono labels,
accent red for actions only.

## Template zone map (measured from the PNG, y in design px)
| Zone | Y range | Content |
|------|---------|---------|
| Baked logo | 28–66 | `trainwithgouli.com` — do not touch |
| Name + date | 70–405 | Name (Anton, uppercase) + date (mono) top-left; photo occupies x≈540–940 |
| Divider 1 | y=410 | red rule, x 51–940 |
| Stat tiles | 415–885 | 4 tiles in one row (EXERCISES / WORKING SETS / TOTAL VOLUME / TOTAL REPS) |
| Divider 2 | y=889 | red rule, x 45–894 |
| Focus bars + heatmap | 895–1420 | FOCUS AREAS bars left, body silhouettes right |
| Divider 3 | y=1425 | red rule, x 47–894 |
| Exercise list | 1430–1570 | compact table, auto-scaled, cap ~14 rows + "+N MORE" |
| Footer underlines | y≈1576 (x 45–244), y≈1581 (x 266–677), y≈1576 (x 699–894) | text sits above each line |
| Bottom red line | y=1655 | x 825–894 |

## Type
- Anton (`font-display`) for name, session title, exercise names, stat values.
- Geist Mono (`font-mono`) for labels, dates, table numbers.
- Accent red `var(--accent)` for numbers/lines/bars per DESIGN.md.

## Layout decisions
- All dynamic content absolutely positioned inside the 941×1672 card node; the node
  is scaled on-screen with a CSS transform (preview) and captured un-scaled off-screen.
- Session title = top-2 focus buckets by set volume joined with " / " (fallback
  "TRAINING SESSION").
- Duration tile replaced by TOTAL REPS (duration is not tracked — research §2).
- Focus buckets: legs→LEGS; back→BACK; arms/shoulders/chest→ARMS; core/full body→CORE;
  cardio→CONDITIONING. Unmatched exercises count toward nothing.
- Heatmap: hand-built SVG silhouettes (front/back), ~10 regions, red fill opacity
  proportional to bucket set share; zero → dark outline only.
- Exercise list auto-scales row height/font to fit ≤14 rows, then "+N MORE".
- Footer: "TRAINED WITH PURPOSE. / ONE REP AT A TIME." left, "MYSORE, INDIA" right.

## Export
- DOWNLOAD PNG: capture card node at pixelRatio 2 → `trainwithgouli-{date}.png`.
- SHARE: only when `navigator.canShare({ files })` is true.
- Capture uses a hidden fixed-position full-size clone so the preview transform
  never bakes into the PNG.
