import { useState } from 'react'

type Props = {
  onStartActivity: () => void
}

export default function ActivityRules({ onStartActivity }: Props) {
  const [step, setStep] = useState<1 | 2>(1)

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        color: '#000000'
      }}
    >
      <div
        style={{
          width: 800,
          textAlign: 'center'
        }}
      >
        {step === 1 && (
          <>
            <h1 style={{ marginBottom: 24 }}>
              Activity Rules - I
            </h1>

            <div style={{ fontSize: 20, lineHeight: 1.6 }}>
              <h3>General Rules</h3>
              <ul style={{ padding: 0, textAlign: 'left' }}>
                <li>Team members are first shuffled across different teams.</li>
                <li>Points are awarded to individuals but contributes to their original team's total.</li>
                <li>No reminders or clarifications will be provided during the activity.</li>
                <li>The Activity continues until completion, regardless of eliminations.</li>
              </ul>

              <h3 style={{ marginTop: 20 }}>Scoring System</h3>
              <ul style={{ padding: 0, textAlign: 'left' }}>
                <li>Points are awarded based on time intervals.</li>
                <li>Every successful 5-minute interval earns <b>+3 points</b>.</li>
                <li>Failing before first 5 minutes results in <b>–1 point</b>.</li>
                <li>Failing after earning points deducts <b>–1 point</b> and ends scoring.</li>
              </ul>
            </div>

            <button
              style={{
                marginTop: 40,
                padding: '14px 28px',
                fontSize: 18
              }}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ marginBottom: 24 }}>
              Activity Rules - II
            </h1>

            <div style={{ fontSize: 20, lineHeight: 1.6, textAlign: 'center' }}>
              <h2 style={{ marginTop: 20 }}>
                Guided Meditation
              </h2>

              <ol style={{ marginTop: 20, padding: 0, textAlign: 'left' }}>
                <li>
                  A <b>beep sequence</b> will be played to signal the start. At this moment, all participants must <b>close their eyes</b> and begin meditation.
                </li>
                <li>
                  Participants must remain still and focused until the <b>same beep sequence</b> is played again to signal the end. This is the final <b>judging condition</b>.
                </li>
                <li>
                  <b>If a participant opens their eyes at any time, for any reason</b>, they are immediately marked out.
                </li>
                <li>
                  There is <b>no scope for arguments, appeals, or explanations</b>. Observers’ decisions are final.
                </li>
              </ol>

              <p style={{ marginTop: 20, fontStyle: 'italic', color: '#f44747' }}>
                This activity is not as easy as it sounds.
              </p>
            </div>

            <button
              style={{
                marginTop: 40,
                padding: '14px 28px',
                fontSize: 18
              }}
              onClick={() => {
                const ok = window.confirm(
                  'Start the activity now?'
                )
                if (ok) {
                  onStartActivity()
                }
              }}
            >
              Start Activity
            </button>
          </>
        )}
      </div>
    </div>
  )
}
