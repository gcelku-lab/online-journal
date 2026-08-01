type Figure = { label: string; image_url: string }

export default function PostContent({
  content,
  figures,
}: {
  content: string
  figures: Figure[]
}) {
  const figureMap = new Map(figures.map((f) => [f.label.toLowerCase(), f.image_url]))
  const parts = content.split(/(<\|[^|]+\|>)/g)

  return (
    <div style={{ lineHeight: 1.7 }}>
      {parts.map((part, i) => {
        const match = part.match(/^<\|([^|]+)\|>$/)
        if (!match) {
          return (
            <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
              {part}
            </span>
          )
        }

        const label = match[1].trim()
        const url = figureMap.get(label.toLowerCase())

        if (!url) {
          return (
            <span key={i} style={{ color: '#b45309', fontSize: 13 }}>
              [{label} — 이미지 없음]
            </span>
          )
        }

        return (
          <figure key={i} style={{ margin: '16px 0' }}>
            <img src={url} alt={label} style={{ maxWidth: '100%', display: 'block' }} />
            <figcaption style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}