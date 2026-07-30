import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UserSearchList from '@/components/UserSearchList'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .order('display_name')

  if (error) {
    console.error('사용자 목록 조회 실패:', error.message, error.code, error.details)
  }

  return (
    <main style={{ maxWidth: 560, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/">← 홈으로</Link></p>
      <h1>사용자 검색</h1>
      <UserSearchList users={data ?? []} />
    </main>
  )
}