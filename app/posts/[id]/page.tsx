import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostContent from '@/components/PostContent'

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
  

  const isAuthor = user?.id === post.author_id


  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/posts">← 목록으로</Link></p>

      {post.status === 'draft' && (
        <p style={{ color: '#b45309', fontSize: 13 }}>이 글은 아직 게시되지 않은 초안입니다 (작성자에게만 보임)</p>
      )}

      <h1>{post.title || '(제목 없음)'}</h1>
      <p style={{ color: '#888', fontSize: 14 }}>
        {profile?.display_name ?? '알 수 없음'} · {new Date(post.updated_at).toLocaleDateString('ko-KR')}
      </p>

      {isAuthor && <p><Link href={`/posts/${post.id}/edit`}>수정하기</Link></p>}

      <div style={{ marginTop: 24 }}>
        <PostContent content={post.content} figures={figures} />
      </div>
    </main>
  )
}