'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export default function Pagination({
  total,
  perPage,
  currentPage,
}: {
  total: number
  perPage: number
  currentPage: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  if (totalPages <= 1) return null

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) params.delete('page')
    else params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  // 현재 페이지 주변 5개만 표시
  const windowSize = 5
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2))
  const end = Math.min(totalPages, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)

  const pages: number[] = []
  for (let p = start; p <= end; p++) pages.push(p)

  const btn = (active: boolean): React.CSSProperties => ({
    fontSize: 13,
    padding: '4px 10px',
    minWidth: 34,
    background: active ? 'var(--accent)' : '#fff',
    color: active ? '#fff' : 'inherit',
    borderColor: active ? 'var(--accent)' : 'var(--border-strong)',
  })

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        flexWrap: 'wrap',
      }}
    >
      <button onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1} style={btn(false)}>
        ←
      </button>

      {start > 1 && (
        <>
          <button onClick={() => goTo(1)} style={btn(false)}>1</button>
          {start > 2 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <button key={p} onClick={() => goTo(p)} style={btn(p === currentPage)}>
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</span>}
          <button onClick={() => goTo(totalPages)} style={btn(false)}>{totalPages}</button>
        </>
      )}

      <button onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages} style={btn(false)}>
        →
      </button>
    </div>
  )
}