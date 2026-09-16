import { createClient } from '@/lib/supabase/server'
import { fetchPosts } from './query'
import { fetchMonthlyWinCount } from './ranking'

export type ProfileStats = {
  displayName: string
  publishedCount: number
  monthlyWins: number
  topJournals: [string, number][]
}

export async function fetchProfileStats(authorId: string): Promise<ProfileStats | null> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', authorId)
    .single()

  if (error || !profile) {
    console.error('프로필 조회 실패:', error?.message, error?.code, error?.details)
    return null
  }

  const { posts: published, total } = await fetchPosts({
    authorId,
    sort: 'recent',
    perPage: 200,
  })

  const journalCounts = new Map<string, number>()
  for (const p of published) {
    if (!p.journal) continue
    journalCounts.set(p.journal, (journalCounts.get(p.journal) ?? 0) + 1)
  }
  const topJournals = [...journalCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  const monthlyWins = await fetchMonthlyWinCount(authorId)

  return {
    displayName: profile.display_name,
    publishedCount: total,
    monthlyWins,
    topJournals,
  }
}