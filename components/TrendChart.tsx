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

export default function TrendChart({ data }: { data: { month: string; count: number }[] }) {
  if (data.length === 0) return null

  const max = Math.max(...data.map((d) => d.count))
  const { top, step } = niceScale(max)

  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)

  const plotHeight = 190
  const marginLeft = 42
  const marginRight = 20
  const marginTop = 20
  const marginBottom = 40
  const plotWidth = 640
  const width = marginLeft + plotWidth + marginRight
  const height = marginTop + plotHeight + marginBottom

  const points = data.map((d, i) => {
    const x = marginLeft + (data.length === 1 ? plotWidth / 2 : (i * plotWidth) / (data.length - 1))
    const y = marginTop + plotHeight - (d.count / top) * plotHeight
    return { x, y, ...d }
  })

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', marginBottom: 8 }}
      role="img"
      aria-label="최근 게시물 수 추이"
    >
      {ticks.map((t) => {
        const y = marginTop + plotHeight - (t / top) * plotHeight
        return (
          <g key={`tick-${t}`}>
            <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={marginLeft - 8} y={y + 4} fontSize="11" textAnchor="end" fill="var(--text-muted)">
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

      <polyline points={linePoints} fill="none" stroke="var(--accent)" strokeWidth="2" />

      {points.map((p, i) => (
        <g key={`pt-${i}`}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--accent)" />
          <text x={p.x} y={p.y - 10} fontSize="11" textAnchor="middle" fill="var(--text-muted)">
            {p.count}
          </text>
          <text x={p.x} y={marginTop + plotHeight + 20} fontSize="11" textAnchor="middle" fill="var(--text)">
            {p.month.slice(5)}월
          </text>
        </g>
      ))}
    </svg>
  )
}