'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Post = {
  id: string
  title: string
  content: string
}

export default function PostEditor({ post }: { post: Post }) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [publishing, setPublishing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (title === post.title && content === post.content) return

    setSaveState('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      await supabase.from('posts').update({ title, content }).eq('id', post.id)
      setSaveState('saved')
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content])

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setPublishing(true)
    await supabase.from('posts').update({ title, content, status: 'published' }).eq('id', post.id)
    setPublishing(false)
    router.push('/')
    router.refresh()
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: '#888' }}>
          {saveState === 'saving' && '저장 중...'}
          {saveState === 'saved' && '저장됨'}
        </span>
        <button onClick={handlePublish} disabled={publishing}>
          {publishing ? '게시 중...' : '게시하기'}
        </button>
      </div>

      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', fontSize: 24, padding: 8, marginBottom: 16, border: 'none', borderBottom: '1px solid #ddd' }}
      />

      <textarea
        placeholder="내용을 작성하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: '100%', minHeight: 400, fontSize: 16, padding: 8, border: 'none', resize: 'vertical' }}
      />
    </main>
  )
}