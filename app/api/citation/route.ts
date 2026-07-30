import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const doi = searchParams.get('doi')?.trim()

  if (!doi) {
    return NextResponse.json({ error: 'doi is required' }, { status: 400 })
  }

  const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
  const mailto = process.env.OPENALEX_MAILTO

  const url = new URL(`https://api.openalex.org/works/https://doi.org/${cleanDoi}`)
  if (mailto) url.searchParams.set('mailto', mailto)

  const res = await fetch(url.toString(), { cache: 'no-store' })

  if (!res.ok) {
    console.error('OpenAlex 조회 실패:', res.status, await res.text())
    return NextResponse.json({ citationCount: null })
  }

  const data = await res.json()

  return NextResponse.json({
    citationCount: typeof data.cited_by_count === 'number' ? data.cited_by_count : null,
  })
}