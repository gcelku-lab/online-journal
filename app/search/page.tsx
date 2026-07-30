import Link from 'next/link'
import { Suspense } from 'react'
import { fetchPosts, fetchJournals, type SortKey } from '@/lib/posts/query'
import PostFilters from '@/components/PostFilters'
import PostList from '@/components/PostList'

export default async function SearchPage({
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
      sort: (params.sort as SortKey) ?? 'recent',
    }),
    fetchJournals(),
  ])

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/">← 홈으로</Link></p>
      <h1>검색</h1>

      <Suspense fallback={<div style={{ height: 160 }} />}>
        <PostFilters journals={journals} autoFocusKeyword />
      </Suspense>

      {params.q && <p style={{ fontSize: 13, color: '#888' }}>{posts.length}개의 결과</p>}
      <PostList posts={posts} />
    </main>
  )
}