type Props = {
  onNext: () => void
}

export default function TieBreakerRules({ onNext }: Props) {
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
        <h1 style={{ marginBottom: 28 }}>
          Tie-Breaker Rules
        </h1>

        <div style={{ fontSize: 20, lineHeight: 1.7, textAlign: 'left' }}>
          <ul style={{ padding: 0 }}>
            <li>
              This tie-breaker is conducted <b>only for teams tied for 1st place</b>.
            </li>
            <li>
              Each tied team must <b>select one representative</b>.
            </li>
            <li>
              <b>Participants who have already answered a quiz question are not eligible</b>.
            </li>
            <li>
              This round is a <b>sudden-death challenge</b>.
            </li>
            <li>
              The <b>last remaining participant wins</b>, earning <b>+3 points</b> for their team.
            </li>
            <li>
              <b>No negative points</b> are awarded to teams that lose this tie-breaker.
            </li>
          </ul>
        </div>

        <button
          style={{
            marginTop: 40,
            padding: '14px 32px',
            fontSize: 18,
            border: '3px solid #000',
            cursor: 'pointer'
          }}
          onClick={() => {
            const ok = window.confirm(
              'Proceed to representative selection for the tie-breaker?'
            )
            if (ok) onNext()
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
