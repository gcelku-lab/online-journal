'use client'

import { useState } from 'react'

export default function AuthorList({ authors }: { authors: string[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!authors || authors.length === 0) return null

  return (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, overflowWrap: 'anywhere' }}>
      {expanded ? authors.join(', ') : `${authors[0]}${authors.length > 1 ? ' et al.' : ''}`}
      {authors.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          style={{
            marginLeft: 6,
            fontSize: 11,
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded ? '접기' : `저자 ${authors.length}명 전체보기`}
        </button>
      )}
    </div>
  )
}