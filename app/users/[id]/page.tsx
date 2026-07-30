import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchPosts } from '@/lib/posts/query'
import { fetchProfileStats } from '@/lib/posts/profile'
import ProfileCard from '@/components/ProfileCard'
import PostList from '@/components/PostList'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const stats = await fetchProfileStats(id)
  if (!stats) notFound()

  const posts = await fetchPosts({ authorId: id, sort: 'recent' }) // draft는 자동으로 빠짐

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/users">← 사용자 검색</Link></p>
      <h1>{stats.displayName}</h1>

      <ProfileCard stats={stats} />

      <section>
        <h2 style={{ fontSize: 18 }}>게시한 글 ({posts.length})</h2>
        <PostList posts={posts} />
      </section>
    </main>
  )
}