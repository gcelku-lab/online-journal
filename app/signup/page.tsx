'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      options: {
        data: {
          display_name: displayName,
          invite_code: inviteCode,
        },
      },
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
    <main style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <input type="text" placeholder="표시 이름 (예: 홍길동)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <input type="text" placeholder="초대 코드" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? '가입 중...' : '가입하기'}</button>
      </form>
    </main>
  )
}