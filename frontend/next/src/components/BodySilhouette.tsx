/**
 * Stylized anatomical silhouettes for the share-card muscle heatmap.
 * Hand-built SVG paths — deliberately simple, they render ~200px tall on the
 * card. Regions are filled red with opacity proportional to bucket intensity;
 * zero-intensity regions stay as a dark outline.
 */
import type { HeatRegion } from '@/lib/share-stats'

export type BodySide = 'front' | 'back'

type RegionShape = {
  id: HeatRegion
  /** SVG path data in a 200×420 viewBox. */
  d: string
}

/** Front-facing regions (viewBox 0 0 200 420). */
const FRONT_REGIONS: RegionShape[] = [
  {
    id: 'traps',
    d: 'M78 52 L86 40 L100 36 L114 40 L122 52 L118 62 L100 58 L82 62 Z',
  },
  {
    id: 'delts',
    d: 'M78 62 Q64 66 58 82 L54 100 Q62 108 74 104 L80 88 Z',
  },
  {
    id: 'delts',
    d: 'M122 62 Q136 66 142 82 L146 100 Q138 108 126 104 L120 88 Z',
  },
  {
    id: 'chest',
    d: 'M80 88 L100 84 L100 116 L84 112 Q76 100 80 88 Z',
  },
  {
    id: 'chest',
    d: 'M120 88 L100 84 L100 116 L116 112 Q124 100 120 88 Z',
  },
  {
    id: 'biceps',
    d: 'M56 104 Q48 118 50 138 Q52 152 58 156 Q64 148 62 130 Q62 116 62 106 Z',
  },
  {
    id: 'biceps',
    d: 'M144 104 Q152 118 150 138 Q148 152 142 156 Q136 148 138 130 Q138 116 138 106 Z',
  },
  {
    id: 'abs',
    d: 'M86 122 L100 120 L100 168 L88 164 Q84 142 86 122 Z',
  },
  {
    id: 'abs',
    d: 'M114 122 L100 120 L100 168 L112 164 Q116 142 114 122 Z',
  },
  {
    id: 'quads',
    d: 'M84 172 Q74 200 76 232 Q78 258 88 268 L98 264 L98 176 Z',
  },
  {
    id: 'quads',
    d: 'M116 172 Q126 200 124 232 Q122 258 112 268 L102 264 L102 176 Z',
  },
  {
    id: 'calves',
    d: 'M80 276 Q76 300 82 318 Q88 330 94 326 L96 286 Z',
  },
  {
    id: 'calves',
    d: 'M120 276 Q124 300 118 318 Q112 330 106 326 L104 286 Z',
  },
]

/** Back-facing regions (viewBox 0 0 200 420). */
const BACK_REGIONS: RegionShape[] = [
  {
    id: 'traps',
    d: 'M76 54 Q88 40 100 38 Q112 40 124 54 L118 66 L100 60 L82 66 Z',
  },
  {
    id: 'delts',
    d: 'M76 64 Q62 70 58 86 L56 102 Q66 108 76 102 L80 88 Z',
  },
  {
    id: 'delts',
    d: 'M124 64 Q138 70 142 86 L144 102 Q134 108 124 102 L120 88 Z',
  },
  {
    id: 'lats',
    d: 'M78 90 L100 86 L100 128 L88 140 Q78 116 78 90 Z',
  },
  {
    id: 'lats',
    d: 'M122 90 L100 86 L100 128 L112 140 Q122 116 122 90 Z',
  },
  {
    id: 'triceps',
    d: 'M58 106 Q50 122 52 142 Q54 154 60 158 Q66 148 64 132 Q64 118 64 108 Z',
  },
  {
    id: 'triceps',
    d: 'M142 106 Q150 122 148 142 Q146 154 140 158 Q134 148 136 132 Q136 118 136 108 Z',
  },
  {
    id: 'abs',
    d: 'M88 148 L100 146 L100 176 L90 172 Q86 160 88 148 Z',
  },
  {
    id: 'abs',
    d: 'M112 148 L100 146 L100 176 L110 172 Q114 160 112 148 Z',
  },
  {
    id: 'hamstrings',
    d: 'M84 180 Q74 208 78 240 Q80 260 90 268 L98 262 L98 184 Z',
  },
  {
    id: 'hamstrings',
    d: 'M116 180 Q126 208 122 240 Q120 260 110 268 L102 262 L102 184 Z',
  },
  {
    id: 'calves',
    d: 'M80 276 Q76 300 82 318 Q88 330 94 326 L96 286 Z',
  },
  {
    id: 'calves',
    d: 'M120 276 Q124 300 118 318 Q112 330 106 326 L104 286 Z',
  },
]

/** Rough body outline per side (stroke only, no fill). */
const OUTLINES: Record<BodySide, string> = {
  front:
    'M100 22 Q118 22 124 38 Q128 50 124 60 Q142 66 148 84 L152 104 Q154 118 148 132 L146 158 Q144 168 138 172 L134 200 Q132 224 128 244 L124 272 Q122 286 118 296 L116 330 Q114 356 112 380 L110 402 Q104 410 100 410 Q96 410 90 402 L88 380 Q86 356 84 330 L82 296 Q78 286 76 272 L72 244 Q68 224 66 200 L62 172 Q56 168 54 158 L52 132 Q46 118 48 104 L52 84 Q58 66 76 60 Q72 50 76 38 Q82 22 100 22 Z',
  back:
    'M100 22 Q118 22 124 38 Q128 50 124 60 Q142 66 148 84 L152 104 Q154 118 148 132 L146 158 Q144 168 138 172 L134 200 Q132 224 128 244 L124 272 Q122 286 118 296 L116 330 Q114 356 112 380 L110 402 Q104 410 100 410 Q96 410 90 402 L88 380 Q86 356 84 330 L82 296 Q78 286 76 272 L72 244 Q68 224 66 200 L62 172 Q56 168 54 158 L52 132 Q46 118 48 104 L52 84 Q58 66 76 60 Q72 50 76 38 Q82 22 100 22 Z',
}

export function BodySilhouette({
  side,
  intensity,
}: {
  side: BodySide
  /** bucket intensity per region id, 0..1 */
  intensity: Partial<Record<HeatRegion, number>>
}) {
  const regions = side === 'front' ? FRONT_REGIONS : BACK_REGIONS
  return (
    <svg
      viewBox="0 0 200 420"
      className="h-full w-auto"
      role="img"
      aria-label={`${side} body muscle heatmap`}
    >
      <path d={OUTLINES[side]} fill="none" stroke="oklch(0.42 0.015 25)" strokeWidth="2.5" />
      {regions.map((r, i) => {
        const v = Math.min(1, Math.max(0, intensity[r.id] ?? 0))
        // Zero-intensity: dark red ghost. Active: red, opacity by share.
        const fill = v > 0 ? 'oklch(0.64 0.2 22)' : 'oklch(0.3 0.08 22)'
        const opacity = v > 0 ? 0.35 + 0.65 * v : 0.35
        return (
          <path key={`${r.id}-${i}`} d={r.d} fill={fill} opacity={opacity} />
        )
      })}
    </svg>
  )
}
