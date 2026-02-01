import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Rep = {
  teamId: number
  participantId: number
}

type ResultRow = {
  team_id: number
  total_points: number
}

type Props = {
  eventId: string
  tiedTeams: number[]
  tieBreakerReps: Rep[]
  onComplete: () => void
}

export default function TieBreakerChallenge({
  eventId,
  tiedTeams,
  tieBreakerReps,
  onComplete
}: Props) {
  const [remainingTeams, setRemainingTeams] = useState<number[]>(tiedTeams)
  const [finalResults, setFinalResults] = useState<ResultRow[] | null>(null)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    // Reserved for future audit / UI display
    console.debug('Tie breaker reps:', tieBreakerReps)
  }, [tieBreakerReps])

  /* ---------------- ELIMINATION ---------------- */
  async function eliminateTeam(teamId: number) {
    if (resolving) return

    const next = remainingTeams.filter(t => t !== teamId)
    setRemainingTeams(next)

    if (next.length === 1) {
      setResolving(true)
      await resolveWinner(next[0])
    }
  }

  /* ---------------- RESOLUTION ---------------- */
  async function resolveWinner(winnerTeamId: number) {
    // Fetch current points
    const { data: winnerRow, error: fetchError } = await supabase
      .from('event_results')
      .select('total_points')
      .eq('event_id', eventId)
      .eq('team_id', winnerTeamId)
      .single()

    if (fetchError || !winnerRow) {
      console.error('Failed to fetch winner points', fetchError)
      return
    }

    // Add +3 points
    await supabase
      .from('event_results')
      .update({
        total_points: winnerRow.total_points + 3
      })
      .eq('event_id', eventId)
      .eq('team_id', winnerTeamId)

    // Fetch updated results
    const { data } = await supabase
      .from('event_results')
      .select('team_id, total_points')
      .eq('event_id', eventId)

    if (!data) return

    // Recalculate ranks
    const sorted = [...data].sort(
      (a, b) => b.total_points - a.total_points
    )

    let currentRank = 1
    let lastPoints: number | null = null

    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i]

      if (lastPoints !== null && row.total_points < lastPoints) {
        currentRank = i + 1
      }

      await supabase
        .from('event_results')
        .update({ rank: currentRank })
        .eq('event_id', eventId)
        .eq('team_id', row.team_id)

      lastPoints = row.total_points
    }

    // 4️⃣ Mark final
    await supabase
      .from('event_results')
      .update({ is_final: true })
      .eq('event_id', eventId)

    setFinalResults(sorted)
  }

  /* ---------------- UI ---------------- */
  if (finalResults) {
    return (
      <div style={center}>
        <h1 style={{ marginBottom: 24 }}>Final Results</h1>

        {finalResults.map(row => (
          <div
            key={row.team_id}
            style={{
              padding: '16px 24px',
              marginBottom: 12,
              borderRadius: 12,
              border: '3px solid #000',
              backgroundColor:
                row.team_id === finalResults[0].team_id ? '#ffd700' : '#ffffff',
              fontSize: 20,
              fontWeight: 700,
              minWidth: 300,
              textAlign: 'center'
            }}
          >
            Team {row.team_id} — {row.total_points} pts
          </div>
        ))}

        <button
          style={{ marginTop: 32, fontSize: 18, padding: '12px 24px' }}
          onClick={onComplete}
        >
          Complete
        </button>
      </div>
    )
  }

  return (
    <div style={center}>
      <h1 style={{ marginBottom: 32 }}>Tie Breaker</h1>

      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Click a team to eliminate it
      </p>

      <div style={{ display: 'flex', gap: 24 }}>
        {remainingTeams.map(teamId => (
          <div
            key={teamId}
            onClick={() => eliminateTeam(teamId)}
            style={{
              padding: '24px 32px',
              borderRadius: 16,
              border: '4px solid #000',
              cursor: 'pointer',
              fontSize: 22,
              fontWeight: 700,
              backgroundColor: '#ffffff'
            }}
          >
            Team {teamId}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- STYLES ---------------- */
const center = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#ffffff',
  color: '#000000'
}
