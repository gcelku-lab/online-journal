'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PubmedSearchBox from './PubmedSearchBox'
import AuthorList from './AuthorList'

type Post = {
  id: string
  title: string
  content: string
  journal: string | null
  doi: string | null
  authors: string[] | null
  pub_date: string | null
  pmid: string | null
}

type PubmedResult = {
  pmid: string
  title: string
  journal: string
  pubDate: string
  doi: string | null
  authors: string[]
  lastAuthor: string | null
}

export default function PostEditor({ post }: { post: Post }) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [journal, setJournal] = useState(post.journal ?? '')
  const [doi, setDoi] = useState(post.doi ?? '')
  const [authors, setAuthors] = useState<string[]>(post.authors ?? [])
  const [pubDate, setPubDate] = useState(post.pub_date ?? '')
  const [pmid, setPmid] = useState(post.pmid ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [publishing, setPublishing] = useState(false)
  const isFirstRun = useRef(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    setSaveState('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      await supabase
        .from('posts')
        .update({ title, content, journal, doi, authors, pub_date: pubDate, pmid })
        .eq('id', post.id)
      setSaveState('saved')
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, journal, doi, authors, pubDate, pmid])

  function handlePubmedSelect(result: PubmedResult) {
    setTitle(result.title)
    setJournal(result.journal)
    setDoi(result.doi ?? '')
    setAuthors(result.authors)
    setPubDate(result.pubDate)
    setPmid(result.pmid)
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setPublishing(true)
    await supabase
      .from('posts')
      .update({ title, content, journal, doi, authors, pub_date: pubDate, pmid, status: 'published' })
      .eq('id', post.id)
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

      <PubmedSearchBox onSelect={handlePubmedSelect} />

      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: '100%',
          fontSize: 22,
          padding: 8,
          marginBottom: 8,
          border: 'none',
          borderBottom: '1px solid #333',
          background: 'transparent',
          color: 'inherit',
          lineHeight: 1.4,
        }}
      />

      <input
        type="text"
        placeholder="저널명"
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
        style={{
          width: '100%',
          fontSize: 14,
          padding: 8,
          border: 'none',
          borderBottom: '1px solid #222',
          background: 'transparent',
          color: '#aaa',
        }}
      />

      <div style={{ padding: '8px 8px 16px', fontSize: 12, color: '#888' }}>
        <AuthorList authors={authors} />
        <div style={{ marginTop: 4, overflowWrap: 'anywhere' }}>
          {pubDate && <span>{pubDate}</span>}
          {doi && <span>{pubDate && ' · '}DOI: {doi}</span>}
        </div>
      </div>

      <textarea
        placeholder="내용을 작성하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: '100%',
          minHeight: 400,
          fontSize: 16,
          padding: 8,
          border: 'none',
          resize: 'vertical',
          background: 'transparent',
          color: 'inherit',
          lineHeight: 1.7,
        }}
      />
    </main>
  )
}