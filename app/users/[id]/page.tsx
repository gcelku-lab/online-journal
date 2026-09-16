import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { fetchPosts } from '@/lib/posts/query'
import { fetchProfileStats } from '@/lib/posts/profile'
import ProfileCard from '@/components/ProfileCard'
import PostList from '@/components/PostList'
import Pagination from '@/components/Pagination'
import UserPostSearch from '@/components/UserPostSearch'

const PER_PAGE = 10

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { id } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const stats = await fetchProfileStats(id)
  if (!stats) notFound()

  const { posts, total } = await fetchPosts({
    authorId: id,
    keyword: sp.q,
    sort: 'recent',
    page,
    perPage: PER_PAGE,
  })

  return (
    <main style={{ maxWidth: 760, margin: '32px auto 80px', padding: '0 20px' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/users">← 사용자 검색</Link>
      </p>
      <h1>{stats.displayName}</h1>

      <ProfileCard stats={stats} />

      <section>
        <h2>게시한 글 ({total})</h2>

        <Suspense fallback={<div style={{ height: 50 }} />}>
          <UserPostSearch />
        </Suspense>

        <PostList posts={posts} />

        <Suspense fallback={null}>
          <Pagination total={total} perPage={PER_PAGE} currentPage={page} />
        </Suspense>
      </section>
    </main>
  )
}