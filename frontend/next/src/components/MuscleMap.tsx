/**
 * Muscle heatmap for the share card: the committed muscle-map line art
 * (transparent background) with red region tints drawn on top — one polygon
 * group per HeatRegion, fill opacity proportional to that bucket's intensity.
 *
 * Polygon coordinates are in the trimmed art's pixel space (1153×1143),
 * hand-mapped against a coordinate grid. Preview composites live in
 * tasks/feature-social-share-card-20260925/ (muscle-map-preview2.png).
 */
import Image from 'next/image'
import type { HeatRegion } from '@/lib/share-stats'

/** viewBox dimensions of the trimmed art. */
export const MAP_W = 1153
export const MAP_H = 1143

type Poly = [number, number][]

/** Every tinted polygon, tagged with the HeatRegion that drives its intensity. */
const POLYS: { region: HeatRegion; points: Poly }[] = [
  // ── Front figure ──────────────────────────────────────────────────────────
  { region: 'traps', points: [[285,152],[335,152],[352,168],[368,190],[330,205],[290,205],[252,190],[268,168]] },
  { region: 'delts', points: [[108,225],[128,200],[168,200],[185,225],[188,255],[172,285],[140,292],[115,272],[103,248]] },
  { region: 'delts', points: [[512,225],[492,200],[452,200],[435,225],[432,255],[448,285],[480,292],[505,272],[517,248]] },
  { region: 'chest', points: [[200,250],[260,242],[315,242],[312,300],[270,320],[210,318],[198,285]] },
  { region: 'chest', points: [[320,242],[375,242],[435,250],[437,285],[425,318],[365,320],[322,300]] },
  { region: 'biceps', points: [[112,310],[160,302],[170,340],[166,420],[140,445],[115,425],[105,365]] },
  { region: 'biceps', points: [[508,310],[460,302],[450,340],[454,420],[480,445],[505,425],[515,365]] },
  { region: 'abs', points: [[272,350],[355,350],[356,420],[352,505],[275,505],[270,420]] },
  { region: 'quads', points: [[200,548],[275,545],[282,640],[270,740],[235,762],[195,745],[180,650],[185,575]] },
  { region: 'quads', points: [[395,548],[320,545],[313,640],[325,740],[360,762],[400,745],[415,650],[410,575]] },
  { region: 'calves', points: [[168,832],[238,826],[244,900],[230,990],[195,1000],[172,950],[162,890]] },
  { region: 'calves', points: [[432,832],[362,826],[356,900],[370,990],[405,1000],[428,950],[438,890]] },
  // ── Back figure ───────────────────────────────────────────────────────────
  { region: 'traps', points: [[822,132],[858,138],[898,132],[918,170],[928,225],[905,285],[862,325],[820,285],[795,225],[805,170]] },
  { region: 'delts', points: [[662,225],[684,200],[722,200],[740,225],[744,255],[730,285],[698,292],[672,272],[660,248]] },
  { region: 'delts', points: [[1058,225],[1036,200],[998,200],[980,225],[976,255],[990,285],[1022,292],[1048,272],[1060,248]] },
  { region: 'lats', points: [[752,312],[830,305],[890,305],[968,312],[978,380],[955,470],[905,505],[815,505],[765,470],[742,380]] },
  { region: 'triceps', points: [[650,330],[715,320],[722,380],[712,455],[680,468],[655,440],[645,385]] },
  { region: 'triceps', points: [[1070,330],[1005,320],[998,380],[1008,455],[1040,468],[1065,440],[1075,385]] },
  { region: 'hamstrings', points: [[748,512],[820,500],[860,505],[900,500],[972,512],[978,585],[945,655],[890,668],[830,668],[775,655],[742,585]] },
  { region: 'hamstrings', points: [[715,672],[800,665],[818,720],[808,800],[770,822],[730,812],[708,745]] },
  { region: 'hamstrings', points: [[1005,672],[920,665],[902,720],[912,800],[950,822],[990,812],[1012,745]] },
  { region: 'calves', points: [[708,852],[778,845],[786,905],[772,985],[738,1000],[712,960],[702,905]] },
  { region: 'calves', points: [[1012,852],[942,845],[934,905],[948,985],[982,1000],[1008,960],[1018,905]] },
]

export function MuscleMap({
  intensity,
}: {
  /** Per-region intensity 0..1, derived from bucket intensity by the caller. */
  intensity: Record<HeatRegion, number>
}) {
  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {POLYS.map((p, i) => {
          const v = Math.min(1, Math.max(0, intensity[p.region] ?? 0))
          if (v <= 0) return null
          return (
            <polygon
              key={i}
              points={p.points.map((pt) => pt.join(',')).join(' ')}
              fill="oklch(0.64 0.2 22)"
              fillOpacity={0.2 + 0.5 * v}
            />
          )
        })}
      </svg>
      <Image
        src="/share/muscle-map.png"
        alt=""
        width={MAP_W}
        height={MAP_H}
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
      />
    </div>
  )
}
