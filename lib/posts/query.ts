import { createClient } from '@/lib/supabase/server'

export type SortKey = 'recent' | 'citation' | 'pubdate' | 'oldest'

export type PostFilters = {
  keyword?: string
  journal?: string
  authorId?: string
  yearFrom?: number
  yearTo?: number
  sort?: SortKey
  includeDrafts?: boolean
  journalClubOnly?: boolean
  tagIds?: string[]
}

export type PostListItem = {
  id: string
  title: string
  journal: string | null
  doi: string | null
  authors: string[] | null
  pub_date: string | null
  citation_count: number | null
  is_journal_club: boolean
  journal_club_date: string | null
  status: string
  updated_at: string
  created_at: string
  author_id: string
  author_name: string
  tags: { id: string; canonical_name: string }[]
}

export function extractYear(pubDate: string | null): number | null {
  if (!pubDate) return null
  const match = pubDate.match(/\b(19|20)\d{2}\b/)
  return match ? parseInt(match[0], 10) : null
}

export async function fetchPosts(filters: PostFilters = {}): Promise<PostListItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select(
      'id, title, journal, doi, authors, pub_date, citation_count, is_journal_club, journal_club_date, status, updated_at, created_at, author_id'
    )

  if (!filters.includeDrafts) {
    query = query.eq('status', 'published')
  }

  if (filters.authorId) {
    query = query.eq('author_id', filters.authorId)
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    const { data: matched, error: tagErr } = await supabase
      .from('post_tags')
      .select('post_id')
      .in('tag_id', filters.tagIds)

    if (tagErr) {
      console.error('태그 필터 조회 실패:', tagErr.message, tagErr.code)
      return []
    }

    const ids = [...new Set((matched ?? []).map((r) => r.post_id as string))]
    if (ids.length === 0) return []
    query = query.in('id', ids)
  }

  if (filters.journalClubOnly) {
    query = query.eq('is_journal_club', true)
  }

  if (filters.journal) {
    query = query.ilike('journal', `%${filters.journal}%`)
  }

  if (filters.keyword) {
    const k = filters.keyword
    query = query.or(`title.ilike.%${k}%,content.ilike.%${k}%,journal.ilike.%${k}%`)
  }

  switch (filters.sort) {
    case 'citation':
      query = query.order('citation_count', { ascending: false, nullsFirst: false })
      break
    case 'oldest':
      query = query.order('updated_at', { ascending: true })
      break
    default:
      query = query.order('updated_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('게시물 조회 실패:', error.message, error.code, error.details)
    return []
  }

  const posts = data ?? []

  const authorIds = [...new Set(posts.map((p) => p.author_id))]
  const nameById = new Map<string, string>()

  if (authorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)

    if (profileError) {
      console.error('프로필 조회 실패:', profileError.message, profileError.code)
    } else {
      for (const p of profiles ?? []) nameById.set(p.id, p.display_name)
    }
  }

    const postIds = posts.map((p) => p.id as string)
  const tagsByPost = new Map<string, { id: string; canonical_name: string }[]>()

  if (postIds.length > 0) {
    const { data: tagRows, error: tagRowErr } = await supabase
      .from('post_tags')
      .select('post_id, tags(id, canonical_name)')
      .in('post_id', postIds)

    if (tagRowErr) {
      console.error('게시물 태그 조회 실패:', tagRowErr.message, tagRowErr.code)
    } else {
      for (const row of tagRows ?? []) {
        const tag = row.tags as unknown as { id: string; canonical_name: string } | null
        if (!tag) continue
        const list = tagsByPost.get(row.post_id as string) ?? []
        list.push(tag)
        tagsByPost.set(row.post_id as string, list)
      }
    }
  }

  let result: PostListItem[] = posts.map((p) => ({
    ...p,
    author_name: nameById.get(p.author_id) ?? '알 수 없음',
    tags: (tagsByPost.get(p.id as string) ?? []).sort((a, b) =>
      a.canonical_name.localeCompare(b.canonical_name)
    ),
  }))

  if (filters.yearFrom || filters.yearTo) {
    result = result.filter((p) => {
      const year = extractYear(p.pub_date)
      if (year === null) return false
      if (filters.yearFrom && year < filters.yearFrom) return false
      if (filters.yearTo && year > filters.yearTo) return false
      return true
    })
  }

  if (filters.sort === 'pubdate') {
    result.sort((a, b) => (extractYear(b.pub_date) ?? 0) - (extractYear(a.pub_date) ?? 0))
  }

  return result
}

export async function fetchJournals(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('journal')
    .eq('status', 'published')
    .not('journal', 'is', null)

  if (error) {
    console.error('저널 목록 조회 실패:', error.message, error.code)
    return []
  }

  const set = new Set((data ?? []).map((r) => r.journal as string).filter(Boolean))
  return [...set].sort()
}