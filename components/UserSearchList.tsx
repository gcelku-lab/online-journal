'use client'

import { useState } from 'react'
import Link from 'next/link'

type UserItem = { id: string; display_name: string }

export default function UserSearchList({ users }: { users: UserItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? users.filter((u) => u.display_name.toLowerCase().includes(query.trim().toLowerCase()))
    : users

  return (
    <div>
      <input
        type="text"
        placeholder="이름으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{ width: '100%', padding: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }}
      />
      {filtered.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>일치하는 사용자가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filtered.map((u) => (
            <li key={u.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <Link href={`/users/${u.id}`} style={{ fontSize: 15 }}>{u.display_name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}