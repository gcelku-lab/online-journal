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
}

export type PostListItem = {
  id: string
  title: string
  journal: string | null
  doi: string | null
  authors: string[] | null
  pub_date: string | null
  citation_count: number | null
  status: string
  updated_at: string
  created_at: string
  author_id: string
  author_name: string
}

/** "2025 Nov", "2026 Jul 24" 같은 PubMed 날짜 문자열에서 연도만 뽑아냄 */
export function extractYear(pubDate: string | null): number | null {
  if (!pubDate) return null
  const match = pubDate.match(/\b(19|20)\d{2}\b/)
  return match ? parseInt(match[0], 10) : null
}

export async function fetchPosts(filters: PostFilters = {}): Promise<PostListItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select('id, title, journal, doi, authors, pub_date, citation_count, status, updated_at, created_at, author_id')

  if (!filters.includeDrafts) {
    query = query.eq('status', 'published')
  }

  if (filters.authorId) {
    query = query.eq('author_id', filters.authorId)
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

  // 작성자 이름 붙이기
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

  let result: PostListItem[] = posts.map((p) => ({
    ...p,
    author_name: nameById.get(p.author_id) ?? '알 수 없음',
  }))

  // 연도 필터 (pub_date가 자유 형식 문자열이라 DB가 아닌 여기서 처리)
  if (filters.yearFrom || filters.yearTo) {
    result = result.filter((p) => {
      const year = extractYear(p.pub_date)
      if (year === null) return false
      if (filters.yearFrom && year < filters.yearFrom) return false
      if (filters.yearTo && year > filters.yearTo) return false
      return true
    })
  }

  // 출판연도순 정렬 (연도 추출이 필요해서 여기서 처리)
  if (filters.sort === 'pubdate') {
    result.sort((a, b) => (extractYear(b.pub_date) ?? 0) - (extractYear(a.pub_date) ?? 0))
  }

  return result
}

/** 필터 드롭다운용: 실제로 등록된 저널 목록 */
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