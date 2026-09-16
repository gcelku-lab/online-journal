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

  const [allTags, postTagIds] = await Promise.all([fetchAllTags(), fetchPostTagIds(id)])

  return <PostEditor post={post} allTags={allTags} initialTagIds={postTagIds} />
}