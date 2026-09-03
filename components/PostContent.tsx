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

  // TipTap이 저장한 HTML 안에서 <|라벨|> 을 찾아 <figure>로 치환.
  // HTML 저장 과정에서 < > 가 &lt; &gt; 로 인코딩되므로 두 형태 모두 처리한다.
  const rendered = content.replace(
    /(?:&lt;|<)\|([^|]+)\|(?:&gt;|>)/g,
    (_match, rawLabel: string) => {
      const label = rawLabel.trim()
      const url = figureMap.get(label.toLowerCase())

      if (!url) {
        return `<span class="figure-missing">[${escapeHtml(label)} — 이미지 없음]</span>`
      }

      return `<figure class="post-figure"><img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" /><figcaption>${escapeHtml(label)}</figcaption></figure>`
    }
  )

  return <div className="post-content" dangerouslySetInnerHTML={{ __html: rendered }} />
}