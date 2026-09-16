'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { searchTags, matchedTerm, type Tag } from '@/lib/tags/match'

export default function TagFilter({ allTags = [] }: { allTags?: Tag[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const activeIds = useMemo(
    () => (searchParams.get('tags') ?? '').split(',').filter(Boolean),
    [searchParams]
  )

  const tagById = useMemo(() => new Map(allTags.map((t) => [t.id, t])), [allTags])

  const candidates = useMemo(() => {
    const pool = query.trim()
      ? searchTags(allTags, query)
      : [...allTags].sort((a, b) => a.category.localeCompare(b.category) || a.canonical_name.localeCompare(b.canonical_name))
    return pool.filter((t) => !activeIds.includes(t.id)).slice(0, 40)
  }, [allTags, query, activeIds])

  function apply(ids: string[]) {
    const params = new URLSearchParams(searchParams.toString())
    if (ids.length > 0) params.set('tags', ids.join(','))
    else params.delete('tags')
    router.push(`${pathname}?${params.toString()}`)
  }

  const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 13,
    padding: '3px 9px',
    borderRadius: 14,
    border: '1px solid var(--border-strong)',
    background: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>태그</span>

        {activeIds.map((id) => {
          const tag = tagById.get(id)
          if (!tag) return null
          return (
            <span
              key={id}
              style={{ ...chip, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
              onClick={() => apply(activeIds.filter((x) => x !== id))}
            >
              {tag.canonical_name}
              <span style={{ opacity: 0.7, fontSize: 14, lineHeight: 1 }}>×</span>
            </span>
          )
        })}

        <button
          onClick={() => setOpen((v) => !v)}
          style={{ fontSize: 13, padding: '3px 10px', borderRadius: 14 }}
        >
          {open ? '닫기' : '+ 태그 선택'}
        </button>
      </div>

      {open && (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 12,
            background: '#fff',
          }}
        >
          <input
            type="text"
            placeholder="태그 검색 (유의어도 됩니다)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ width: '100%', fontSize: 14, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {candidates.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>일치하는 태그가 없습니다.</span>
            ) : (
              candidates.map((tag) => {
                const hit = query.trim() ? matchedTerm(tag, query) : null
                const showHit = hit && hit.toLowerCase() !== tag.canonical_name.toLowerCase()
                return (
                  <span
                    key={tag.id}
                    style={chip}
                    onClick={() => {
                      apply([...activeIds, tag.id])
                      setQuery('')
                    }}
                  >
                    {tag.canonical_name}
                    {showHit ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>← {hit}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tag.category}</span>
                    )}
                  </span>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}