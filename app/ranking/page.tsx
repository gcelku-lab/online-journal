import Link from 'next/link'
import { fetchCurrentMonthLeaderboard, fetchMonthlyTrend, fetchJournalRanking } from '@/lib/posts/ranking'
import TrendChart from '@/components/TrendChart'

export default async function RankingPage() {
  const [leaderboard, trend, journals] = await Promise.all([
    fetchCurrentMonthLeaderboard(),
    fetchMonthlyTrend(6),
    fetchJournalRanking(10),
  ])

  const thisMonthLabel = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <p><Link href="/">← 홈으로</Link></p>
      <h1>랭킹</h1>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>{thisMonthLabel} 다독왕</h2>
        {leaderboard.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14 }}>이번 달 게시된 글이 아직 없습니다.</p>
        ) : (
          <ol style={{ paddingLeft: 20 }}>
            {leaderboard.map((entry, i) => (
              <li key={entry.authorId} style={{ padding: '6px 0', fontWeight: i === 0 ? 700 : 400 }}>
                {entry.authorName} — {entry.count}편{i === 0 && <span style={{ marginLeft: 6 }}>🏆</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>최근 6개월 추이 (전체 게시물 수)</h2>
        <TrendChart data={trend} />
      </section>

      <section>
        <h2 style={{ fontSize: 18 }}>저널 랭킹</h2>
        {journals.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14 }}>아직 데이터가 없습니다.</p>
        ) : (
          <ol style={{ paddingLeft: 20 }}>
            {journals.map((j) => (
              <li key={j.journal} style={{ padding: '4px 0' }}>{j.journal} — {j.count}편</li>
            ))}
          </ol>
        )}
      </section>
    </main>
  )
}