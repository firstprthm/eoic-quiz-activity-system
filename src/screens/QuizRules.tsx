type Props = {
  onNext: () => void
}

export default function QuizRules({ onNext }: Props) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 10,
        fontFamily: 'Arial, sans-serif',
        color: '#000000'
      }}
    >
      <div style={{ width: 600 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 32 }}>
          Quiz Rules
        </h1>

        <ol style={{ fontSize: 18, lineHeight: 1.6 }}>
          <li>There are <b>14 questions</b> in total.</li>
          <li>Each team will answer exactly <b>2 questions</b>.</li>
          <li>Teams are chosen at random.</li>
          <li>Before the question is revealed, the team must choose <b>one member</b> to answer the question.</li>
          <li>No discussion after the representative is chosen, only the chosen member may answer.</li>
          <li>A participant can answer only once in the entire quiz.</li>
          <li>
            After the question is read aloud, options will be revealed and
            a <b>20-second timer</b> will start.
          </li>
          <li>
            If no answer is locked within time, the question is skipped and
            <b>−1 point</b> is awarded.
          </li>
          <li>Correct answer: <b>+3 points</b>.</li>
          <li>Wrong answer: <b>−1 point</b>.</li>
        </ol>

        <button
          style={{
            marginTop: 40,
            width: '100%',
            padding: 12,
            fontSize: 18
          }}
          onClick={() => {
            const ok = window.confirm(
              'Start the quiz now?'
            )
            if (ok) {
              onNext()
            }
          }}
        >
          Start Quiz
        </button>
      </div>
    </div>
  )
}
