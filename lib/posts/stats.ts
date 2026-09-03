import { createClient } from '@/lib/supabase/server'

export type AuthorCount = {
  name: string
  count: number
}

export type JournalStat = {
  journal: string
  count: number
  byAuthor: AuthorCount[]
}

export async function fetchJournalStats(): Promise<{ stats: JournalStat[]; totalPosts: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('journal, author_id')
    .eq('status', 'published')

  if (error) {
    console.error('통계 조회 실패:', error.message, error.code, error.details)
    return { stats: [], totalPosts: 0 }
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
      console.error('작성자 조회 실패:', profileError.message, profileError.code)
    } else {
      for (const p of profiles ?? []) nameById.set(p.id, p.display_name)
    }
  }

  const map = new Map<string, Map<string, number>>()

  for (const p of posts) {
    const journal = p.journal?.trim()
    if (!journal) continue
    const authorName = nameById.get(p.author_id) ?? '알 수 없음'
    const inner = map.get(journal) ?? new Map<string, number>()
    inner.set(authorName, (inner.get(authorName) ?? 0) + 1)
    map.set(journal, inner)
  }

  const stats: JournalStat[] = [...map.entries()]
    .map(([journal, inner]) => {
      const byAuthor = [...inner.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      const count = byAuthor.reduce((sum, a) => sum + a.count, 0)
      return { journal, count, byAuthor }
    })
    .sort((a, b) => b.count - a.count || a.journal.localeCompare(b.journal))

  return { stats, totalPosts: posts.length }
}