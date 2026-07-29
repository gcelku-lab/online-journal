'use client'

import { useState } from 'react'
import AuthorList from './AuthorList'

type Result = {
  pmid: string
  title: string
  journal: string
  pubDate: string
  doi: string | null
  authors: string[]
  lastAuthor: string | null
}

export default function PubmedSearchBox({ onSelect }: { onSelect: (result: Result) => void }) {
  const [titleQuery, setTitleQuery] = useState('')
  const [journalQuery, setJournalQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!titleQuery.trim()) return
    setLoading(true)
    setSearched(true)

    const params = new URLSearchParams({ title: titleQuery })
    if (journalQuery.trim()) params.set('journal', journalQuery)

    const res = await fetch(`/api/pubmed-search?${params.toString()}`)
    const data = await res.json()

    setResults(data.results ?? [])
    setLoading(false)
  }

  function handleSelect(result: Result) {
    onSelect(result)
    setResults([])
    setSearched(false)
  }

  return (
    <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>PubMed에서 논문 찾기</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="논문 제목"
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: 2, padding: 6, minWidth: 0 }}
        />
        <input
          type="text"
          placeholder="저널명 (선택)"
          value={journalQuery}
          onChange={(e) => setJournalQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1, padding: 6, minWidth: 0 }}
        />
        <button onClick={handleSearch} disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? '검색 중...' : '검색'}
        </button>
      </div>

      {searched && !loading && results.length === 0 && (
        <p style={{ fontSize: 13, color: '#888' }}>검색 결과가 없습니다. 제목을 좀 더 정확히 입력해보세요.</p>
      )}

      {results.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {results.map((r) => (
            <li key={r.pmid} style={{ padding: '10px 0', borderTop: '1px solid #333' }}>
              <div
                onClick={() => handleSelect(r)}
                style={{ cursor: 'pointer' }}
              >
                <p
                  style={{
                    fontWeight: 500,
                    fontSize: 14,
                    margin: 0,
                    lineHeight: 1.4,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {r.title}
                </p>
                <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0', overflowWrap: 'anywhere' }}>
                  {r.journal} · {r.pubDate}{r.doi ? ` · DOI: ${r.doi}` : ''}
                </p>
              </div>
              <AuthorList authors={r.authors} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}