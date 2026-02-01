import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Props = {
  eventId: string
}

export default function ActivityMark({ eventId }: Props) {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkState() {
      const { data, error } = await supabase
        .from('event_state')
        .select('activity_active')
        .eq('event_id', eventId)
        .single()

      if (error || !data) {
        setActive(false)
      } else {
        setActive(data.activity_active === true)
      }

      setLoading(false)
    }

    checkState()

    // Poll every 1 second
    const interval = setInterval(checkState, 1000)
    return () => clearInterval(interval)
  }, [eventId])

  if (loading) {
    return <div style={center}>Loading…</div>
  }

  if (!active) {
    return (
      <div style={center}>
        <h1>🔒 Activity Not Active</h1>
        <p>Waiting for the master to start the activity.</p>
      </div>
    )
  }

  return (
    <div style={center}>
      <h1>🟢 Activity Live</h1>
      <p>Mark participants here.</p>
    </div>
  )
}

const center = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'Arial, sans-serif'
}
