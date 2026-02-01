import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

type Participant = {
  id: number          // roll number
  name: string
  team_id: number
}

type OutLog = {
  participant_id: number
  created_at: string
}

type Props = {
  eventId: string
}

export default function ActivityMark({ eventId }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [outLogs, setOutLogs] = useState<Map<number, number>>(new Map())
  const [activityActive, setActivityActive] = useState(false)
  const [loading, setLoading] = useState(true)

  // Used to block undo after refresh
  const freshLoadRef = useRef(true)

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    loadAll()
    const interval = setInterval(checkActivityState, 1000)

    // After first render, refresh protection activates
    setTimeout(() => {
      freshLoadRef.current = false
    }, 0)

    return () => clearInterval(interval)
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([
      loadParticipants(),
      loadOutLogs(),
      checkActivityState()
    ])
    setLoading(false)
  }

  /* ---------------- DATA LOADERS ---------------- */
  async function loadParticipants() {
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, team_id')
      .eq('is_present', true)
      .order('id')

    if (!error && data) {
      setParticipants(data)
    }
  }

  async function loadOutLogs() {
    const { data } = await supabase
      .from('activity_participant_log')
      .select('participant_id, created_at')
      .eq('event_id', eventId)
      .eq('event_type', 'OUT')

    const map = new Map<number, number>()
    data?.forEach(row => {
      map.set(row.participant_id, new Date(row.created_at).getTime())
    })

    setOutLogs(map)
  }

  async function checkActivityState() {
    const { data } = await supabase
      .from('event_state')
      .select('activity_active')
      .eq('event_id', eventId)
      .single()

    setActivityActive(data?.activity_active === true)
  }

  /* ---------------- ACTIONS ---------------- */
  async function markOut(p: Participant) {
    if (!activityActive) return

    await supabase.from('activity_participant_log').insert({
      event_id: eventId,
      participant_id: p.id,
      event_type: 'OUT',
      points: -1
    })

    setOutLogs(prev => {
      const next = new Map(prev)
      next.set(p.id, Date.now())
      return next
    })
  }

  async function undoOut(p: Participant) {
    const markedAt = outLogs.get(p.id)
    if (!markedAt) return

    const now = Date.now()
    if (freshLoadRef.current) return
    if (now - markedAt > 60_000) return

    await supabase
      .from('activity_participant_log')
      .delete()
      .eq('event_id', eventId)
      .eq('participant_id', p.id)
      .eq('event_type', 'OUT')

    setOutLogs(prev => {
      const next = new Map(prev)
      next.delete(p.id)
      return next
    })
  }

  /* ---------------- SORTING ---------------- */
  const stillMeditating = participants
    .filter(p => !outLogs.has(p.id))
    .sort((a, b) => a.id - b.id)

  const outParticipants = participants
    .filter(p => outLogs.has(p.id))
    .sort(
      (a, b) =>
        (outLogs.get(b.id) ?? 0) - (outLogs.get(a.id) ?? 0)
    )

  /* ---------------- UI ---------------- */
  if (loading) {
    return <div style={center}>Loading…</div>
  }

  if (!activityActive) {
    return (
      <div style={center}>
        <h1>🔒 Activity Not Active</h1>
        <p>Waiting for the master to start the activity.</p>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={{ width: 420 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
          Activity Marking
        </h1>

        {/* STILL MEDITATING */}
        <div>
          {stillMeditating.map(p => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => markOut(p)}
                />
                {' '}
                {p.id} — {p.name}
              </label>
            </div>
          ))}
        </div>

        {/* OUT LIST */}
        {outParticipants.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Out</h3>

            {outParticipants.map(p => {
              const markedAt = outLogs.get(p.id)!
              const undoAllowed =
                !freshLoadRef.current &&
                Date.now() - markedAt <= 60_000

              return (
                <div
                  key={p.id}
                  style={{
                    marginBottom: 8,
                    opacity: 0.5,
                    textDecoration: 'line-through',
                    transition: 'opacity 0.3s'
                  }}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={!undoAllowed}
                      onChange={() => undoOut(p)}
                    />
                    {' '}
                    {p.id} — {p.name}
                  </label>
                </div>
              )
            })}
          </div>
        )}
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
