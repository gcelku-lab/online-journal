import type { AuthorCount } from '@/lib/posts/stats'

function niceScale(max: number): { top: number; step: number } {
  const targetTicks = 4
  const rough = Math.max(1, max / targetTicks)
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  const rawStep = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const step = Math.max(1, Math.round(rawStep))
  const top = (Math.floor(max / step) + 1) * step
  return { top, step }
}

export default function AuthorBarChart({ data }: { data: AuthorCount[] }) {
  if (data.length === 0) return null

  const max = Math.max(...data.map((d) => d.count))
  const { top, step } = niceScale(max)

  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)

  // 사람이 많아질수록 막대와 간격을 좁힘 (최소치까지)
  const n = data.length
  const barWidth = n <= 6 ? 38 : n <= 12 ? 26 : 18
  const gap = n <= 6 ? 26 : n <= 12 ? 16 : 10
  const tilt = n > 8 // 이름이 많으면 라벨을 기울임

  const plotHeight = 150
  const marginLeft = 38
  const marginTop = 14
  const marginBottom = tilt ? 66 : 46
  const plotWidth = n * barWidth + (n + 1) * gap
  const width = marginLeft + plotWidth
  const height = marginTop + plotHeight + marginBottom

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: width, minWidth: Math.min(width, 320), height: 'auto' }}
      role="img"
      aria-label="사용자별 정리 편수"
    >
      {ticks.map((t) => {
        const y = marginTop + plotHeight - (t / top) * plotHeight
        return (
          <g key={`tick-${t}`}>
            <line x1={marginLeft} y1={y} x2={width} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={marginLeft - 7} y={y + 3.5} fontSize="10" textAnchor="end" fill="var(--text-muted)">
              {t}
            </text>
          </g>
        )
      })}

      <line
        x1={marginLeft}
        y1={marginTop}
        x2={marginLeft}
        y2={marginTop + plotHeight}
        stroke="var(--border-strong)"
        strokeWidth="1"
      />

      {data.map((d, i) => {
        const barHeight = (d.count / top) * plotHeight
        const x = marginLeft + gap + i * (barWidth + gap)
        const y = marginTop + plotHeight - barHeight
        const cx = x + barWidth / 2
        const labelY = marginTop + plotHeight + 16
        return (
          <g key={`bar-${i}-${d.name}`}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill="var(--accent)" />
            <text x={cx} y={y - 5} fontSize="10" textAnchor="middle" fill="var(--text-muted)">
              {d.count}
            </text>
            <text
              x={cx}
              y={labelY}
              fontSize="11"
              textAnchor={tilt ? 'end' : 'middle'}
              fill="var(--text)"
              transform={tilt ? `rotate(-40 ${cx} ${labelY})` : undefined}
            >
              {d.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}