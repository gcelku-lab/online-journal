import type { ProfileStats } from '@/lib/posts/profile'

export default function ProfileCard({ stats }: { stats: ProfileStats }) {
  return (
    <section style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 32 }}>
      <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{stats.displayName}</p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14 }}>
        <div>
          <div style={{ color: '#888' }}>게시한 글</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.publishedCount}편</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>월간 다독왕 선정</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.monthlyWins}회</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>주로 다루는 저널</div>
          {stats.topJournals.length === 0 ? (
            <div style={{ fontSize: 14, color: '#666' }}>-</div>
          ) : (
            <div style={{ fontSize: 14 }}>
              {stats.topJournals.map(([journal, count]) => `${journal} (${count})`).join(', ')}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}