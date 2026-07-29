import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by',
  'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of',
  'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there',
  'these', 'they', 'this', 'to', 'was', 'will', 'with',
])

function titleWords(title: string): string[] {
  return title
    .replace(/[()[\]-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w.toLowerCase()))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')?.trim()
  const journal = searchParams.get('journal')?.trim()

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const words = titleWords(title)
  if (words.length === 0) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.NCBI_API_KEY

  let term = `(${words.join(' AND ')})`
  if (journal) term += ` AND (${journal.replace(/[()[\]-]/g, ' ')}[Journal])`

  console.log('=== PubMed 검색어 ===')
  console.log(term)

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

  console.log('=== NCBI 응답 idlist ===')
  console.log(ids)

  if (ids.length === 0) {
    return NextResponse.json({ results: [] })
  }

  const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi')
  summaryUrl.searchParams.set('db', 'pubmed')
  summaryUrl.searchParams.set('retmode', 'json')
  summaryUrl.searchParams.set('id', ids.join(','))
  if (apiKey) summaryUrl.searchParams.set('api_key', apiKey)

  const summaryRes = await fetch(summaryUrl.toString(), { cache: 'no-store' })
  const summaryData = await summaryRes.json()

  const results = ids
    .map((id) => {
      const doc = summaryData.result?.[id]
      if (!doc) return null
      const doiEntry = (doc.articleids ?? []).find((a: { idtype: string }) => a.idtype === 'doi')
      const authors = (doc.authors ?? [])
        .filter((a: { authtype: string }) => a.authtype === 'Author')
        .map((a: { name: string }) => a.name)
      return {
        pmid: id,
        title: doc.title as string,
        journal: (doc.fulljournalname || doc.source) as string,
        pubDate: doc.pubdate as string,
        doi: doiEntry?.value ?? null,
        authors,
        lastAuthor: (doc.lastauthor as string) ?? null,
      }
    })
    .filter(Boolean)

  return NextResponse.json({ results })
}