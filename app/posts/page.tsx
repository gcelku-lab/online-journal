import Link from 'next/link'
import { Suspense } from 'react'
import { fetchPosts, fetchJournals, type SortKey } from '@/lib/posts/query'
import { fetchAllTags } from '@/lib/tags/query'
import PostFilters from '@/components/PostFilters'
import PostList from '@/components/PostList'
import Pagination from '@/components/Pagination'

const PER_PAGE = 10

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const [{ posts, total }, journals, allTags] = await Promise.all([
    fetchPosts({
      keyword: params.q,
      journalClubOnly: params.jc === '1',
      tagIds: (params.tags ?? '').split(',').filter(Boolean),
      journal: params.journal,
      yearFrom: params.yearFrom ? parseInt(params.yearFrom, 10) : undefined,
      yearTo: params.yearTo ? parseInt(params.yearTo, 10) : undefined,
      sort: (params.sort as SortKey) ?? 'recent',
      page,
      perPage: PER_PAGE,
    }),
    fetchJournals(),
    fetchAllTags(),
  ])

  return (
    <main style={{ maxWidth: 760, margin: '32px auto 80px', padding: '0 20px' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/">← 홈으로</Link>
      </p>
      <h1>전체 글</h1>

      <Suspense fallback={<div style={{ height: 200 }} />}>
        <PostFilters journals={journals} allTags={allTags} />
      </Suspense>

      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total}개의 글</p>
      <PostList posts={posts} />

      <Suspense fallback={null}>
        <Pagination total={total} perPage={PER_PAGE} currentPage={page} />
      </Suspense>
    </main>
  )
}