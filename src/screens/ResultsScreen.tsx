import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type ResultRow = {
  team_id: number
  total_points: number
  rank: number
}

type Props = {
  eventId: string
  onComplete: () => void
  onTieBreaker: (tiedTeams: number[]) => void
}

export default function ResultsScreen({
  eventId,
  onComplete,
  onTieBreaker
}: Props) {
  const [results, setResults] = useState<ResultRow[]>([])
  const [revealedRanks, setRevealedRanks] = useState<number[]>([])
  const [ready, setReady] = useState(false)
  
  const groupedByRank = Object.values(
    results.reduce<Record<number, ResultRow[]>>((acc, row) => {
      if (!acc[row.rank]) acc[row.rank] = []
      acc[row.rank].push(row)
      return acc
    }, {})
  ).sort((a, b) => a[0].rank - b[0].rank)

  const firstRankGroup = groupedByRank.find(g => g[0].rank === 1)
  const isFirstRankTie = firstRankGroup ? firstRankGroup.length > 1 : false

  function calculateActivityPoints({
    startedAt,
    endedAt,
    outAt
  }: {
    startedAt: number
    endedAt: number
    outAt?: number
  }) {
    const endTime = outAt ?? endedAt
    const durationMs = endTime - startedAt

    const fiveMin = 5 * 60 * 1000
    const blocks = Math.floor(durationMs / fiveMin)

    let points = blocks * 3
    if (outAt) points -= 1

    return points
  }

  async function computeAndStoreResults() {
    /* ---------- 1. Load activity window ---------- */
    const { data: state } = await supabase
      .from('event_state')
      .select('activity_started_at, activity_ended_at')
      .eq('event_id', eventId)
      .single()

    if (!state?.activity_started_at || !state?.activity_ended_at) {
      console.error('Activity time window missing')
      return
    }

    const startedAt = new Date(state.activity_started_at).getTime()
    const endedAt = new Date(state.activity_ended_at).getTime()

    /* ---------- 2. Load participants ---------- */
    const { data: participants } = await supabase
      .from('participants')
      .select('id, team_id')
      .eq('is_present', true)

    if (!participants) return

    /* ---------- 3. Load OUT logs ---------- */
    const { data: outLogs } = await supabase
      .from('activity_participant_log')
      .select('participant_id, created_at')
      .eq('event_id', eventId)
      .eq('event_type', 'OUT')

    const outMap = new Map<number, number>()
    outLogs?.forEach(log => {
      outMap.set(
        log.participant_id,
        new Date(log.created_at).getTime()
      )
    })

    /* ---------- 4. Activity points per participant ---------- */
    const activityByTeam = new Map<number, number>()

    participants.forEach(p => {
      const outAt = outMap.get(p.id)

      const points = calculateActivityPoints({
        startedAt,
        endedAt,
        outAt
      })

      activityByTeam.set(
        p.team_id,
        (activityByTeam.get(p.team_id) ?? 0) + points
      )
    })

    /* ---------- 5. Quiz points per team ---------- */
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('team_id, points_awarded')
      .eq('event_id', eventId)

    const quizByTeam = new Map<number, number>()
    quizAttempts?.forEach(q => {
      quizByTeam.set(
        q.team_id,
        (quizByTeam.get(q.team_id) ?? 0) + q.points_awarded
      )
    })

    /* ---------- 6. Final totals ---------- */
    const totals = Array.from(activityByTeam.keys()).map(teamId => ({
      team_id: teamId,
      total_points:
        (activityByTeam.get(teamId) ?? 0) +
        (quizByTeam.get(teamId) ?? 0)
    }))

    /* ---------- 7. Rank calculation ---------- */
    totals.sort((a, b) => b.total_points - a.total_points)

    let rank = 1
    totals.forEach((row, i) => {
      if (
        i > 0 &&
        row.total_points < totals[i - 1].total_points
      ) {
        rank = i + 1
      }
      ; (row as any).rank = rank
    })

    /* ---------- 8. Store results ---------- */
    await supabase
      .from('event_results')
      .upsert(
        totals.map(r => ({
          event_id: eventId,
          team_id: r.team_id,
          total_points: r.total_points,
          rank: (r as any).rank,
          is_final: true
        })),
        { onConflict: 'event_id,team_id' }
      )

    /* ---------- 9. Reload into UI ---------- */
    await loadResults()
  }

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    const { data, error } = await supabase
      .from('event_results')
      .select('team_id, total_points, rank')
      .eq('event_id', eventId)
      .order('rank', { ascending: false })

    if (error || !data) {
      console.error(error)
      return
    }

    setResults(data)
  }

  useEffect(() => {
    if (!ready) return

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return

      setRevealedRanks(prev => {
        if (prev.length >= groupedByRank.length) return prev

        const nextIndex = groupedByRank.length - 1 - prev.length
        return [...prev, groupedByRank[nextIndex][0].rank]
      })
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, groupedByRank])

  function getRankStyle(rank: number, isFirstTie: boolean) {
    if (rank === 1 && !isFirstTie) return '#ffd700' // gold
    if (rank === 1 && isFirstTie) return '#c0c0c0' // silver (tie case)
    if (rank === 2) return '#c0c0c0' // silver
    if (rank === 3) return '#cd7f32' // bronze
    return '#ffffff'
  }

  return (
    <div style={container}>
      {!ready ? (
        <button
          style={revealButton}
          onClick={async () => {
            await computeAndStoreResults()
            setReady(true)
          }}
        >
          Reveal Results
        </button>
      ) : (
          <div style={{ width: 600 }}>
            {groupedByRank.map(group => {
              const rank = group[0].rank
              if (!revealedRanks.includes(rank)) return null

              return (
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
                        backgroundColor: getRankStyle(rank, isFirstRankTie)
                      }}
                    >
                      {/* RANK */}
                      <div
                        style={{
                          fontSize: 16,
                          opacity: 0.9,
                          marginBottom: 8
                        }}
                      >
                        RANK {rank}
                      </div>

                      {/* TEAM */}
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 10
                        }}
                      >
                        TEAM {team.team_id}
                      </div>

                      {/* POINTS */}
                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 15,
                          fontWeight: 2
                        }}
                      >
                        {team.total_points} pts
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            {revealedRanks.length === groupedByRank.length && (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                {isFirstRankTie ? (
                  <button
                    style={actionButton}
                    onClick={() =>
                      onTieBreaker(firstRankGroup!.map(t => t.team_id))
                    }
                  >
                    Tie Breaker
                  </button>
                ) : (
                  <button style={actionButton} onClick={onComplete}>
                    Complete
                  </button>
                )}
              </div>
            )}
          </div>
      )}
    </div>
  )
}

/* ---------- styles ---------- */

const container = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#ffffff',
  color: '#000000',
}

const revealButton = {
  fontSize: 28,
  padding: '18px 36px',
  border: '4px solid #000',
  cursor: 'pointer'
}

const actionButton = {
  fontSize: 20,
  padding: '14px 28px',
  border: '3px solid #000',
  cursor: 'pointer'
}