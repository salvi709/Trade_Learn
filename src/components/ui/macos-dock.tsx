import { useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

/** macOS Dock — magnifying command dock. Cursor distance drives per-icon size
 *  (44→56px raised-cosine springs), a hairline tooltip chip sits above the
 *  hovered tool, icons bounce on click and cast a soft floor reflection,
 *  running apps get a dot, and a ⌘K slot at the end opens a small command
 *  menu. Light and dark via shadcn tokens; the default items are CSS-drawn
 *  tiles — swap in your own (an <img>, an svg, anything) via props. */

const EASE = [0.16, 1, 0.3, 1] as const
const SANS = 'inherit'
const FAR = 99999
const REST = 44
const PEAK = 56 // keep the magnify subtle — icons shouldn't balloon
const RADIUS = 110 // px of cursor influence on either side of an icon
const PLATE = '82%'
const ICON_SHADOW =
  'drop-shadow(0 6px 10px var(--card-shadow, rgba(0,0,0,0.45))) drop-shadow(0 2px 3px var(--card-shadow, rgba(0,0,0,0.35)))'

export type DockApp = {
  id: string
  label: string
  /** any node — an <img>, an svg, or the built-in gradient tiles */
  icon: ReactNode
}

/** gradient app tile — lit top-left, settling into the brand color */
function Tile({ c, children }: { c: [number, number, number]; children: ReactNode }) {
  const up = c.map((v) => Math.min(255, v + 38)).join(',')
  const dn = c.map((v) => Math.max(0, v - 46)).join(',')
  return (
    <span aria-hidden className="flex h-full w-full items-center justify-center">
      <span
        className="flex items-center justify-center rounded-[22%]"
        style={{
          width: PLATE,
          height: PLATE,
          background: `linear-gradient(145deg, rgb(${up}) 0%, rgb(${c.join(',')}) 55%, rgb(${dn}) 100%)`,
        }}
      >
        {children}
      </span>
    </span>
  )
}

const glyph = { fill: 'none', stroke: 'white', strokeWidth: 1.7, strokeLinecap: 'round' as const }

/** demo tools — five fixed-color tiles (the tiles are brand objects, not themed) */
const DEFAULT_ITEMS: DockApp[] = [
  {
    id: 'spark',
    label: 'Spark',
    icon: (
      <Tile c={[223, 119, 87]}>
        <svg width={18} height={18} viewBox="0 0 22 22" {...glyph}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4
            return <line key={i} x1={11 + Math.cos(a) * 3.2} y1={11 + Math.sin(a) * 3.2} x2={11 + Math.cos(a) * 8} y2={11 + Math.sin(a) * 8} />
          })}
        </svg>
      </Tile>
    ),
  },
  {
    id: 'signal',
    label: 'Signal',
    icon: (
      <Tile c={[99, 168, 255]}>
        <svg width={18} height={18} viewBox="0 0 22 22" {...glyph}>
          <path d="M3 17 C 8 17, 8.5 5, 11 5 S 14 17, 19 17" />
        </svg>
      </Tile>
    ),
  },
  {
    id: 'frame',
    label: 'Frame',
    icon: (
      <Tile c={[40, 120, 250]}>
        <svg width={18} height={18} viewBox="0 0 22 22" {...glyph}>
          <rect x={5} y={5} width={12} height={12} rx={3} />
          <circle cx={11} cy={11} r={2.4} />
        </svg>
      </Tile>
    ),
  },
  {
    id: 'palette',
    label: 'Palette',
    icon: (
      <Tile c={[165, 89, 255]}>
        <svg width={18} height={18} viewBox="0 0 22 22" {...glyph}>
          <circle cx={7.5} cy={7.5} r={2.6} />
          <circle cx={14.5} cy={7.5} r={2.6} />
          <circle cx={7.5} cy={14.5} r={2.6} />
          <circle cx={14.5} cy={14.5} r={2.6} />
        </svg>
      </Tile>
    ),
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: (
      <Tile c={[112, 110, 244]}>
        <svg width={18} height={18} viewBox="0 0 22 22" {...glyph}>
          <path d="M6 7 L 10.5 11 L 6 15" />
          <line x1={12.5} y1={15.5} x2={16.5} y2={15.5} />
        </svg>
      </Tile>
    ),
  },
]

const COMMANDS: Array<[string, string]> = [
  ['Search tools', '/'],
  ['New canvas', 'N'],
  ['Toggle theme', 'T'],
  ['Copy share link', 'C'],
]

function DockItem({
  mouseX,
  reduce,
  label,
  hovered,
  active = false,
  onEnter,
  onClick,
  children,
}: {
  mouseX: MotionValue<number>
  reduce: boolean
  label: string
  hovered: boolean
  active?: boolean
  onEnter: () => void
  onClick?: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const dist = useTransform(mouseX, (x: number) => {
    const r = ref.current?.getBoundingClientRect()
    return r ? x - (r.x + r.width / 2) : FAR
  })
  const raw = useTransform(dist, (d: number) => {
    const t = Math.min(1, Math.abs(d) / RADIUS)
    return REST + (PEAK - REST) * ((1 + Math.cos(Math.PI * t)) / 2)
  })
  const size = useSpring(raw, { mass: 0.1, stiffness: 240, damping: 18 })
  const bounce = useAnimationControls()
  const click = () => {
    if (!reduce) void bounce.start({ y: [0, -12, 0], transition: { duration: 0.4, ease: EASE } })
    onClick?.()
  }

  return (
    <button
      ref={ref}
      aria-label={label}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={click}
      className="relative flex flex-col items-center outline-none"
    >
      <motion.span
        animate={bounce}
        style={{ width: reduce ? REST : size, height: reduce ? REST : size, filter: ICON_SHADOW }}
        className="relative z-10 block overflow-hidden rounded-[10px]"
      >
        {children}
      </motion.span>
      {active && (
        <span
          aria-hidden
          className="absolute -bottom-[1px] left-1/2 z-10 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-foreground/80 shadow-[0_0_4px_var(--card-shadow,rgba(0,0,0,0.3))]"
        />
      )}
      <motion.span
        aria-hidden
        style={{ width: reduce ? REST : size, height: reduce ? REST * 0.5 : size }}
        className="pointer-events-none absolute left-1/2 top-full mt-[3px] -translate-x-1/2 overflow-hidden rounded-[10px] opacity-25 [transform:translateX(-50%)_scaleY(-1)] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5),transparent_65%)]"
      >
        {children}
      </motion.span>
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 10, scaleY: 0.5, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scaleY: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 10, scaleY: 0.5, x: '-50%' }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ transformOrigin: 'bottom center', background: 'var(--surface, var(--card))' }}
            className="pointer-events-none absolute -top-9 left-1/2 z-20 whitespace-nowrap rounded-md border border-foreground/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-foreground/70 shadow-[0_8px_24px_var(--card-shadow,rgba(0,0,0,0.5))]"
          >
            {label}
            <span
              aria-hidden
              className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-foreground/[0.04]"
              style={{ background: 'var(--surface, var(--card))' }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function MacOsDock({
  items = DEFAULT_ITEMS,
  activeIds = [],
  onSelect,
  onCommand,
  className = '',
}: {
  items?: DockApp[]
  activeIds?: string[]
  onSelect?: (item: DockApp) => void
  onCommand?: () => void
  className?: string
}) {
  const reduce = !!useReducedMotion()
  const mouseX = useMotionValue(FAR)
  const [hovered, setHovered] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      onMouseMove={(e) => {
        if (!reduce) mouseX.set(e.clientX)
      }}
      onMouseLeave={() => {
        mouseX.set(FAR)
        setHovered(null)
      }}
      className={`relative flex items-end gap-2 rounded-2xl p-3 ${className}`}
      style={{
        background:
          'linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 6%, var(--card-raised, var(--card))), var(--surface, var(--card)))',
        boxShadow: [
          'inset 0 0 0 1px color-mix(in srgb, var(--foreground) 8%, transparent)',
          'inset 0 1px 0 color-mix(in srgb, var(--foreground) 12%, transparent)',
          '0 12px 32px var(--card-shadow, rgba(0,0,0,0.45))',
        ].join(', '),
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-px h-px rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--foreground) 35%, transparent), transparent)' }}
      />
      {items.map((it) => (
        <DockItem
          key={it.id}
          mouseX={mouseX}
          reduce={reduce}
          label={it.label}
          hovered={hovered === it.id}
          active={activeIds.includes(it.id)}
          onEnter={() => setHovered(it.id)}
          onClick={() => onSelect?.(it)}
        >
          {it.icon}
        </DockItem>
      ))}

      <div className="mx-1 h-8 w-px self-center bg-foreground/[0.08]" />

      <DockItem
        mouseX={mouseX}
        reduce={reduce}
        label="Command menu"
        hovered={hovered === '⌘K' && !menuOpen}
        onEnter={() => setHovered('⌘K')}
        onClick={() => {
          setMenuOpen((o) => !o)
          onCommand?.()
        }}
      >
        <span className="flex h-full w-full items-center justify-center">
          <span
            className="flex items-center justify-center rounded-[22%] border border-foreground/[0.06] bg-foreground/[0.05] text-[12px] text-foreground/70"
            style={{ width: PLATE, height: PLATE, fontFamily: SANS }}
          >
            ⌘K
          </span>
        </span>
      </DockItem>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="menu"
            aria-label="Commands"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
            style={{ transformOrigin: 'bottom right', background: 'var(--surface, var(--card))', boxShadow: '0 16px 40px var(--card-shadow, rgba(0,0,0,0.5))' }}
            className="absolute bottom-full right-0 z-30 mb-3 w-[190px] rounded-xl border border-foreground/[0.05] p-1"
          >
            {COMMANDS.map(([label, key]) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11px] text-foreground/70 transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground"
                style={{ fontFamily: SANS }}
              >
                {label}
                <span className="rounded border border-foreground/[0.08] px-1 text-[9px] text-foreground/35">⌘{key}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Demo() {
  const [open, setOpen] = useState<string[]>(['signal'])
  return (
    <div className="relative flex min-h-[340px] w-full items-end justify-center pb-12">
      <MacOsDock
        activeIds={open}
        onSelect={(it) => setOpen((o) => (o.includes(it.id) ? o.filter((a) => a !== it.id) : [...o, it.id]))}
      />
    </div>
  )
}
