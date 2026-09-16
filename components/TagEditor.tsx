'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { searchTags, suggestTags, matchedTerm, type Tag } from '@/lib/tags/match'

export default function TagEditor({
  postId,
  allTags,
  initialTagIds,
  suggestSource,
}: {
  postId: string
  allTags: Tag[]
  initialTagIds: string[]
  suggestSource: { title?: string; abstract?: string; mesh?: string[] }
}) {
  const supabase = createClient()
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTagIds))
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  const tagById = useMemo(() => new Map(allTags.map((t) => [t.id, t])), [allTags])

  const suggestions = useMemo(() => {
    if (!suggestSource.title && !suggestSource.abstract) return []
    return suggestTags(allTags, suggestSource)
      .filter((id) => !selected.has(id))
      .slice(0, 10)
  }, [allTags, suggestSource, selected])

  const searchResults = useMemo(
    () => searchTags(allTags, query).filter((t) => !selected.has(t.id)).slice(0, 12),
    [allTags, query, selected]
  )

  async function addTag(tagId: string) {
    if (selected.has(tagId) || busy) return
    setBusy(true)
    setSelected((prev) => new Set([...prev, tagId]))

    const { error } = await supabase
      .from('post_tags')
      .upsert({ post_id: postId, tag_id: tagId }, { onConflict: 'post_id,tag_id' })

    setBusy(false)
    if (error) {
      console.error('태그 추가 실패:', error.message, error.code, error.details)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(tagId)
        return next
      })
      alert('태그 추가에 실패했습니다. 콘솔을 확인해주세요.')
    }
  }

  async function removeTag(tagId: string) {
    if (busy) return
    setBusy(true)
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(tagId)
      return next
    })

    const { error } = await supabase
      .from('post_tags')
      .delete()
      .eq('post_id', postId)
      .eq('tag_id', tagId)

    setBusy(false)
    if (error) {
      console.error('태그 삭제 실패:', error.message, error.code, error.details)
      setSelected((prev) => new Set([...prev, tagId]))
      alert('태그 삭제에 실패했습니다. 콘솔을 확인해주세요.')
    }
  }

  const chipBase: React.CSSProperties = {
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

  const selectedTags = [...selected]
    .map((id) => tagById.get(id))
    .filter((t): t is Tag => !!t)
    .sort((a, b) => a.category.localeCompare(b.category) || a.canonical_name.localeCompare(b.canonical_name))

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        background: 'var(--surface)',
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: 10 }}>태그</p>

      {/* 선택된 태그 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, minHeight: 26 }}>
        {selectedTags.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>아직 선택한 태그가 없습니다.</span>
        ) : (
          selectedTags.map((tag) => (
            <span
              key={tag.id}
              style={{
                ...chipBase,
                background: 'var(--accent)',
                borderColor: 'var(--accent)',
                color: '#fff',
              }}
              onClick={() => removeTag(tag.id)}
              title="클릭하면 제거됩니다"
            >
              {tag.canonical_name}
              <span style={{ opacity: 0.7, fontSize: 14, lineHeight: 1 }}>×</span>
            </span>
          ))
        )}
      </div>

      {/* 자동 제안 */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>
            초록에서 추천된 태그 (클릭하면 추가)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((id) => {
              const tag = tagById.get(id)
              if (!tag) return null
              return (
                <span key={id} style={chipBase} onClick={() => addTag(id)}>
                  + {tag.canonical_name}
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tag.category}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* 검색 피커 */}
      <input
        type="text"
        placeholder="태그 검색 (예: OXPHOS, memory, CXCL)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', fontSize: 14 }}
      />

      {query.trim() && (
        <div style={{ marginTop: 8 }}>
          {searchResults.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              일치하는 태그가 없습니다.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {searchResults.map((tag) => {
                const hit = matchedTerm(tag, query)
                const showHit = hit && hit.toLowerCase() !== tag.canonical_name.toLowerCase()
                return (
                  <span key={tag.id} style={chipBase} onClick={() => addTag(tag.id)}>
                    + {tag.canonical_name}
                    {showHit && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>← {hit}</span>
                    )}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}