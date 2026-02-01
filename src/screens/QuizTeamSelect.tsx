import { useEffect, useRef, useState } from 'react'

type Props = {
  getEligibleTeams: () => Promise<number[]>
  onConfirm: (teamNumber: number) => void | Promise<void>
  onQuizCompleted: () => void
}

export default function QuizTeamSelect({ getEligibleTeams, onConfirm, onQuizCompleted }: Props) {
  const [eligibleTeams, setEligibleTeams] = useState<number[]>([])
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    const teams = await getEligibleTeams()

    if (teams.length === 0) {
      if (handledRef.current) return
      handledRef.current = true

      const ok = window.confirm(
        'Quiz already completed. Do you want to proceed to the activity?'
      )

      if (ok) {
        onQuizCompleted()
      }

      return
    }

    setEligibleTeams(teams)
  }

  function pickRandomTeam() {
    const randomIndex = Math.floor(Math.random() * eligibleTeams.length)
    setSelectedTeam(eligibleTeams[randomIndex])
  }

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
      <div style={{ width: 500, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 32 }}>
          Team Selection
        </h1>

        {selectedTeam === null ? (
          <button
            style={{ fontSize: 20, padding: '12px 24px' }}
            onClick={pickRandomTeam}
          >
            Select Team
          </button>
        ) : (
          <>
              <div
                style={{
                  border: '4px solid #000',
                  padding: '40px 20px',
                  marginBottom: 32,
                  borderRadius: 12,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    letterSpacing: 2,
                    marginBottom: 12
                  }}
                >
                  SELECTED TEAM
                </div>

                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 900,
                    letterSpacing: 4
                  }}
                >
                  TEAM {selectedTeam}
                </div>
              </div>


            <button
              style={{ fontSize: 18, padding: '10px 20px' }}
              onClick={() => {
                const ok = window.confirm(
                  `Confirm Team ${selectedTeam}?`
                )
                if (ok) {
                  onConfirm(selectedTeam)
                }
              }}
            >
              Confirm
            </button>
          </>
        )}
      </div>
    </div>
  )
}
