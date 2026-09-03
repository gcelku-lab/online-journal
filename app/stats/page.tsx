import { fetchJournalStats } from '@/lib/posts/stats'
import JournalStatList from '@/components/JournalStatList'

export default async function StatsPage() {
  const { stats, totalPosts } = await fetchJournalStats()
  const journalCovered = stats.reduce((sum, s) => sum + s.count, 0)

  return (
    <main style={{ maxWidth: 900, margin: '32px auto 80px', padding: '0 20px' }}>
      <h1>통계</h1>

      <div
        style={{
          display: 'flex',
          gap: 32,
          padding: '16px 20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>게시된 글</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{totalPosts}편</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>저널 수</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.length}개</div>
        </div>
      </div>

      <h2>저널별 정리 편수</h2>

      {stats.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>아직 집계할 데이터가 없습니다.</p>
      ) : (
        <>
          <JournalStatList stats={stats} />
          {journalCovered < totalPosts && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              저널 정보가 없는 글 {totalPosts - journalCovered}편은 집계에서 제외했습니다.
            </p>
          )}
        </>
      )}
    </main>
  )
}