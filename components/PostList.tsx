'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { PostListItem } from '@/lib/posts/query'
import AuthorList from './AuthorList'
import { createClient } from '@/lib/supabase/client'

export default function PostList({
  posts,
  selectable = false,
}: {
  posts: PostListItem[]
  selectable?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState(posts)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setItems(posts)
    setSelected(new Set())
  }, [posts])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(selected.size === items.length ? new Set() : new Set(items.map((p) => p.id)))
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return
    const ok = window.confirm(`선택한 ${selected.size}개 글을 삭제할까요? 되돌릴 수 없습니다.`)
    if (!ok) return

    setDeleting(true)
    const ids = [...selected]
    const { data, error } = await supabase.from('posts').delete().in('id', ids).select('id')
    setDeleting(false)

    if (error) {
      console.error('삭제 실패:', error.message, error.code, error.details)
      alert('삭제에 실패했습니다. 콘솔을 확인해주세요.')
      return
    }

    const deletedIds = new Set((data ?? []).map((d) => d.id as string))
    if (deletedIds.size !== ids.length) {
      console.error('일부 삭제 실패: 요청', ids.length, '실제 삭제', deletedIds.size)
      alert('일부 글은 삭제되지 않았습니다 (권한 문제로 보입니다). 콘솔을 확인해주세요.')
    }

    setItems((prev) => prev.filter((p) => !deletedIds.has(p.id)))
    setSelected(new Set())
    router.refresh()
  }

  if (items.length === 0) {
    return <p style={{ color: '#888', fontSize: 14, padding: '24px 0' }}>조건에 맞는 글이 없습니다.</p>
  }

  return (
    <div>
      {selectable && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.size === items.length} onChange={toggleAll} />
            전체 선택
          </label>
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              style={{
                fontSize: 13,
                color: '#e11',
                background: 'none',
                border: '1px solid #e11',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              {deleting ? '삭제 중...' : `선택 삭제 (${selected.size})`}
            </button>
          )}
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((post) => (
          <li key={post.id} style={{ padding: '16px 0', borderBottom: '1px solid #eee', display: 'flex', gap: 10 }}>
            {selectable && (
              <input
                type="checkbox"
                checked={selected.has(post.id)}
                onChange={() => toggle(post.id)}
                style={{ marginTop: 6, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                href={`/posts/${post.id}`}
                style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.4, overflowWrap: 'anywhere', display: 'block' }}
              >
                {post.title || '(제목 없음)'}
                {post.status === 'draft' && (
                  <span style={{ fontSize: 12, color: '#b45309', marginLeft: 6 }}>초안</span>
                )}
              </Link>

              {post.journal && (
                <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0', overflowWrap: 'anywhere' }}>
                  {post.journal}
                  {post.pub_date && ` · ${post.pub_date}`}
                  {typeof post.citation_count === 'number' && ` · 인용 ${post.citation_count.toLocaleString()}회`}
                </p>
              )}

              {post.authors && post.authors.length > 0 && <AuthorList authors={post.authors} />}

              <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>
                정리: {post.author_name} · {new Date(post.updated_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}