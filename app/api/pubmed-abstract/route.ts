import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pmid = searchParams.get('pmid')?.trim()

  if (!pmid || !/^\d+$/.test(pmid)) {
    return NextResponse.json({ abstract: '', mesh: [] })
  }

  const apiKey = process.env.NCBI_API_KEY

  const url = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi')
  url.searchParams.set('db', 'pubmed')
  url.searchParams.set('retmode', 'xml')
  url.searchParams.set('id', pmid)
  if (apiKey) url.searchParams.set('api_key', apiKey)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) {
    console.error('efetch 실패:', res.status)
    return NextResponse.json({ abstract: '', mesh: [] })
  }

  const xml = await res.text()

  const abstract = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
    .map((m) => m[1])
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  const mesh = [...xml.matchAll(/<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)

  return NextResponse.json({ abstract, mesh })
}