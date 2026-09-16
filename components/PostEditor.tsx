'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PubmedSearchBox from './PubmedSearchBox'
import AuthorList from './AuthorList'
import PdfViewer from './PdfViewer'
import FigureCropper from './FigureCropper'
import RichEditor, { type RichEditorHandle} from './RichEditor'
import TagEditor from './TagEditor'
import type { Tag } from '@/lib/tags/match'

type Post = {
  id: string
  title: string
  content: string
  journal: string | null
  doi: string | null
  authors: string[] | null
  pub_date: string | null
  pub_year: number | null
  pmid: string | null
  citation_count: number | null
  citation_updated_at: string | null
  is_journal_club: boolean
  journal_club_date: string | null
}

type PubmedResult = {
  pmid: string
  title: string
  journal: string
  pubDate: string
  doi: string | null
  authors: string[]
  lastAuthor: string | null
  abstract: string
  mesh: string[]
}

export default function PostEditor({
  post,
  allTags,
  initialTagIds,
}: {
  post: Post
  allTags: Tag[]
  initialTagIds: string[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [journal, setJournal] = useState(post.journal ?? '')
  const [doi, setDoi] = useState(post.doi ?? '')
  const [authors, setAuthors] = useState<string[]>(post.authors ?? [])
  const [pubDate, setPubDate] = useState(post.pub_date ?? '')
  const [pubYear, setPubYear] = useState<number | null>(post.pub_year ?? null)
  const [pmid, setPmid] = useState(post.pmid ?? '')
  const [citationCount, setCitationCount] = useState<number | null>(post.citation_count)
  const [citationUpdatedAt, setCitationUpdatedAt] = useState<string | null>(post.citation_updated_at)
  const [fetchingCitation, setFetchingCitation] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [publishing, setPublishing] = useState(false)
  const [cropLabel, setCropLabel] = useState<string | null>(null)
  const [newFigureLabel, setNewFigureLabel] = useState('')
  const [pdfPageNum, setPdfPageNum] = useState(1)
  const [pdfNumPages, setPdfNumPages] = useState(0)
  const [pageCanvas, setPageCanvas] = useState<HTMLCanvasElement | null>(null)
  const [renderedPage, setRenderedPage] = useState(0)
  const [abstract, setAbstract] = useState('')
  const [meshTerms, setMeshTerms] = useState<string[]>([])
  const [isJournalClub, setIsJournalClub] = useState(post.is_journal_club ?? false)
  const [journalClubDate, setJournalClubDate] = useState(post.journal_club_date ?? '')
  const isFirstRun = useRef(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef<HTMLTextAreaElement | null>(null)
  const editorRef = useRef<RichEditorHandle | null>(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [title, content, journal, doi, authors, pubDate, pmid, citationCount, citationUpdatedAt, isJournalClub, journalClubDate])

  useEffect(() => {
    const savedPmid = post.pmid
    if (!savedPmid || abstract) return

    let cancelled = false

    async function loadAbstract() {
      try {
        const res = await fetch(`/api/pubmed-abstract?pmid=${encodeURIComponent(savedPmid!)}`)
        if (!res.ok) {
          console.error('초록 재조회 실패:', res.status)
          return
        }
        const data = await res.json()
        if (cancelled) return
        setAbstract(data.abstract ?? '')
        setMeshTerms(data.mesh ?? [])
      } catch (err) {
        console.error('초록 재조회 중 오류:', err)
      }
    }

    loadAbstract()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    setSaveState('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('posts')
        .update({
          title, content, journal, doi, authors,
          pub_date: pubDate, pub_year: pubYear, pmid,
          citation_count: citationCount,
          citation_updated_at: citationUpdatedAt,
          is_journal_club: isJournalClub,
          journal_club_date: isJournalClub && journalClubDate ? journalClubDate : null,
        })
        .eq('id', post.id)

      if (error) {
        console.error('저장 실패:', error.message, error.code, error.details)
        setSaveState('idle')
        return
      }
      setSaveState('saved')
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, journal, doi, authors, pubDate, pubYear, pmid, citationCount, citationUpdatedAt])

  async function fetchCitation(targetDoi: string) {
    if (!targetDoi.trim()) return
    setFetchingCitation(true)
    try {
      const res = await fetch(`/api/citation?doi=${encodeURIComponent(targetDoi)}`)
      const data = await res.json()
      if (typeof data.citationCount === 'number') {
        setCitationCount(data.citationCount)
        setCitationUpdatedAt(new Date().toISOString())
      } else {
        alert('인용수를 찾을 수 없습니다. DOI를 확인해주세요.')
      }
    } finally {
      setFetchingCitation(false)
    }
  }

  function handlePubmedSelect(result: PubmedResult) {
    setTitle(result.title)
    setJournal(result.journal)
    setDoi(result.doi ?? '')
    setAuthors(result.authors)
    setPubDate(result.pubDate)
    const yearMatch = (result.pubDate ?? '').match(/\b(?:19|20)\d{2}\b/)
    setPubYear(yearMatch ? parseInt(yearMatch[0], 10) : null)
    setPmid(result.pmid)
    setAbstract(result.abstract ?? '')
    setMeshTerms(result.mesh ?? [])
    if (result.doi) fetchCitation(result.doi)
  }

  function startCrop() {
    const label = newFigureLabel.trim()
    if (!label) {
      alert('예: Figure 1A 처럼 라벨을 입력해주세요.')
      return
    }
    if (!doi.trim()) {
      alert('먼저 논문 정보(DOI)를 입력해주세요. figure는 논문 단위로 저장됩니다.')
      return
    }
    if (!pageCanvas) {
      alert('먼저 PDF를 열고 해당 figure가 있는 페이지로 이동해주세요.')
      return
    }
    setCropLabel(label)
  }

  async function handleCropSaved(url: string) {
    const label = cropLabel
    setCropLabel(null)
    if (!label) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('figures')
      .upsert({ doi: doi.trim(), label, image_url: url, created_by: user.id }, { onConflict: 'doi,label' })

    if (error) {
      console.error('figure 저장 실패:', error.message, error.code, error.details)
      alert('figure 정보 저장에 실패했습니다. 콘솔을 확인해주세요.')
      return
    }

    editorRef.current?.insertText(`<|${label}|>`)
    setNewFigureLabel('')
  }

  async function handlePublish() {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setPublishing(true)

    const { data, error } = await supabase
      .from('posts')
      .update({
        title, content, journal, doi, authors,
        pub_date: pubDate, pub_year: pubYear, pmid,
        citation_count: citationCount,
        citation_updated_at: citationUpdatedAt,
        is_journal_club: isJournalClub,
        journal_club_date: isJournalClub && journalClubDate ? journalClubDate : null,
        status: 'published',
      })
      .eq('id', post.id)
      .select()

    setPublishing(false)

    if (error) {
      console.error('게시 실패:', error.message, error.code, error.details)
      alert('게시에 실패했습니다. 콘솔을 확인해주세요.')
      return
    }

    if (!data || data.length === 0) {
      console.error('게시 실패: 업데이트된 행이 0개입니다. RLS 권한 문제일 가능성이 높습니다.')
      alert('게시에 실패했습니다 (권한 문제로 보입니다). 콘솔을 확인해주세요.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main style={{ maxWidth: 760, margin: '32px auto 80px', padding: '0 20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {saveState === 'saving' && '저장 중'}
          {saveState === 'saved' && '저장됨'}
        </span>
        <button
          onClick={handlePublish}
          disabled={publishing}
          style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', fontWeight: 500 }}
        >
          {publishing ? '게시 중' : '게시하기'}
        </button>
      </div>

      <PubmedSearchBox onSelect={handlePubmedSelect} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isJournalClub}
            onChange={(e) => setIsJournalClub(e.target.checked)}
            style={{ padding: 0 }}
          />
          저널클럽 발표 논문
        </label>

        {isJournalClub && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
            발표일
            <input
              type="date"
              value={journalClubDate}
              onChange={(e) => setJournalClubDate(e.target.value)}
              style={{ fontSize: 13, padding: '5px 8px' }}
            />
          </label>
        )}
      </div>

      <textarea
        ref={titleRef}
        placeholder="논문 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        rows={1}
        style={{
          width: '100%',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          padding: '4px 0',
          marginBottom: 4,
          border: 'none',
          background: 'transparent',
          lineHeight: 1.35,
          resize: 'none',
          overflow: 'hidden',
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
          padding: '4px 0',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted)',
        }}
      />

      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          padding: '12px 0 16px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 24,
        }}
      >
        <AuthorList authors={authors} />

        <div style={{ marginTop: 4, overflowWrap: 'anywhere' }}>
          {pubDate && <span>{pubDate}</span>}
          {doi && <span>{pubDate && ' · '}DOI: {doi}</span>}
        </div>

        <div style={{ marginTop: 4 }}>
          {citationCount !== null ? (
            <span>
              인용 {citationCount.toLocaleString()}회
              {citationUpdatedAt && (
                <span style={{ color: 'var(--border-strong)' }}>
                  {' '}({new Date(citationUpdatedAt).toLocaleDateString('ko-KR')} 기준)
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: 'var(--border-strong)' }}>인용수 정보 없음</span>
          )}
          {doi && (
            <button
              onClick={() => fetchCitation(doi)}
              disabled={fetchingCitation}
              style={{ marginLeft: 8, fontSize: 11, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
            >
              {fetchingCitation ? '조회 중' : '새로고침'}
            </button>
          )}
        </div>
      </div>

      <TagEditor
        postId={post.id}
        allTags={allTags}
        initialTagIds={initialTagIds}
        suggestSource={{ title, abstract, mesh: meshTerms}}
      />

      <PdfViewer
        onPageRender={(canvas, n) => { setPageCanvas(canvas); setRenderedPage(n) }}
        pageNum={pdfPageNum}
        onPageChange={setPdfPageNum}
        onNumPagesChange={setPdfNumPages}
      />

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          background: 'var(--surface)',
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: 10 }}>Figure 잘라내기</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="예: Figure 1A"
            value={newFigureLabel}
            onChange={(e) => setNewFigureLabel(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button onClick={startCrop}>영역 선택하기</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
          저장하면 본문 끝에 {'<|라벨|>'} 이 추가되고, 글 보기 화면에서 이미지로 표시됩니다.
        </p>
      </div>

      <RichEditor ref={editorRef} content={content} onChange={setContent} />

      {cropLabel && pageCanvas && (
        <FigureCropper
          canvas={pageCanvas}
          pageNum={renderedPage}
          label={cropLabel}
          doi={doi.trim()}
          onSaved={handleCropSaved}
          onCancel={() => setCropLabel(null)}
          onPrevPage={() => setPdfPageNum((n) => Math.max(1, n - 1))}
          onNextPage={() => setPdfPageNum((n) => Math.min(pdfNumPages, n + 1))}
          pageInfo={`${pdfPageNum} / ${pdfNumPages}`}
        />
      )}
    </main>
  )
}