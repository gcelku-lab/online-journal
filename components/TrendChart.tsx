export default function TrendChart({ data }: { data: { month: string; count: number }[] }) {
  const width = 640
  const height = 160
  const padding = 32
  const max = Math.max(1, ...data.map((d) => d.count))

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1)
    const y = height - padding - (d.count / max) * (height - padding * 2)
    return { x, y, ...d }
  })

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ marginBottom: 24 }}>
      <polyline points={linePoints} fill="none" stroke="#2563eb" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#2563eb" />
          <text x={p.x} y={height - 8} fontSize="10" textAnchor="middle" fill="#888">
            {p.month.slice(5)}월
          </text>
          <text x={p.x} y={p.y - 8} fontSize="10" textAnchor="middle" fill="#ccc">
            {p.count}
          </text>
        </g>
      ))}
    </svg>
  )
}