import { createClient } from '@/lib/supabase/server'

export type MonthlyCount = {
  month: string
  authorId: string
  authorName: string
  count: number
}

export type JournalCount = {
  journal: string
  count: number
}

type RawPost = {
  author_id: string
  published_at: string | null
  created_at: string
  journal: string | null
}

async function fetchRawPublishedPosts(): Promise<RawPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('author_id, published_at, created_at, journal')
    .eq('status', 'published')

  if (error) {
    console.error('랭킹용 게시물 조회 실패:', error.message, error.code, error.details)
    return []
  }
  return data ?? []
}

async function fetchNameMap(authorIds: string[]): Promise<Map<string, string>> {
  const supabase = await createClient()
  const map = new Map<string, string>()
  if (authorIds.length === 0) return map

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)

  if (error) {
    console.error('작성자 이름 조회 실패:', error.message, error.code, error.details)
    return map
  }
  for (const p of data ?? []) map.set(p.id, p.display_name)
  return map
}

function monthKey(post: RawPost): string {
  return (post.published_at ?? post.created_at).slice(0, 7)
}

async function fetchMonthlyCounts(): Promise<MonthlyCount[]> {
  const posts = await fetchRawPublishedPosts()
  const authorIds = [...new Set(posts.map((p) => p.author_id))]
  const nameMap = await fetchNameMap(authorIds)

  const grouped = new Map<string, number>()
  for (const p of posts) {
    const key = `${monthKey(p)}|${p.author_id}`
    grouped.set(key, (grouped.get(key) ?? 0) + 1)
  }

  return [...grouped.entries()].map(([key, count]) => {
    const [month, authorId] = key.split('|')
    return { month, authorId, authorName: nameMap.get(authorId) ?? '알 수 없음', count }
  })
}

export async function fetchCurrentMonthLeaderboard(): Promise<{ authorId: string; authorName: string; count: number }[]> {
  const all = await fetchMonthlyCounts()
  const thisMonth = new Date().toISOString().slice(0, 7)
  return all
    .filter((r) => r.month === thisMonth)
    .sort((a, b) => b.count - a.count)
    .map(({ authorId, authorName, count }) => ({ authorId, authorName, count }))
}

export async function fetchMonthlyTrend(months = 6): Promise<{ month: string; count: number }[]> {
  const all = await fetchMonthlyCounts()
  const totals = new Map<string, number>()
  for (const r of all) totals.set(r.month, (totals.get(r.month) ?? 0) + r.count)

  const now = new Date()
  const result: { month: string; count: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = d.toISOString().slice(0, 7)
    result.push({ month: key, count: totals.get(key) ?? 0 })
  }
  return result
}

export async function fetchJournalRanking(limit = 10): Promise<JournalCount[]> {
  const posts = await fetchRawPublishedPosts()
  const counts = new Map<string, number>()
  for (const p of posts) {
    if (!p.journal) continue
    counts.set(p.journal, (counts.get(p.journal) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([journal, count]) => ({ journal, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/** 마이페이지에서 재사용: 이 사람이 지금까지 몇 번 월간 다독왕이었는지 */
export async function fetchMonthlyWinCount(authorId: string): Promise<number> {
  const all = await fetchMonthlyCounts()
  const byMonth = new Map<string, MonthlyCount[]>()
  for (const r of all) {
    const list = byMonth.get(r.month) ?? []
    list.push(r)
    byMonth.set(r.month, list)
  }

  let wins = 0
  for (const [, entries] of byMonth) {
    const max = Math.max(...entries.map((e) => e.count))
    if (entries.some((e) => e.count === max && e.authorId === authorId)) wins++
  }
  return wins
}