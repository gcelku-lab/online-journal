import Link from 'next/link'
import { Suspense } from 'react'
import { fetchPosts, fetchJournals, type SortKey } from '@/lib/posts/query'
import { fetchAllTags } from '@/lib/tags/query'
import PostFilters from '@/components/PostFilters'
import PostList from '@/components/PostList'
import Pagination from '@/components/Pagination'

const PER_PAGE = 10

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const tagIds = (params.tags ?? '').split(',').filter(Boolean)
  const hasQuery = Boolean(
    params.q?.trim() ||
      params.journal?.trim() ||
      params.yearFrom ||
      params.yearTo ||
      params.jc === '1' ||
      tagIds.length > 0
  )

  const [{ posts, total }, journals, allTags] = await Promise.all([
    hasQuery
      ? fetchPosts({
          keyword: params.q,
          journalClubOnly: params.jc === '1',
          tagIds,
          journal: params.journal,
          yearFrom: params.yearFrom ? parseInt(params.yearFrom, 10) : undefined,
          yearTo: params.yearTo ? parseInt(params.yearTo, 10) : undefined,
          sort: (params.sort as SortKey) ?? 'recent',
          page,
          perPage: PER_PAGE,
        })
      : Promise.resolve({ posts: [], total: 0 }),
    fetchJournals(),
    fetchAllTags(),
  ])

  return (
    <main style={{ maxWidth: 760, margin: '32px auto 80px', padding: '0 20px' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/">← 홈으로</Link>
      </p>
      <h1>검색</h1>

      <Suspense fallback={<div style={{ height: 200 }} />}>
        <PostFilters journals={journals} allTags={allTags} autoFocusKeyword />
      </Suspense>

      {!hasQuery ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '24px 0' }}>
          검색어를 입력하거나 태그·저널·연도 조건을 선택하세요.
        </p>
      ) : total === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '24px 0' }}>
          조건에 맞는 글이 없습니다.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total}개의 결과</p>
          <PostList posts={posts} />
          <Suspense fallback={null}>
            <Pagination total={total} perPage={PER_PAGE} currentPage={page} />
          </Suspense>
        </>
      )}
    </main>
  )
}