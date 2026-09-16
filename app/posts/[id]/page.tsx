import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostContent from '@/components/PostContent'
import AuthorList from '@/components/AuthorList'
import { fetchPostTagIds, fetchAllTags } from '@/lib/tags/query'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()

  if (!post) notFound()
  if (post.status !== 'published' && post.author_id !== user?.id) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', post.author_id)
    .single()

  let figures: { label: string; image_url: string }[] = []
  if (post.doi) {
    const { data: figData, error: figError } = await supabase
      .from('figures')
      .select('label, image_url')
      .eq('doi', post.doi)
    if (figError) {
      console.error('figure 조회 실패:', figError.message, figError.code)
    } else {
      figures = figData ?? []
    }
  }

  const [tagIds, allTags] = await Promise.all([fetchPostTagIds(id), fetchAllTags()])
  const postTags = allTags.filter((t) => tagIds.includes(t.id))

  const isAuthor = user?.id === post.author_id

  return (
    <main style={{ maxWidth: 720, margin: '32px auto 80px', padding: '0 20px' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/posts">← 목록으로</Link>
      </p>

      {post.is_journal_club && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            color: 'var(--accent)',
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          <span className="logo-crimson" style={{ width: 20, height: 20 }} />
          저널클럽 발표 논문
          {post.journal_club_date &&
            ` · ${new Date(post.journal_club_date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`}
        </div>
      )}

      {post.status === 'draft' && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--accent)',
            background: 'var(--accent-soft)',
            padding: '6px 10px',
            borderRadius: 4,
            display: 'inline-block',
          }}
        >
          아직 게시되지 않은 초안입니다 (작성자에게만 보입니다)
        </p>
      )}

      <h1 style={{ fontSize: 25, lineHeight: 1.35, marginBottom: 10 }}>
        {post.title || '(제목 없음)'}
      </h1>

      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          paddingBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {post.journal && (
          <div style={{ overflowWrap: 'anywhere' }}>
            {post.journal}
            {post.pub_date && ` · ${post.pub_date}`}
            {typeof post.citation_count === 'number' && ` · 인용 ${post.citation_count.toLocaleString()}회`}
          </div>
        )}

        {post.authors && post.authors.length > 0 && <AuthorList authors={post.authors} />}

        {post.doi && (
          <div style={{ marginTop: 4, overflowWrap: 'anywhere' }}>
            DOI:{' '}
            <a href={`https://doi.org/${post.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              {post.doi}
            </a>
          </div>
        )}

        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>
            정리: {profile?.display_name ?? '알 수 없음'} · {new Date(post.updated_at).toLocaleDateString('ko-KR')}
          </span>
          {isAuthor && (
            <Link href={`/posts/${post.id}/edit`} style={{ color: 'var(--accent)' }}>
              수정하기
            </Link>
          )}
        </div>
      </div>

            {postTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {postTags.map((t) => (
            <Link
              key={t.id}
              href={`/search?tags=${t.id}`}
              style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {t.canonical_name}
            </Link>
          ))}
        </div>
      )}

      {postTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {postTags.map((t) => (
            <Link
              key={t.id}
              href={`/search?tags=${t.id}`}
              style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {t.canonical_name}
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <PostContent content={post.content} figures={figures} />
      </div>
    </main>
  )
}