import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchPosts } from '@/lib/posts/query'
import { fetchProfileStats } from '@/lib/posts/profile'
import ProfileCard from '@/components/ProfileCard'
import PostList from '@/components/PostList'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await fetchProfileStats(user.id)
  const allPosts = await fetchPosts({ authorId: user.id, includeDrafts: true, sort: 'recent' })
  const published = allPosts.filter((p) => p.status === 'published')
  const drafts = allPosts.filter((p) => p.status === 'draft')

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/">← 홈으로</Link></p>
      <h1>마이페이지</h1>

      {stats && <ProfileCard stats={stats} />}

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18 }}>게시한 글 ({published.length})</h2>
        <PostList posts={published} selectable />
      </section>

      <section>
        <h2 style={{ fontSize: 18 }}>작성 중인 초안 ({drafts.length})</h2>
        <PostList posts={drafts} selectable />
      </section>
    </main>
  )
}