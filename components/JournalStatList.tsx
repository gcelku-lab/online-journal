'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { JournalStat } from '@/lib/posts/stats'
import AuthorBarChart from './AuthorBarChart'

export default function JournalStatList({ stats }: { stats: JournalStat[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const maxCount = Math.max(1, ...stats.map((s) => s.count))

  function toggle(journal: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(journal)) next.delete(journal)
      else next.add(journal)
      return next
    })
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {stats.map((s) => {
        const isOpen = expanded.has(s.journal)
        return (
          <li key={s.journal} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <Link
                href={`/posts?journal=${encodeURIComponent(s.journal)}`}
                style={{ flex: 1, minWidth: 0, fontSize: 14, overflowWrap: 'anywhere' }}
              >
                {s.journal}
              </Link>
              <span style={{ fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{s.count}편</span>
              <button
                onClick={() => toggle(s.journal)}
                style={{
                  fontSize: 12,
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}
              >
                {isOpen ? '접기' : '작성자별 보기'}
              </button>
            </div>

            <div style={{ marginTop: 5, height: 3, background: 'var(--border)', borderRadius: 2 }}>
              <div
                style={{
                  width: `${(s.count / maxCount) * 100}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  borderRadius: 2,
                }}
              />
            </div>

            {isOpen && (
              <div style={{ marginTop: 14, paddingLeft: 4, overflowX: 'auto' }}>
                <AuthorBarChart data={s.byAuthor} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}