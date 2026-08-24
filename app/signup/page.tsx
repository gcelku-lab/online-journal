'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, invite_code: inviteCode } },
    })

    setLoading(false)

    if (error) {
      console.error('signup error:', error.message, error.status)
      if (error.status === 422 || error.message?.toLowerCase().includes('already registered')) {
        setError('이미 가입된 이메일입니다.')
      } else {
        setError('가입에 실패했습니다. 초대 코드를 확인해주세요.')
      }
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 22 }}>회원가입</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -12, marginBottom: 20 }}>
        랩에서 공유받은 초대 코드가 필요합니다.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <input type="text" placeholder="표시 이름 (예: 윤정호)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <input type="text" placeholder="초대 코드" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
        {error && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', padding: '9px 14px' }}
        >
          {loading ? '가입 중' : '가입하기'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
        이미 계정이 있으신가요? <Link href="/login" style={{ color: 'var(--accent)' }}>로그인</Link>
      </p>
    </main>
  )
}