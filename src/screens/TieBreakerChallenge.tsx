import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Rep = {
  teamId: number
  participantId: number
}

type ResultRow = {
  team_id: number
  total_points: number
  rank: number
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
      .select('team_id, total_points, rank')
      .order('rank', { ascending: true })
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

    async function loadFinalResults() {
      const { data, error } = await supabase
        .from('event_results')
        .select('team_id, total_points, rank')
        .eq('event_id', eventId)
        .order('rank', { ascending: true })

      if (error || !data) {
        console.error('Failed to load final results', error)
        return
      }

      setFinalResults(data)
    }

    await loadFinalResults()
  }

  /* ---------------- FINAL RESULTS UI ---------------- */
  if (finalResults) {
    const groupedByRank = Object.values(
      finalResults.reduce<Record<number, ResultRow[]>>((acc, row) => {
        if (!acc[row.rank]) acc[row.rank] = []
        acc[row.rank].push(row)
        return acc
      }, {})
    ).sort((a, b) => a[0].rank - b[0].rank)

    function getRankStyle(rank: number) {
      if (rank === 1) return '#ffd700' // gold
      if (rank === 2) return '#c0c0c0' // silver
      if (rank === 3) return '#cd7f32' // bronze
      return '#ffffff'
    }

    return (
      <div style={center}>
        <h1 style={{ marginBottom: 32 }}>Final Results</h1>

        <div style={{ width: 600 }}>
          {groupedByRank.map(group => {
            const rank = group[0].rank

            return (
              /* ONE ROW PER RANK (vertical stacking) */
              <div
                key={rank}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 20,
                  marginBottom: 28,
                  transform: `translateY(${(rank - 1) * -12}px)`
                }}
              >
                {/* SIDE-BY-SIDE ONLY FOR TIES */}
                {group.map(team => (
                  <div
                    key={team.team_id}
                    style={{
                      padding: '22px 30px',
                      border: '3px solid #000',
                      borderRadius: 16,
                      boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                      minWidth: 240,
                      textAlign: 'center',
                      backgroundColor: getRankStyle(rank)
                    }}
                  >
                    {/* RANK */}
                    <div
                      style={{
                        fontSize: 16,
                        opacity: 0.85,
                        marginBottom: 6
                      }}
                    >
                      RANK {rank}
                    </div>

                    {/* TEAM */}
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700
                      }}
                    >
                      TEAM {team.team_id}
                    </div>

                    {/* POINTS */}
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 16
                      }}
                    >
                      {team.total_points} pts
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              style={{
                fontSize: 20,
                padding: '14px 28px',
                border: '3px solid #000',
                cursor: 'pointer'
              }}
              onClick={onComplete}
            >
              Complete
            </button>
          </div>
        </div>
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
