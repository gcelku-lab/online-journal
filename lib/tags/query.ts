import { createClient } from '@/lib/supabase/server'
import type { Tag } from './match'

export async function fetchAllTags(): Promise<Tag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('id, canonical_name, category, synonyms, status')
    .eq('status', 'approved')
    .order('canonical_name')

  if (error) {
    console.error('태그 목록 조회 실패:', error.message, error.code, error.details)
    return []
  }
  return data ?? []
}

export async function fetchPostTagIds(postId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('post_tags')
    .select('tag_id')
    .eq('post_id', postId)

  if (error) {
    console.error('게시물 태그 조회 실패:', error.message, error.code, error.details)
    return []
  }
  return (data ?? []).map((r) => r.tag_id)
}