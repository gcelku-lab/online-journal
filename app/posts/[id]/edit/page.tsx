import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchAllTags, fetchPostTagIds } from '@/lib/tags/query'
import PostEditor from '@/components/PostEditor'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()

  if (!post || post.author_id !== user.id) {
    redirect('/')
  }

  let figures: { label: string; image_url: string }[] = []
  if (post.doi) {
    const { data: figData, error: figErr } = await supabase
      .from('figures')
      .select('label, image_url')
      .eq('doi', post.doi)
    if (figErr) {
      console.error('figure 조회 실패:', figErr.message, figErr.code)
    } else {
      figures = figData ?? []
    }
  }

  const [allTags, postTagIds] = await Promise.all([fetchAllTags(), fetchPostTagIds(id)])

  return (
    <PostEditor post={post} allTags={allTags} initialTagIds={postTagIds} figures={figures} />
  )
}