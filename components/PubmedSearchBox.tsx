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
  const [manualMode, setManualMode] = useState(false)

  // 직접 입력 폼
  const [mTitle, setMTitle] = useState('')
  const [mJournal, setMJournal] = useState('')
  const [mDoi, setMDoi] = useState('')
  const [mPubDate, setMPubDate] = useState('')
  const [mAuthors, setMAuthors] = useState('')

  async function handleSearch() {
    if (!titleQuery.trim()) return
    setLoading(true)
    setSearched(true)

    const params = new URLSearchParams({ title: titleQuery })
    if (journalQuery.trim()) params.set('journal', journalQuery)

    const res = await fetch(`/api/pubmed-search?${params.toString()}`)

    if (!res.ok) {
      console.error('PubMed 검색 실패:', res.status)
      setResults([])
      setLoading(false)
      return
    }

    const data = await res.json()
    setResults(data.results ?? [])
    setLoading(false)
  }

  function handleSelect(result: Result) {
    onSelect(result)
    setResults([])
    setSearched(false)
  }

  function handleManualSubmit() {
    if (!mTitle.trim()) {
      alert('제목은 입력해주세요.')
      return
    }
    onSelect({
      pmid: '',
      title: mTitle.trim(),
      journal: mJournal.trim(),
      pubDate: mPubDate.trim(),
      doi: mDoi.trim() || null,
      authors: mAuthors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      lastAuthor: null,
    })
    setManualMode(false)
    setMTitle('')
    setMJournal('')
    setMDoi('')
    setMPubDate('')
    setMAuthors('')
    setResults([])
    setSearched(false)
  }

  if (manualMode) {
    return (
      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>논문 정보 직접 입력</p>
          <button
            onClick={() => setManualMode(false)}
            style={{ fontSize: 12, background: 'none', border: 'none', color: '#69f', cursor: 'pointer' }}
          >
            PubMed 검색으로 돌아가기
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
          bioRxiv 등 PubMed에 없는 논문은 여기에 입력하세요. DOI를 넣으면 인용수는 자동으로 조회됩니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="논문 제목 (필수)"
            value={mTitle}
            onChange={(e) => setMTitle(e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="text"
            placeholder="저널명 / 프리프린트 서버 (예: bioRxiv)"
            value={mJournal}
            onChange={(e) => setMJournal(e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="text"
            placeholder="DOI (예: 10.1101/2024.01.01.573000)"
            value={mDoi}
            onChange={(e) => setMDoi(e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="text"
            placeholder="출판일 (예: 2025 Nov)"
            value={mPubDate}
            onChange={(e) => setMPubDate(e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="text"
            placeholder="저자 (쉼표로 구분: Bae J, Chun T)"
            value={mAuthors}
            onChange={(e) => setMAuthors(e.target.value)}
            style={{ padding: 6 }}
          />
          <button onClick={handleManualSubmit} style={{ padding: '8px 14px', cursor: 'pointer' }}>
            입력 완료
          </button>
        </div>
      </div>
    )
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
              <div onClick={() => handleSelect(r)} style={{ cursor: 'pointer' }}>
                <p style={{ fontWeight: 500, fontSize: 14, margin: 0, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
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

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #222' }}>
        <button
          onClick={() => setManualMode(true)}
          style={{ fontSize: 13, background: 'none', border: 'none', color: '#69f', cursor: 'pointer', padding: 0 }}
        >
          PubMed에 없는 논문인가요? 직접 입력하기 →
        </button>
      </div>
    </div>
  )
}