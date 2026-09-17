type Figure = { label: string; image_url: string }

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function PostContent({
  content,
  figures,
}: {
  content: string
  figures: Figure[]
}) {
  const figureMap = new Map(figures.map((f) => [f.label.toLowerCase(), f.image_url]))

  const TAG = String.raw`(?:&lt;|<)\|[^|]+\|(?:&gt;|>)`
  // 태그가 공백/줄바꿈/빈 태그만 사이에 두고 연속으로 나오면 한 그룹으로 본다
  const GROUP = new RegExp(`${TAG}(?:(?:\\s|<\\/?p>|<br\\s*\\/?>)*${TAG})+`, 'g')
  const SINGLE = new RegExp(TAG, 'g')
  const LABEL = /(?:&lt;|<)\|([^|]+)\|(?:&gt;|>)/

  function figureHtml(rawLabel: string, inGroup: boolean): string {
    const label = rawLabel.trim()
    const url = figureMap.get(label.toLowerCase())

    if (!url) {
      return `<span class="figure-missing">[${escapeHtml(label)} — 이미지 없음]</span>`
    }

    const cls = inGroup ? 'post-figure post-figure-inline' : 'post-figure'
    return `<figure class="${cls}"><img src="${escapeHtml(url)}" alt="${escapeHtml(
      label
    )}" /><figcaption>${escapeHtml(label)}</figcaption></figure>`
  }

  // 1단계: 연속 그룹을 가로 배치로
  let rendered = content.replace(GROUP, (block) => {
    const labels = [...block.matchAll(new RegExp(LABEL.source, 'g'))].map((m) => m[1])
    const inner = labels.map((l) => figureHtml(l, true)).join('')
    return `<div class="post-figure-row">${inner}</div>`
  })

  // 2단계: 남은 단독 태그 처리
  rendered = rendered.replace(SINGLE, (tag) => {
    const m = tag.match(LABEL)
    return m ? figureHtml(m[1], false) : tag
  })

  return <div className="post-content" dangerouslySetInnerHTML={{ __html: rendered }} />
}