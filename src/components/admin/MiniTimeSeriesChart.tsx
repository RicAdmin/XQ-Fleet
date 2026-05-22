import { useId, useMemo } from 'react'

export type MiniTimeSeriesPoint = {
  label: string
  /** Used for bar height. */
  value: number
  /** Optional second metric tracked by the line. Defaults to cumulative sum of `value`. */
  cumulative?: number
}

type Props = {
  data: MiniTimeSeriesPoint[]
  height?: number
  /** Tick interval — every Nth label is rendered to avoid overlap. */
  xTickEvery?: number
  /** Label that appears in the legend for the bars. */
  barLabel?: string
  /** Label that appears in the legend for the line. */
  lineLabel?: string
  formatY?: (n: number) => string
  /** Optional aria label for the SVG. */
  title?: string
  className?: string
}

const DEFAULT_HEIGHT = 220
const PADDING = { top: 20, right: 16, bottom: 28, left: 44 }

function defaultFormatY(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(Math.round(n))
}

/**
 * Lightweight responsive SVG chart that overlays a bar series with a cumulative
 * (or arbitrary secondary) line series. Designed for affiliate dashboards where
 * we want monthly attributed revenue + cumulative trend in one chart without
 * pulling in a chart library.
 *
 * Renders at SVG-native resolution and scales to the container width with
 * preserveAspectRatio so it looks crisp on retina displays without a measure
 * pass.
 */
export function MiniTimeSeriesChart({
  data,
  height = DEFAULT_HEIGHT,
  xTickEvery = 2,
  barLabel = 'Value',
  lineLabel = 'Cumulative',
  formatY = defaultFormatY,
  title = 'Time series chart',
  className,
}: Props) {
  const titleId = useId()

  const { points, max, lineMax } = useMemo(() => {
    const cumulative = data.map((p, i, arr) =>
      p.cumulative ?? arr.slice(0, i + 1).reduce((acc, x) => acc + x.value, 0),
    )
    const maxBar = data.reduce((acc, p) => Math.max(acc, p.value), 0)
    const maxLine = cumulative.reduce((acc, c) => Math.max(acc, c), 0)
    return {
      points: data.map((p, i) => ({ ...p, cumulative: cumulative[i] })),
      max: Math.max(maxBar, 1),
      lineMax: Math.max(maxLine, 1),
    }
  }, [data])

  const width = 720
  const innerW = width - PADDING.left - PADDING.right
  const innerH = height - PADDING.top - PADDING.bottom
  const n = points.length
  const slot = n > 0 ? innerW / n : innerW
  const barW = Math.max(2, Math.min(40, slot * 0.6))

  const yTicks = 4
  const yTickValues = useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i <= yTicks; i++) arr.push((max * i) / yTicks)
    return arr
  }, [max])

  const linePath = useMemo(() => {
    if (n === 0) return ''
    return points
      .map((p, i) => {
        const x = PADDING.left + slot * i + slot / 2
        const y = PADDING.top + innerH - (p.cumulative / lineMax) * innerH
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }, [points, slot, innerH, lineMax, n])

  if (n === 0) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sea-ink-soft, #6b7280)',
          fontSize: 13,
        }}
      >
        No data to display.
      </div>
    )
  }

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height }}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>

        {/* Y axis grid + labels */}
        {yTickValues.map((v, i) => {
          const y = PADDING.top + innerH - (v / max) * innerH
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={PADDING.left + innerW}
                y1={y}
                y2={y}
                stroke="currentColor"
                opacity={i === 0 ? 0.25 : 0.08}
                strokeDasharray={i === 0 ? '' : '2 3'}
              />
              <text
                x={PADDING.left - 6}
                y={y + 3}
                fontSize={10}
                textAnchor="end"
                fill="currentColor"
                opacity={0.55}
              >
                {formatY(v)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {points.map((p, i) => {
          const h = max === 0 ? 0 : (p.value / max) * innerH
          const x = PADDING.left + slot * i + (slot - barW) / 2
          const y = PADDING.top + innerH - h
          return (
            <rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={2}
              fill="var(--lagoon-deep, #1f6f93)"
              opacity={0.78}
            >
              <title>{`${p.label} · ${formatY(p.value)}`}</title>
            </rect>
          )
        })}

        {/* Cumulative line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--brand-coral, #c4453a)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const x = PADDING.left + slot * i + slot / 2
          const y = PADDING.top + innerH - (p.cumulative / lineMax) * innerH
          return (
            <circle
              key={`pt-${i}`}
              cx={x}
              cy={y}
              r={2.5}
              fill="var(--brand-coral, #c4453a)"
            >
              <title>{`${p.label} cumulative · ${formatY(p.cumulative)}`}</title>
            </circle>
          )
        })}

        {/* X labels */}
        {points.map((p, i) => {
          if (i % xTickEvery !== 0) return null
          const x = PADDING.left + slot * i + slot / 2
          return (
            <text
              key={`xt-${i}`}
              x={x}
              y={height - 8}
              fontSize={10}
              textAnchor="middle"
              fill="currentColor"
              opacity={0.55}
            >
              {p.label}
            </text>
          )
        })}
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          fontSize: 12,
          color: 'var(--sea-ink-soft, #6b7280)',
          marginTop: 4,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              background: 'var(--lagoon-deep, #1f6f93)',
              borderRadius: 2,
            }}
          />
          {barLabel}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden
            style={{
              width: 14,
              height: 2,
              background: 'var(--brand-coral, #c4453a)',
            }}
          />
          {lineLabel}
        </span>
      </div>
    </div>
  )
}

export default MiniTimeSeriesChart
