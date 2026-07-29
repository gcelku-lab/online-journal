import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PostsListPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, updated_at, author_id')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))]

  let nameById = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)
    nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/">← 홈으로</Link></p>
      <h1>최근 글</h1>

      {(!posts || posts.length === 0) && <p>아직 게시된 글이 없습니다.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts?.map((post) => (
          <li key={post.id} style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
            <Link href={`/posts/${post.id}`} style={{ fontSize: 18, fontWeight: 500 }}>
              {post.title || '(제목 없음)'}
            </Link>
            <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>
              {nameById.get(post.author_id) ?? '알 수 없음'} · {new Date(post.updated_at).toLocaleDateString('ko-KR')}
            </p>
          </li>
        ))}
      </ul>
    </main>
  )
}