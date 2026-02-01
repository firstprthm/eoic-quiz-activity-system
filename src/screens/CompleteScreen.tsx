import { useEffect, useState } from 'react'

export default function CompleteScreen() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        setDone(true)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div style={container}>
      {!done ? (
        <div style={content}>
          <h1 style={title}>Outcome</h1>

          <ul style={list}>
            <li>The activity mirrored the practice of inner discipline found in Indian spiritual traditions.</li>
            <li>Silence became a teacher, revealing the mind’s natural restlessness.</li>
            <li>Attention, once broken, showed how easily awareness is lost in daily life.</li>
            <li>Steady practice proved more powerful than brief moments of effort.</li>
            <li>Individual self-control directly influenced the balance and outcome of the whole group.</li>
          </ul>

          <p style={hint}>Press Enter to continue</p>
        </div>
      ) : (
        <div style={thankYou}>
          Thank you.
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
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  color: '#000000'
}

const content = {
  width: 700,
  textAlign: 'center' as const
}

const title = {
  fontSize: 36,
  marginBottom: 32
}

const list = {
  paddingLeft: 100,
  fontSize: 22,
  lineHeight: 1.8,
  textAlign: 'left' as const
}

const hint = {
  marginTop: 40,
  fontSize: 16,
  opacity: 0.5,
  textAlign: 'center' as const
}

const thankYou = {
  fontSize: 48,
  fontWeight: 600
}
