import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function sanitize(text: string) {
  return text.replace(/[()[\]-]/g, ' ').trim()
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by',
  'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of',
  'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there',
  'these', 'they', 'this', 'to', 'was', 'will', 'with',
])

function titleClause(title: string): string | null {
  const words = sanitize(title)
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w.toLowerCase()))

  if (words.length === 0) return null
  return words.join(' AND ')
}

/** efetch로 초록과 MeSH 용어를 가져온다. 저장하지 않고 태그 매칭에만 쓴다. */
async function fetchAbstracts(
  ids: string[],
  apiKey?: string
): Promise<Map<string, { abstract: string; mesh: string[] }>> {
  const result = new Map<string, { abstract: string; mesh: string[] }>()
  if (ids.length === 0) return result

  const url = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi')
  url.searchParams.set('db', 'pubmed')
  url.searchParams.set('retmode', 'xml')
  url.searchParams.set('id', ids.join(','))
  if (apiKey) url.searchParams.set('api_key', apiKey)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) {
    console.error('efetch 실패:', res.status)
    return result
  }

  const xml = await res.text()

  // 논문 단위로 쪼갠 뒤 각각에서 PMID / 초록 / MeSH를 뽑는다
  const articles = xml.split('<PubmedArticle>').slice(1)

  for (const article of articles) {
    const pmidMatch = article.match(/<PMID[^>]*>(\d+)<\/PMID>/)
    if (!pmidMatch) continue
    const pmid = pmidMatch[1]

    const abstractParts = [...article.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
      .map((m) => m[1])
    const abstract = abstractParts
      .join(' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()

    const mesh = [...article.matchAll(/<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)

    result.set(pmid, { abstract, mesh })
  }

  return result
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')?.trim()
  const journal = searchParams.get('journal')?.trim()

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const clause = titleClause(title)
  if (!clause) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.NCBI_API_KEY

  let term = `(${clause})`
  if (journal) term += ` AND (${sanitize(journal)}[Journal])`

  const searchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi')
  searchUrl.searchParams.set('db', 'pubmed')
  searchUrl.searchParams.set('retmode', 'json')
  searchUrl.searchParams.set('retmax', '8')
  searchUrl.searchParams.set('sort', 'relevance')
  searchUrl.searchParams.set('term', term)
  if (apiKey) searchUrl.searchParams.set('api_key', apiKey)

  const searchRes = await fetch(searchUrl.toString(), { cache: 'no-store' })

  if (!searchRes.ok) {
    console.error('NCBI 검색 실패:', searchRes.status, await searchRes.text())
    return NextResponse.json({ results: [] })
  }

  const searchData = await searchRes.json()
  const ids: string[] = searchData?.esearchresult?.idlist ?? []

  if (ids.length === 0) {
    return NextResponse.json({ results: [] })
  }

  const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi')
  summaryUrl.searchParams.set('db', 'pubmed')
  summaryUrl.searchParams.set('retmode', 'json')
  summaryUrl.searchParams.set('id', ids.join(','))
  if (apiKey) summaryUrl.searchParams.set('api_key', apiKey)

  const [summaryRes, abstractMap] = await Promise.all([
    fetch(summaryUrl.toString(), { cache: 'no-store' }),
    fetchAbstracts(ids, apiKey),
  ])

  if (!summaryRes.ok) {
    console.error('NCBI 요약 조회 실패:', summaryRes.status)
    return NextResponse.json({ results: [] })
  }

  const summaryData = await summaryRes.json()

  const results = ids
    .map((id) => {
      const doc = summaryData.result?.[id]
      if (!doc) return null
      const doiEntry = (doc.articleids ?? []).find((a: { idtype: string }) => a.idtype === 'doi')
      const authors = (doc.authors ?? [])
        .filter((a: { authtype: string }) => a.authtype === 'Author')
        .map((a: { name: string }) => a.name)
      const extra = abstractMap.get(id)

      return {
        pmid: id,
        title: doc.title as string,
        journal: (doc.fulljournalname || doc.source) as string,
        pubDate: doc.pubdate as string,
        doi: doiEntry?.value ?? null,
        authors,
        lastAuthor: (doc.lastauthor as string) ?? null,
        abstract: extra?.abstract ?? '',
        mesh: extra?.mesh ?? [],
      }
    })
    .filter(Boolean)

  return NextResponse.json({ results })
}