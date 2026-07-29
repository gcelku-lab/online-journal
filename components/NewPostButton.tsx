'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewPostButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleClick() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('posts')
      .insert({ author_id: user.id, title: '', content: '' })
      .select()
      .single()

    if (error || !data) {
      alert('글 생성에 실패했습니다.')
      return
    }

    router.push(`/posts/${data.id}/edit`)
  }

  return <button onClick={handleClick}>새 글쓰기</button>
}