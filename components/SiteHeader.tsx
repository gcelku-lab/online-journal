import Link from 'next/link'

const NAV = [
  { href: '/posts', label: '최근 글' },
  { href: '/search', label: '검색' },
  { href: '/stats', label: '통계' },
  { href: '/ranking', label: '랭킹' },
  { href: '/users', label: '사용자' },
]

export default function SiteHeader() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        borderTop: '3px solid var(--accent)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '0 20px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Link
          href="/"
          style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', flexShrink: 0 }}
        >
          Journal Club
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 13 }}>
            GCEL @KU
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 16, fontSize: 14, overflowX: 'auto' }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}