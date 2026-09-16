'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CommentItem } from '@/lib/comments/query'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CommentSection({
  postId,
  comments,
  currentUserId,
}: {
  postId: string
  comments: CommentItem[]
  currentUserId: string | null
}) {
  const router = useRouter()
  const supabase = createClient()

  const [newText, setNewText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [busy, setBusy] = useState(false)

  const roots = comments.filter((c) => !c.parent_id)
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id)

  async function submitComment(content: string, parentId: string | null) {
    const text = content.trim()
    if (!text || !currentUserId) return

    setBusy(true)
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: currentUserId,
      parent_id: parentId,
      content: text,
    })
    setBusy(false)

    if (error) {
      console.error('댓글 등록 실패:', error.message, error.code, error.details)
      alert('댓글 등록에 실패했습니다. 콘솔을 확인해주세요.')
      return
    }

    if (parentId) {
      setReplyText('')
      setReplyTo(null)
    } else {
      setNewText('')
    }
    router.refresh()
  }

  async function saveEdit(id: string) {
    const text = editText.trim()
    if (!text) return

    setBusy(true)
    const { data, error } = await supabase
      .from('comments')
      .update({ content: text })
      .eq('id', id)
      .select('id')
    setBusy(false)

    if (error || !data || data.length === 0) {
      console.error('댓글 수정 실패:', error?.message, error?.code)
      alert('댓글 수정에 실패했습니다.')
      return
    }

    setEditingId(null)
    setEditText('')
    router.refresh()
  }

  async function deleteComment(id: string) {
    if (!window.confirm('이 댓글을 삭제할까요? 답글도 함께 삭제됩니다.')) return

    setBusy(true)
    const { data, error } = await supabase.from('comments').delete().eq('id', id).select('id')
    setBusy(false)

    if (error || !data || data.length === 0) {
      console.error('댓글 삭제 실패:', error?.message, error?.code)
      alert('댓글 삭제에 실패했습니다.')
      return
    }
    router.refresh()
  }

  const linkBtn: React.CSSProperties = {
    fontSize: 12,
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: 0,
  }

  function renderComment(c: CommentItem, isReply: boolean) {
    const isMine = currentUserId === c.author_id
    const edited = c.created_at !== c.updated_at

    return (
      <div
        key={c.id}
        style={{
          padding: '12px 0',
          borderTop: '1px solid var(--border)',
          marginLeft: isReply ? 24 : 0,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{c.author_name}</strong>
          {' · '}
          {formatTime(c.created_at)}
          {edited && ' (수정됨)'}
        </div>

        {editingId === c.id ? (
          <div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              style={{ width: '100%', fontSize: 14, marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => saveEdit(c.id)} disabled={busy} style={{ fontSize: 13, padding: '3px 12px' }}>
                저장
              </button>
              <button onClick={() => setEditingId(null)} style={{ fontSize: 13, padding: '3px 12px' }}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
              {c.content}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              {currentUserId && !isReply && (
                <button
                  onClick={() => {
                    setReplyTo(replyTo === c.id ? null : c.id)
                    setReplyText('')
                  }}
                  style={linkBtn}
                >
                  {replyTo === c.id ? '답글 취소' : '답글'}
                </button>
              )}
              {isMine && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(c.id)
                      setEditText(c.content)
                    }}
                    style={linkBtn}
                  >
                    수정
                  </button>
                  <button onClick={() => deleteComment(c.id)} style={linkBtn}>
                    삭제
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {replyTo === c.id && (
          <div style={{ marginTop: 10, marginLeft: 24 }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 입력하세요"
              rows={2}
              style={{ width: '100%', fontSize: 14, marginBottom: 6 }}
            />
            <button
              onClick={() => submitComment(replyText, c.id)}
              disabled={busy || !replyText.trim()}
              style={{ fontSize: 13, padding: '3px 12px' }}
            >
              답글 등록
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <section style={{ marginTop: 48 }}>
      <h2>댓글 {comments.length > 0 && `(${comments.length})`}</h2>

      {currentUserId ? (
        <div style={{ marginBottom: 8 }}>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="이 논문에 대한 의견을 남겨보세요."
            rows={3}
            style={{ width: '100%', fontSize: 14, marginBottom: 6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => submitComment(newText, null)}
              disabled={busy || !newText.trim()}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                borderColor: 'var(--accent)',
                fontSize: 13,
                padding: '5px 16px',
              }}
            >
              등록
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          댓글을 쓰려면 로그인이 필요합니다.
        </p>
      )}

      {comments.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '16px 0' }}>
          아직 댓글이 없습니다.
        </p>
      ) : (
        <div>
          {roots.map((root) => (
            <div key={root.id}>
              {renderComment(root, false)}
              {repliesOf(root.id).map((reply) => renderComment(reply, true))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}