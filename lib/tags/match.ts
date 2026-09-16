export type Tag = {
  id: string
  canonical_name: string
  category: string
  synonyms: string | null
  status: string
}

/** 태그의 모든 표기(정식명 + 유의어)를 배열로 */
export function tagTerms(tag: Tag): string[] {
  const syns = (tag.synonyms ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  return [tag.canonical_name, ...syns]
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 본문에 이 표기가 등장하는지 검사.
 * - 단어 경계를 요구해서 development 안의 EV 같은 오탐을 막는다
 * - 3글자 이하 대문자 약어(EV, DC, NK)는 대소문자까지 정확히 맞아야 인정
 */
function termAppears(term: string, text: string): boolean {
  const isShortAcronym = term.length <= 3 && term === term.toUpperCase()
  const flags = isShortAcronym ? 'g' : 'gi'
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegex(term)}([^A-Za-z0-9]|$)`, flags)
  return pattern.test(text)
}

/**
 * 제목·초록·MeSH를 훑어 후보 태그 id를 뽑는다.
 * 매칭된 표기 수가 많을수록 앞에 온다.
 */
export function suggestTags(
  tags: Tag[],
  source: { title?: string; abstract?: string; mesh?: string[] }
): string[] {
  const haystack = [
    source.title ?? '',
    source.abstract ?? '',
    (source.mesh ?? []).join(' '),
  ].join(' ')

  if (!haystack.trim()) return []

  const scored: { id: string; score: number }[] = []

  for (const tag of tags) {
    if (tag.status !== 'approved') continue
    let score = 0
    for (const term of tagTerms(tag)) {
      if (termAppears(term, haystack)) score++
    }
    if (score > 0) scored.push({ id: tag.id, score })
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.id)
}

/** 피커 검색용: 사용자가 친 글자가 정식명이나 유의어에 포함된 태그를 찾는다 */
export function searchTags(tags: Tag[], query: string): Tag[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return tags
    .filter((tag) => tag.status === 'approved')
    .map((tag) => {
      const terms = tagTerms(tag)
      const hit = terms.find((t) => t.toLowerCase().includes(q))
      if (!hit) return null
      // 정식명이 직접 걸린 태그를 위로
      const rank = tag.canonical_name.toLowerCase().includes(q) ? 0 : 1
      return { tag, rank }
    })
    .filter((x): x is { tag: Tag; rank: number } => x !== null)
    .sort((a, b) => a.rank - b.rank || a.tag.canonical_name.localeCompare(b.tag.canonical_name))
    .map((x) => x.tag)
}

/** 어떤 표기가 걸려서 이 태그가 떴는지 — 피커에서 보조 설명으로 쓴다 */
export function matchedTerm(tag: Tag, query: string): string | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  return tagTerms(tag).find((t) => t.toLowerCase().includes(q)) ?? null
}