import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type LiveScoreRow = {
  team_id: number
  rank: number
  total_points: number
}

type Props = {
  eventId: string
}

export default function LiveScores({ eventId }: Props) {
  const [scores, setScores] = useState<LiveScoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchScores() {
    setLoading(true)

    const { data, error } = await supabase
      .from('live_event_leaderboard')
      .select('team_id, rank, total_points')
      .eq('event_id', eventId)
      .order('rank')

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setScores(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchScores()
    const interval = setInterval(fetchScores, 5000)
    return () => clearInterval(interval)
  }, [eventId])

  if (loading) {
    return (
      <div style={center}>
        <p>Loading live scores…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={center}>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={{ width: 420 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
          Live Scores
        </h1>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Rank</th>
              <th style={th}>Team</th>
              <th style={th}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {scores.map(row => (
              <tr key={row.team_id}>
                <td style={td}>{row.rank}</td>
                <td style={td}>{row.team_id}</td>
                <td style={td}>{row.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={hint}>Auto-updates every 5 seconds</p>
      </div>
    </div>
  )
}

/* ---------------- STYLES (MATCHES ActivityMark) ---------------- */

const center = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'Arial, sans-serif'
}

const container = {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '#ffffff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: 40,
  paddingBottom: 40,
  fontFamily: 'Arial, sans-serif',
  color: '#000000'
}

const th = {
  borderBottom: '2px solid #ddd',
  padding: 8,
  textAlign: 'center' as const
}

const td = {
  borderBottom: '1px solid #eee',
  padding: 8,
  textAlign: 'center' as const
}

const hint = {
  marginTop: 12,
  fontSize: 12,
  textAlign: 'center' as const,
  color: '#666'
}
