/**
 * Muscle heatmap for the share card: committed muscle-map line art
 * (transparent background) with red region tints drawn on top — one polygon
 * group per HeatRegion, fill opacity proportional to that bucket's intensity.
 *
 * Two variants share the same HeatRegion keys; polygon coordinates are in
 * each art's trimmed pixel space, hand-mapped against a coordinate grid and
 * verified with offline composite previews (tasks/feature-social-share-card-20260925).
 */
import Image from 'next/image'
import type { HeatRegion } from '@/lib/share-stats'

export type MuscleMapVariant = 'male' | 'female'

type Poly = [number, number][]

const MALE_W = 1153
const MALE_H = 1143

const FEMALE_W = 1136
const FEMALE_H = 1151

const POLYS_MALE: { region: HeatRegion; points: Poly }[] = [
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

const POLYS_FEMALE: { region: HeatRegion; points: Poly }[] = [
  // ── Front figure ──────────────────────────────────────────────────────────
  { region: 'traps', points: [[250,190],[325,190],[340,215],[330,245],[285,255],[245,245],[235,215]] },
  { region: 'delts', points: [[135,255],[160,235],[200,240],[210,270],[205,305],[175,325],[145,310],[130,285]] },
  { region: 'delts', points: [[435,255],[410,235],[370,240],[360,270],[365,305],[395,325],[425,310],[440,285]] },
  { region: 'chest', points: [[232,242],[343,242],[335,265],[285,270],[240,265]] },
  { region: 'biceps', points: [[125,330],[190,322],[195,380],[185,455],[155,470],[130,440],[118,385]] },
  { region: 'biceps', points: [[445,330],[380,322],[375,380],[385,455],[415,470],[440,440],[452,385]] },
  { region: 'abs', points: [[242,412],[338,412],[340,460],[335,508],[245,508],[240,460]] },
  { region: 'quads', points: [[170,650],[275,645],[278,720],[265,790],[220,805],[180,785],[162,720]] },
  { region: 'quads', points: [[410,650],[305,645],[302,720],[315,790],[360,805],[400,785],[418,720]] },
  { region: 'calves', points: [[172,845],[258,838],[262,900],[248,985],[205,995],[180,950],[168,900]] },
  { region: 'calves', points: [[408,845],[322,838],[318,900],[332,985],[375,995],[400,950],[412,900]] },
  // ── Back figure ───────────────────────────────────────────────────────────
  { region: 'traps', points: [[788,185],[855,178],[918,185],[930,230],[915,290],[862,315],[805,290],[792,230]] },
  { region: 'delts', points: [[695,255],[720,235],[760,240],[770,270],[762,308],[732,322],[702,308],[688,282]] },
  { region: 'delts', points: [[1015,255],[990,235],[950,240],[940,270],[948,308],[978,322],[1008,308],[1022,282]] },
  { region: 'lats', points: [[745,312],[795,302],[808,330],[798,430],[776,492],[750,478],[735,415],[740,355]] },
  { region: 'lats', points: [[965,312],[915,302],[902,330],[912,430],[934,492],[960,478],[975,415],[970,355]] },
  { region: 'triceps', points: [[668,332],[745,322],[750,385],[738,465],[705,478],[678,450],[660,395]] },
  { region: 'triceps', points: [[1042,332],[965,322],[960,385],[972,465],[1005,478],[1032,450],[1050,395]] },
  { region: 'hamstrings', points: [[725,662],[820,655],[826,720],[812,800],[768,818],[732,800],[715,730]] },
  { region: 'hamstrings', points: [[975,662],[880,655],[874,720],[888,800],[932,818],[968,800],[985,730]] },
  { region: 'calves', points: [[720,848],[805,840],[810,905],[795,990],[752,1005],[725,960],[712,905]] },
  { region: 'calves', points: [[980,848],[895,840],[890,905],[905,990],[948,1005],[975,960],[988,905]] },
]

const VARIANTS: Record<
  MuscleMapVariant,
  { src: string; w: number; h: number; polys: { region: HeatRegion; points: Poly }[] }
> = {
  male: { src: '/share/muscle-map.png', w: MALE_W, h: MALE_H, polys: POLYS_MALE },
  female: { src: '/share/muscle-map-female.png', w: FEMALE_W, h: FEMALE_H, polys: POLYS_FEMALE },
}

export function MuscleMap({
  variant,
  intensity,
}: {
  variant: MuscleMapVariant
  /** Per-region intensity 0..1, derived from bucket intensity by the caller. */
  intensity: Record<HeatRegion, number>
}) {
  const v = VARIANTS[variant] ?? VARIANTS.male
  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${v.w} ${v.h}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {v.polys.map((p, i) => {
          const iv = Math.min(1, Math.max(0, intensity[p.region] ?? 0))
          if (iv <= 0) return null
          return (
            <polygon
              key={i}
              points={p.points.map((pt) => pt.join(',')).join(' ')}
              fill="oklch(0.64 0.2 22)"
              fillOpacity={0.2 + 0.5 * iv}
            />
          )
        })}
      </svg>
      <Image
        src={v.src}
        alt=""
        width={v.w}
        height={v.h}
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
      />
    </div>
  )
}
