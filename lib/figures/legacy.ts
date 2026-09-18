export type FigureMap = Map<string, string>

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

const TAG_SRC = String.raw`(?:&lt;|<)\|([^|]+)\|(?:(\d{1,3})\|)?(?:&gt;|>)`

/** 본문에 남아있는 <|라벨|> 텍스트 태그를 figureRef 노드 HTML로 바꾼다 */
export function convertLegacyFigures(html: string, figures: FigureMap): string {
  if (!html) return html

  const single = new RegExp(TAG_SRC, 'g')
  // 붙여 쓴 연속 태그는 폭을 나눠 갖도록
  const group = new RegExp(`(?:${TAG_SRC})(?:${TAG_SRC})+`, 'g')

  function nodeHtml(label: string, width: number, map: FigureMap) {
    const url = map.get(label.trim().toLowerCase()) ?? ''
    return `<span data-figure-ref data-label="${escapeAttr(label.trim())}" data-url="${escapeAttr(
      url
    )}" data-width="${width}"></span>`
  }

  let out = html.replace(group, (block) => {
    const items = [...block.matchAll(new RegExp(TAG_SRC, 'g'))]
    const each = Math.max(10, Math.floor(96 / items.length))
    return items.map((m) => nodeHtml(m[1], m[2] ? parseInt(m[2], 10) : each, figures)).join('')
  })

  out = out.replace(single, (_m, label: string, w?: string) =>
    nodeHtml(label, w ? parseInt(w, 10) : 100, figures)
  )

  return out
}