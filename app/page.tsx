import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import NewPostButton from '@/components/NewPostButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
    displayName = profile?.display_name
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Online Journal Club</h1>
      <p><Link href="/posts">최근 글 보기</Link> · <Link href="/stats">통계</Link> · <Link href="/search">검색</Link> · <Link href="/ranking">랭킹</Link> · <Link href="/users">사용자</Link></p>
      {user ? (
        <div>
          <p>{displayName}님, 환영합니다.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <NewPostButton />
            <Link href="/mypage">마이페이지</Link>
            <LogoutButton />
          </div>
        </div>
      ) : (
        <p><Link href="/login">로그인</Link> 또는 <Link href="/signup">회원가입</Link></p>
      )}
    </main>
  )
}