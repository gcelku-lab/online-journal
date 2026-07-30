import Link from 'next/link'
import { Suspense } from 'react'
import { fetchPosts, fetchJournals, type SortKey } from '@/lib/posts/query'
import PostFilters from '@/components/PostFilters'
import PostList from '@/components/PostList'

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams

  const [posts, journals] = await Promise.all([
    fetchPosts({
      keyword: params.q,
      journal: params.journal,
      yearFrom: params.yearFrom ? parseInt(params.yearFrom, 10) : undefined,
      yearTo: params.yearTo ? parseInt(params.yearTo, 10) : undefined,
      sort: (params.sort as SortKey) ?? 'citation',
    }),
    fetchJournals(),
  ])

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/">← 홈으로</Link></p>
      <h1>통계</h1>
      <p style={{ fontSize: 13, color: '#888', marginTop: -8 }}>
        저널·연도·인용수 조건을 조합해서 게시물을 뽑아볼 수 있습니다.
      </p>

      <Suspense fallback={<div style={{ height: 120 }} />}>
        <PostFilters journals={journals} />
      </Suspense>

      <p style={{ fontSize: 13, color: '#888' }}>{posts.length}개의 글</p>
      <PostList posts={posts} />
    </main>
  )
}