'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export default function UserPostSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    setKeyword(searchParams.get('q') ?? '')
  }, [searchParams])

  function apply(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) params.set('q', value.trim())
    else params.delete('q')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input
        type="text"
        placeholder="이 사람의 글에서 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply(keyword)}
        style={{ flex: 1, fontSize: 14, minWidth: 0 }}
      />
      <button onClick={() => apply(keyword)}>검색</button>
      {searchParams.get('q') && (
        <button
          onClick={() => apply('')}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}
        >
          초기화
        </button>
      )}
    </div>
  )
}