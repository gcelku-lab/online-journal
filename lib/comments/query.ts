import { createClient } from '@/lib/supabase/server'

export type CommentItem = {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  author_name: string
}

export async function fetchComments(postId: string): Promise<CommentItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, author_id, parent_id, content, created_at, updated_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('댓글 조회 실패:', error.message, error.code, error.details)
    return []
  }

  const rows = data ?? []
  const authorIds = [...new Set(rows.map((r) => r.author_id as string))]
  const nameById = new Map<string, string>()

  if (authorIds.length > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)

    if (profileErr) {
      console.error('댓글 작성자 조회 실패:', profileErr.message, profileErr.code)
    } else {
      for (const p of profiles ?? []) nameById.set(p.id, p.display_name)
    }
  }

  return rows.map((r) => ({
    ...r,
    author_name: nameById.get(r.author_id as string) ?? '알 수 없음',
  })) as CommentItem[]
}