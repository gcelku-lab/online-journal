import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import NewPostButton from '@/components/NewPostButton'
import PostList from '@/components/PostList'
import { fetchPosts } from '@/lib/posts/query'

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

  const { posts: recent } = await fetchPosts({ sort: 'recent', page: 1, perPage: 5 })

  return (
    <main style={{ maxWidth: 760, margin: '40px auto 80px', padding: '0 20px' }}>
      <section style={{ marginBottom: 40 }}>
        <h1 style={{ marginBottom: 8 }}>Online Journal Club</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 20 }}>
          랩 구성원이 읽은 논문을 정리하고 함께 보는 공간입니다.
        </p>

        {user ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <NewPostButton />
            <Link href="/mypage" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {displayName}님의 마이페이지
            </Link>
            <LogoutButton />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              href="/login"
              style={{
                fontSize: 14,
                padding: '6px 14px',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius)',
                background: 'var(--accent)',
                color: '#fff',
              }}
            >
              로그인
            </Link>
            <Link href="/signup" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              회원가입
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2>최근 올라온 글</h2>
        <PostList posts={recent} />
        {recent.length > 0 && (
          <p style={{ marginTop: 16, fontSize: 14 }}>
            <Link href="/posts" style={{ color: 'var(--accent)' }}>
              전체 보기 →
            </Link>
          </p>
        )}
      </section>
    </main>
  )
}