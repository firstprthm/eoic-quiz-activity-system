import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Participant = {
  id: number
  name: string
  quiz_participation?: {
    has_answered: boolean
  }[]
}

type Props = {
  teamNumber: number
  eventId: string
  onNext: (participant: Participant) => void
}

export default function QuizRepresentativeSelect({
  teamNumber,
  eventId,
  onNext
}: Props) {
  const [selected, setSelected] = useState<Participant | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])

  useEffect(() => {
    loadParticipants()
  }, [teamNumber])

  async function loadParticipants() {
    // 1. Fetch present participants of the team
    const { data: participantsData, error: pErr } = await supabase
      .from('participants')
      .select('id, name')
      .eq('team_id', teamNumber)
      .eq('is_present', true)
      .order('id')

    if (pErr) {
      console.error(pErr)
      return
    }

    // 2. Fetch participants who already answered in this event
    const { data: answeredData, error: aErr } = await supabase
      .from('quiz_participation')
      .select('participant_id')
      .eq('event_id', eventId)

    if (aErr) {
      console.error(aErr)
      return
    }

    // 3. Build a fast lookup set
    const answeredSet = new Set(
      (answeredData || []).map(x => x.participant_id)
    )

    // 4. Filter eligible participants
    const eligible = (participantsData || []).filter(
      p => !answeredSet.has(p.id)
    )

    setParticipants(eligible)
  }

  return (
    <div
      style={{
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
      }}
    >
      <div style={{ width: 500 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
          Select Representative — Team {teamNumber}
        </h1>

        {/* PARTICIPANT LIST */}
        <div>
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
                  fontSize: 18,
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'all 0.12s ease'
                }}
              >
                {p.name}
              </div>
            )
          })}
        </div>

        {/* NEXT BUTTON */}
        <button
          disabled={!selected}
          style={{
            marginTop: 32,
            width: '100%',
            padding: 12,
            fontSize: 18,
            opacity: selected ? 1 : 0.5,
            cursor: selected ? 'pointer' : 'not-allowed'
          }}
          onClick={() => {
            if (!selected) return

            const ok = window.confirm(
              `Confirm ${selected.name} as representative?`
            )
            if (ok) {
              onNext(selected)
            }
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
