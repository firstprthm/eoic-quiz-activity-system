import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Participant = {
  id: number          // roll number
  name: string
  team_id: number
  is_present: boolean
  absentAt?: number   // UI-only, for undo window
}

type Props = {
  onNext: () => void
}

export default function Attendance({ onNext }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([])

  useEffect(() => {
    loadParticipants()
  }, [])

  async function loadParticipants() {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('id') // roll-number order

    if (error) {
      console.error(error)
    } else {
      setParticipants(data || [])
    }
  }

  async function toggleAbsent(p: Participant) {
    const now = Date.now()

    // CASE 1: Mark absent
    if (p.is_present) {
      const { error } = await supabase
        .from('participants')
        .update({ is_present: false })
        .eq('id', p.id)

      if (error) {
        console.error(error)
        return
      }

      setParticipants(prev =>
        prev.map(x =>
          x.id === p.id
            ? { ...x, is_present: false, absentAt: now }
            : x
        )
      )

      return
    }

    // CASE 2: Undo absent (within 1 minute)
    if (p.absentAt && now - p.absentAt <= 60_000) {
      const { error } = await supabase
        .from('participants')
        .update({ is_present: true })
        .eq('id', p.id)

      if (error) {
        console.error(error)
        return
      }

      setParticipants(prev =>
        prev.map(x =>
          x.id === p.id
            ? { ...x, is_present: true, absentAt: undefined }
            : x
        )
      )
    }
  }

  const sortedParticipants = [
    ...participants
      .filter(p => p.is_present)
      .sort((a, b) => a.id - b.id), // roll number

    ...participants
      .filter(p => !p.is_present)
      .sort((a, b) => (b.absentAt ?? 0) - (a.absentAt ?? 0)), // LIFO
  ]

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        color: '#000000',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 40,
        paddingBottom: 40,
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div style={{ width: 420 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
          Attendance
        </h1>

        {/* PRESENT LIST */}
        <div>
          {sortedParticipants
            .filter(p => p.is_present)
            .map(p => (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleAbsent(p)}
                  />
                  {' '}
                  {p.id} — {p.name}
                </label>
              </div>
            ))}
        </div>

        {/* ABSENT LIST */}
        {sortedParticipants.some(p => !p.is_present) && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 12 }}>
              Absentees
            </h3>

            {sortedParticipants
              .filter(p => !p.is_present)
              .map(p => (
                <div
                  key={p.id}
                  style={{
                    marginBottom: 8,
                    opacity: 0.5
                  }}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={
                        p.absentAt !== undefined &&
                        Date.now() - p.absentAt > 60_000
                      }
                      onChange={() => toggleAbsent(p)}
                    />
                    {' '}
                    {p.id} — {p.name}
                  </label>
                </div>
              ))}
          </div>
        )}

        <button
          style={{ marginTop: 32, width: '100%' }}
          onClick={() => {
            const ok = window.confirm(
              'Attendance will be locked. Do you want to continue?'
            )
            if (ok) {
              onNext()
            }
          }}
        >
          Next
        </button>

      </div>
    </div>
  )
}