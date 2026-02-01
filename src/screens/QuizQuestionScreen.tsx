import { useEffect, useRef, useState } from 'react'

type Question = {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
}

type Phase =
  | 'idle'
  | 'question'
  | 'options'
  | 'locked'
  | 'revealed'
  | 'no_answer'

type Props = {
  question: Question
  onRevealComplete: (result: {
    selectedOption: 'A' | 'B' | 'C' | 'D' | null
    isCorrect: boolean
    points: number
  }) => Promise<boolean>
  onNext: (quizCompleted: boolean) => void
}

export default function QuizQuestionScreen({ question, onRevealComplete, onNext }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [timeLeft, setTimeLeft] = useState(15)
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null)

  const timerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (phase !== 'options') return

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'options') return

    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      setPhase('no_answer')
      return
    }

    if (timeLeft <= 5 && timeLeft > 0) {
      playBeep()
    }
  }, [timeLeft, phase])

  /* ---------- HELPERS ---------- */
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function optionBox(
    key: 'A' | 'B' | 'C' | 'D',
    text: string
  ) {
    let bg = '#ffffff'

    const isTempSelected = phase === 'options' && selected === key

    if (phase === 'locked' && selected === key) bg = '#fff3cd' // yellow
    if (phase === 'revealed') {
      if (key === question.correct_option) bg = '#d4edda' // green
      else if (selected === key) bg = '#f8d7da' // red
    }

    return (
      <div
        key={key}
        onClick={() => {
          if (phase !== 'options') return
          setSelected(key)
        }}
        style={{
          padding: '14px 16px',
          marginBottom: 10,
          borderRadius: 6,
          border: isTempSelected
            ? '3px solid #000'
            : '1px solid #999',
          cursor: phase === 'options' ? 'pointer' : 'default',
          backgroundColor: bg,
          fontSize: 16,
          fontWeight: isTempSelected ? 600 : 400
        }}
      >
        <strong>{key}.</strong> {text}
      </div>
    )
  }

  /* ---------- BACKGROUND COLOR ---------- */
  let parentBg = '#ffffff'
  if (phase === 'revealed') {
    parentBg =
      selected === question.correct_option ? '#e6fffa' : '#ffe6e6'
  }
  if (phase === 'no_answer') parentBg = '#ffe6e6'

  /* ---------- PLAY BEEP ------------ */
  function playBeep() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
      }

      const ctx = audioCtxRef.current

      // Required by browser policies
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = 880
      gain.gain.value = 0.08

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.15)
    } catch (e) {
      console.warn('Beep blocked or failed:', e)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        color: '#000000',
        backgroundColor: parentBg,
        padding: 24,
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,   // ⭐ key projection-safe width
        }}
      >
        {/* QUESTION BOX */}
        {(phase !== 'idle') && (
          <div
            style={{
              padding: 20,
              border: '3px solid #000',
              borderRadius: 8,
              marginBottom: 16,
              backgroundColor: '#ffffff',
              minHeight: 80,
              textAlign: 'center',
              fontSize: 18,
              lineHeight: 1.4
            }}
          >
            {question.question_text}
          </div>
        )}

        {/* TIMER */}
        {(phase === 'question' || phase === 'options') && (
          <div
            style={{
              width: 120,
              margin: '0 auto 16px auto',
              padding: '8px 0',
              textAlign: 'center',
              fontSize: 32,
              fontWeight: 700,
              border: '3px solid #000',
              borderRadius: 8,
              backgroundColor: '#ffffff',
              color: timeLeft <= 5 ? 'red' : 'black',
              animation:
                timeLeft <= 5 && phase === 'options'
                  ? 'blink 0.5s step-start infinite'
                  : 'none'
            }}
          >
            {timeLeft}
          </div>
        )}

        {/* OPTIONS */}
        {(phase === 'options' ||
          phase === 'locked' ||
          phase === 'revealed' ||
          phase === 'no_answer') && (
            <div>
              {optionBox('A', question.option_a)}
              {optionBox('B', question.option_b)}
              {optionBox('C', question.option_c)}
              {optionBox('D', question.option_d)}
            </div>
          )}

        {/* BUTTONS */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          {phase === 'idle' && (
            <button onClick={() => setPhase('question')}>
              Reveal Question
            </button>
          )}

          {phase === 'question' && (
            <button
              onClick={() => {
                setPhase('options')
                setTimeLeft(15)
              }}
            >
              Reveal Options
            </button>
          )}

          {phase === 'options' && (
            <button
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                const ok = window.confirm(`Lock option ${selected}?`)
                if (!ok) return
                stopTimer()
                setPhase('locked')
              }}
            >
              Lock Option
            </button>
          )}

          {(phase === 'locked' || phase === 'no_answer') && (
            <button onClick={() => setPhase('revealed')}>
              Reveal Answer
            </button>
          )}

          {phase === 'revealed' && (
            <button
              onClick={async () => {
                const isCorrect = selected === question.correct_option
                const points = isCorrect ? 3 : -1

                const quizCompleted = await onRevealComplete({
                  selectedOption: selected,
                  isCorrect,
                  points
                })

                onNext(quizCompleted)
              }}
            >
              Next
            </button>
          )}
        </div>

        {/* BEEP AUDIO */}


        <style>
          {`
          @keyframes blink {
            50% { opacity: 0; }
          }
          `}
        </style>
      </div>
    </div>
  )
}
