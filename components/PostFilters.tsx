'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const SORT_OPTIONS = [
  { key: 'recent', label: '최근 수정순' },
  { key: 'citation', label: '인용수순' },
  { key: 'pubdate', label: '출판연도순' },
  { key: 'oldest', label: '오래된순' },
]

export default function PostFilters({
  journals,
  autoFocusKeyword = false,
}: {
  journals: string[]
  autoFocusKeyword?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '')
  const [journal, setJournal] = useState(searchParams.get('journal') ?? '')
  const [yearFrom, setYearFrom] = useState(searchParams.get('yearFrom') ?? '')
  const [yearTo, setYearTo] = useState(searchParams.get('yearTo') ?? '')

  useEffect(() => {
    setKeyword(searchParams.get('q') ?? '')
    setJournal(searchParams.get('journal') ?? '')
    setYearFrom(searchParams.get('yearFrom') ?? '')
    setYearTo(searchParams.get('yearTo') ?? '')
  }, [searchParams])

  const currentSort = searchParams.get('sort') ?? 'recent'

  function applyFilters(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams(searchParams.toString())
    const next: Record<string, string> = { q: keyword, journal, yearFrom, yearTo, ...overrides }

    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  function resetFilters() {
    router.push(pathname)
  }

  const hasActiveFilter = keyword || journal || yearFrom || yearTo || currentSort !== 'recent'

  return (
    <div style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="제목·내용·저널에서 검색"
          value={keyword}
          autoFocus={autoFocusKeyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          style={{ width: '100%', padding: 8, fontSize: 15, boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#888', marginRight: 8 }}>정렬</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => applyFilters({ sort: opt.key === 'recent' ? '' : opt.key })}
            style={{
              marginRight: 6,
              padding: '4px 10px',
              fontSize: 13,
              borderRadius: 4,
              border: '1px solid #444',
              background: currentSort === opt.key ? '#2563eb' : 'transparent',
              color: currentSort === opt.key ? '#fff' : 'inherit',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          list="journal-options"
          placeholder="저널명 (일부만 입력해도 됨)"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          style={{ flex: '1 1 220px', padding: 6, minWidth: 0 }}
        />
        <datalist id="journal-options">
          {journals.map((j) => (
            <option key={j} value={j} />
          ))}
        </datalist>

        <input
          type="number"
          placeholder="시작 연도"
          value={yearFrom}
          onChange={(e) => setYearFrom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          style={{ width: 100, padding: 6 }}
        />
        <span style={{ color: '#888' }}>~</span>
        <input
          type="number"
          placeholder="끝 연도"
          value={yearTo}
          onChange={(e) => setYearTo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          style={{ width: 100, padding: 6 }}
        />

        <button onClick={() => applyFilters()} style={{ padding: '6px 14px', cursor: 'pointer' }}>
          적용
        </button>

        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            style={{ padding: '6px 10px', fontSize: 13, background: 'none', border: 'none', color: '#69f', cursor: 'pointer' }}
          >
            초기화
          </button>
        )}
      </div>
    </div>
  )
}