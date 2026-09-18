type Figure = { label: string; image_url: string }

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function attrOf(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`))
  if (!m) return ''
  return m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
}

export default function PostContent({
  content,
  figures,
}: {
  content: string
  figures: Figure[]
}) {
  const figureMap = new Map(figures.map((f) => [f.label.toLowerCase(), f.image_url]))

  function figureHtml(label: string, width: number, fallbackUrl: string) {
    const url = figureMap.get(label.trim().toLowerCase()) ?? fallbackUrl

    if (!url) {
      return `<span class="figure-missing">[${escapeHtml(label)} — 이미지 없음]</span>`
    }

    return `<span class="post-figure" style="width:${width}%"><img src="${escapeHtml(
      url
    )}" alt="${escapeHtml(label)}" /><span class="post-figure-caption">${escapeHtml(
      label
    )}</span></span>`
  }

  // 새 형식
  let rendered = content.replace(/<span[^>]*data-figure-ref[^>]*>\s*<\/span>/g, (tag) => {
    const label = attrOf(tag, 'data-label')
    const url = attrOf(tag, 'data-url')
    const width = parseInt(attrOf(tag, 'data-width') || '100', 10) || 100
    return figureHtml(label, Math.min(100, Math.max(10, width)), url)
  })

  // 옛 형식 (아직 편집하지 않은 글)
  rendered = rendered.replace(
    /(?:&lt;|<)\|([^|]+)\|(?:(\d{1,3})\|)?(?:&gt;|>)/g,
    (_m, label: string, w?: string) => figureHtml(label, w ? parseInt(w, 10) : 100, '')
  )

  return <div className="post-content" dangerouslySetInnerHTML={{ __html: rendered }} />
}