import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Participant = {
  id: number
  name: string
}

type Props = {
  eventId: string
  teamId: number
  onConfirm: (participantId: number) => void
}

export default function TieBreakerRepresentativeSelect({
  eventId,
  teamId,
  onConfirm
}: Props) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selected, setSelected] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEligibleParticipants()
  }, [teamId])

  async function loadEligibleParticipants() {
    setLoading(true)

    const { data, error } = await supabase
      .from('participants')
      .select(`
        id,
        name,
        quiz_participation!left (
          has_answered
        )
      `)
      .eq('team_id', teamId)
      .eq('is_present', true)
      .eq('quiz_participation.event_id', eventId)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const eligible =
      (data || []).filter(p => {
        const participation = p.quiz_participation?.[0]
        return !participation || participation.has_answered === false
      })

    setParticipants(eligible)
    setLoading(false)
  }

  if (loading) {
    return <div style={center}>Loading…</div>
  }

  return (
    <div style={container}>
      <div style={{ width: 420 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
          Team {teamId} — Select Representative
        </h1>

        {participants.map(p => {
          const isSelected = selected?.id === p.id

          return (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: '14px 16px',
                marginBottom: 10,
                borderRadius: 6,
                cursor: 'pointer',
                border: isSelected
                  ? '3px solid #000'
                  : '1px solid #ccc',
                backgroundColor: isSelected
                  ? '#f0f0f0'
                  : '#ffffff',
                fontSize: 18
              }}
            >
              {p.id} — {p.name}
            </div>
          )
        })}

        <button
          disabled={!selected}
          style={{
            marginTop: 32,
            width: '100%',
            padding: 12,
            fontSize: 18,
            opacity: selected ? 1 : 0.5
          }}
          onClick={() => {
            if (!selected) return

            const ok = window.confirm(
              `Confirm ${selected.name} as representative?`
            )

            if (ok) {
              onConfirm(selected.id)
            }
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

/* ---------- styles ---------- */

const center = {
  minHeight: '100vh',
  display: 'flex',
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
  fontFamily: 'Arial, sans-serif',
  color: '#000000'
}
