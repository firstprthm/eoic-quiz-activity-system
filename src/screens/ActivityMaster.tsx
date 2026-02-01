import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'


type Phase = 'idle' | 'running' | 'completed'

export default function ActivityMaster({
  eventId,
  onNext
}: {
  eventId: string
  onNext: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0) // milliseconds

  const timerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const MAX_TIME = 20 * 60 * 1000 // 20 minutes

  useEffect(() => {
    async function restoreState() {
      const { data } = await supabase
        .from('event_state')
        .select('*')
        .eq('event_id', eventId)
        .single()

      if (!eventId) return

      if (!data) return

      if (data.activity_active && data.activity_started_at) {
        const startedAt = new Date(data.activity_started_at).getTime()
        const now = Date.now()
        const diff = now - startedAt

        if (diff >= MAX_TIME) {
          setElapsed(MAX_TIME)
          setPhase('completed')
        } else {
          setElapsed(diff)
          setPhase('running')
        }
      }

      if (!data.activity_active && data.activity_ended_at) {
        setPhase('completed')
      }
    }

    restoreState()
  }, [])

  async function unlockActivity() {
    await supabase
      .from('event_state')
      .update({
        locked: false,
        activity_active: true,
        activity_started_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
  }

  async function lockActivity() {
    await supabase
      .from('event_state')
      .update({
        locked: true,
        activity_active: false,
        activity_ended_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
  }

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (phase !== 'running') return

    const start = performance.now() - elapsed

    timerRef.current = window.setInterval(() => {
      const now = performance.now()
      const diff = now - start

      if (diff >= MAX_TIME) {
        stopActivity()
      } else {
        setElapsed(diff)
      }
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  async function stopActivity() {
    if (timerRef.current) clearInterval(timerRef.current)

    await lockActivity()

    playHum()
    setPhase('completed')
  }


  /* ---------- SOUND ---------- */
  function playHum() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
      }

      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime

      // Main low hum (body)
      const low = ctx.createOscillator()
      low.type = 'sine'
      low.frequency.setValueAtTime(180, now)

      // Mid harmonic (clarity)
      const mid = ctx.createOscillator()
      mid.type = 'triangle'
      mid.frequency.setValueAtTime(360, now)

      const gain = ctx.createGain()

      // Volume envelope (IMPORTANT)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.5) // quick attack
      gain.gain.setValueAtTime(0.25, now + 8.5)          // sustain
      gain.gain.linearRampToValueAtTime(0, now + 10)     // smooth release

      low.connect(gain)
      mid.connect(gain)
      gain.connect(ctx.destination)

      low.start(now)
      mid.start(now)

      low.stop(now + 10)
      mid.stop(now + 10)
    } catch (e) {
      console.warn('Audio failed:', e)
    }
  }

  /* ---------- FORMAT ---------- */
  function format(ms: number) {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = Math.floor(ms % 1000)

    return (
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds).padStart(2, '0') +
      ':' +
      String(millis).padStart(3, '0')
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        flexDirection: 'column'
      }}
    >
      {phase === 'idle' && (
        <button
          onClick={async () => {
            await unlockActivity()
            playHum()
            setElapsed(0)
            setPhase('running')
          }}
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            fontSize: 32,
            fontWeight: 700,
            border: '4px solid #000'
          }}
        >
          START
        </button>
      )}

      {phase === 'running' && (
        <>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              marginBottom: 40
            }}
          >
            {format(elapsed)}
          </div>

          <button
            style={{ fontSize: 18, padding: '12px 24px' }}
            onClick={stopActivity}
          >
            Stop Activity
          </button>
        </>
      )}

      {phase === 'completed' && (
        <button
          style={{ fontSize: 20, padding: '14px 28px' }}
          onClick={() => {
            const ok = window.confirm(
              'Activity completed. Calculate results now?'
            )
            if (ok) onNext()
          }}
        >
          Next
        </button>
      )}
    </div>
  )
}
