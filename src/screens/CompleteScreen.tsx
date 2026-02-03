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
            <li>We didn’t begin by teaching concepts; we began by placing you inside a story and a shared context.</li>
            <li>In that sense, we followed the Gurukul way, where learning starts with observation, not explanation.</li>
            <li>When the activity began, the theory left the slides and became something you had to live through.</li>
            <li>You experienced the difference between reacting impulsively and acting with awareness and self-control.</li>
            <li>Each individual choice quietly influenced the team, showing how personal discipline builds collective strength.</li>
            <li>Reflection wasn’t instructed, it emerged on its own, through silence, waiting, and restraint.</li>
            <li>This is how spirituality was practiced in ancient India; not as theory or belief, but as daily training of awareness within real life.</li>
            <li>As software engineers, we will have to work under constant pressure, deadlines, bugs, noise, and interruptions, this trains us to respond with clarity instead of reacting emotionally.</li>
            <li>Practicing these daily builds focus, patience, and decision quality, turning self-control into a professional skill, not just a personal trait.</li>
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
