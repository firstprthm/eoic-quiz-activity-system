import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Routes, Route } from 'react-router-dom'
import Attendance from './screens/Attendance'
import QuizRules from './screens/QuizRules'
import QuizTeamSelect from './screens/QuizTeamSelect'
import QuizRepresentativeSelect from './screens/QuizRepresentativeSelect'
import QuizQuestionScreen from './screens/QuizQuestionScreen'
import ActivityRules from './screens/ActivityRules'
import ActivityMaster from './screens/ActivityMaster'
import ActivityMark from './screens/ActivityMark'
import ResultsScreen from './screens/ResultsScreen'
import TieBreakerRules from './screens/TieBreakerRules'
import TieBreakerRepresentativeSelect from './screens/TieBreakerRepresentativeSelect'
import TieBreakerChallenge from './screens/TieBreakerChallenge'
import CompleteScreen from './screens/CompleteScreen'

type Screen = 
  | 'attendance' 
  | 'quiz_rules' 
  | 'quiz_team' 
  | 'quiz_representative'
  | 'quiz'
  | 'activity_rules'
  | 'activity_master'
  | 'results'
  | 'tie_breaker_rules'
  | 'tie_breaker_representative'
  | 'tie_breaker_challenge'
  | 'complete'

type QuizQuestion = {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
}

function ProjectorFlow() {
  const [screen, setScreen] = useState<Screen>('attendance')
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const currentEventId = '4c50ac46-4f56-4ba5-8ef4-71875887f547'
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)
  const [currentParticipantId, setCurrentParticipantId] = useState<number | null>(null)
  const [tiedTeams, setTiedTeams] = useState<number[]>([])
  const [tieBreakerReps, setTieBreakerReps] = useState<
    { teamId: number; participantId: number }[]
  >([])

  const [tieBreakerIndex, setTieBreakerIndex] = useState(0)

  async function getEligibleTeams(): Promise<number[]> {
    const { data, error } = await supabase
      .from('quiz_team_usage')
      .select('team_id, selection_count')
      .eq('event_id', currentEventId)

    if (error) {
      console.error(error)
      return []
    }

    const usageMap = new Map<number, number>()
    data?.forEach(row => {
      usageMap.set(row.team_id, row.selection_count)
    })

    // teams 1–7
    return [1, 2, 3, 4, 5, 6, 7].filter(
      teamId => (usageMap.get(teamId) ?? 0) < 2
    )
  }

  async function loadNextQuestion() {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .or('used.eq.false,used.is.null')
      .limit(1)

    if (error) {
      console.error('Supabase error:', error)
      return
    }

    if (!data || data.length === 0) {
      alert('No unused questions left')
      return
    }

    setCurrentQuestion(data[0])
  }

  async function markQuestionUsed(questionId: string) {
    const { error } = await supabase
      .from('quiz_questions')
      .update({ used: true })
      .eq('id', questionId)

    if (error) {
      console.error('Failed to mark question used', error)
    }
  }

  async function saveQuizAttempt(params: {
    questionId: string
    selectedOption: 'A' | 'B' | 'C' | 'D' | null
    isCorrect: boolean
    points: number
  }) {
    if (
      !currentEventId ||
      currentTeamId === null ||
      currentParticipantId === null
    ) {
      console.error('Missing quiz context')
      return
    }

    const { error } = await supabase
      .from('quiz_attempts')
      .insert({
        event_id: currentEventId,
        team_id: currentTeamId,
        participant_id: currentParticipantId,
        question_id: params.questionId,
        selected_option: params.selectedOption,
        is_correct: params.isCorrect,
        points_awarded: params.points
      })

    if (error) {
      console.error('Failed to save quiz attempt', error)
    }
  }

  async function incrementTeamUsage(teamId: number) {
    const { data } = await supabase
      .from('quiz_team_usage')
      .select('selection_count')
      .eq('event_id', currentEventId)
      .eq('team_id', teamId)
      .single()

    if (!data) {
      await supabase.from('quiz_team_usage').insert({
        event_id: currentEventId,
        team_id: teamId,
        selection_count: 1
      })
    } else {
      await supabase
        .from('quiz_team_usage')
        .update({ selection_count: data.selection_count + 1 })
        .eq('event_id', currentEventId)
        .eq('team_id', teamId)
    }
  }

  async function checkQuizCompleted(): Promise<boolean> {
    const { data, error } = await supabase
      .from('quiz_team_usage')
      .select('selection_count')
      .eq('event_id', currentEventId)

    if (error) {
      console.error(error)
      return false
    }

    if (!data) return false

    // All 7 teams must have selection_count = 2
    return data.length === 7 && data.every(row => row.selection_count >= 2)
  }


  useEffect(() => {
    // If user refreshes on representative screen without a team selected
    if (screen === 'quiz_representative' && selectedTeam === null) {
      setScreen('quiz_team')
    }
  }, [screen, selectedTeam])

  useEffect(() => {
    if (screen === 'quiz' && currentQuestion === null) {
      loadNextQuestion()
    }
  }, [screen])

  if (screen === 'attendance') {
    return (
      <Attendance
        onNext={() => setScreen('quiz_rules')}
      />
    )
  }

  if (screen === 'quiz_rules') {
    return (
      <QuizRules
        onNext={() => setScreen('quiz_team')}
      />
    )
  }

  if (screen === 'quiz_team') {
    return (
      <QuizTeamSelect
        getEligibleTeams={getEligibleTeams}
        onConfirm={(teamNumber) => {
          setSelectedTeam(teamNumber)
          setCurrentTeamId(teamNumber)
          setScreen('quiz_representative')
        }}
        onQuizCompleted={() => {
          setScreen('activity_rules')
        }}
      />
    )
  }

  if (screen === 'quiz_representative' && selectedTeam !== null) {
    return (
      <QuizRepresentativeSelect
        teamNumber={selectedTeam}
        eventId={currentEventId}
        onNext={(participant) => {
          setCurrentParticipantId(participant.id)
          setScreen('quiz') // next screen later
        }}
      />
    )
  }

  if (screen === 'quiz') {
    if (!currentQuestion) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 20
          }}
        >
          Loading question…
        </div>
      )
    }

    return (
      <QuizQuestionScreen
        question={currentQuestion}
        onRevealComplete={async (result) => {
          await saveQuizAttempt({
            questionId: currentQuestion.id,
            selectedOption: result.selectedOption,
            isCorrect: result.isCorrect,
            points: result.points
          })

          await supabase
            .from('quiz_participation')
            .upsert({
              event_id: currentEventId,
              participant_id: currentParticipantId,
              has_answered: true
            })

          await incrementTeamUsage(currentTeamId!)
          await markQuestionUsed(currentQuestion.id)

          const done = await checkQuizCompleted()
          return done
        }}

        onNext={(quizCompleted) => {
          if (quizCompleted) {
            const ok = window.confirm(
              'Quiz completed. Do you want to proceed to the activity?'
            )

            if (ok) {
              setScreen('activity_rules') // we’ll create this screen next
            }

            return
          }

          setCurrentQuestion(null)
          setScreen('quiz_team')
        }}
      />
    )
  }

  if (screen === 'activity_rules') {
    return (
      <ActivityRules
        onStartActivity={() => setScreen('activity_master')}
      />
    )
  }

  if (screen === 'activity_master') {
    return (
      <ActivityMaster
        eventId={currentEventId}
        onNext={() => {
          setScreen('results')
        }}
      />
    )
  }

  if (screen === 'results') {
    return (
      <ResultsScreen
        eventId={currentEventId}
        onComplete={() => setScreen('complete')}
        onTieBreaker={(teams) => {
          setTiedTeams(teams)
          setScreen('tie_breaker_rules')
        }}
      />
    )
  }

  if (screen === 'tie_breaker_rules') {
    return (
      <TieBreakerRules
        onNext={() => setScreen('tie_breaker_representative')}
      />
    )
  }

  if (screen === 'tie_breaker_representative') {
    const currentTeamId = tiedTeams[tieBreakerIndex]

    return (
      <TieBreakerRepresentativeSelect
        eventId={currentEventId}
        teamId={currentTeamId}
        onConfirm={(participantId) => {
          setTieBreakerReps(prev => [
            ...prev,
            { teamId: currentTeamId, participantId }
          ])

          if (tieBreakerIndex + 1 < tiedTeams.length) {
            setTieBreakerIndex(i => i + 1)
          } else {
            const ok = window.confirm('Are representatives ready?')
            if (ok) setScreen('tie_breaker_challenge')
          }
        }}
      />
    )
  }

  if (screen === 'tie_breaker_challenge') {
    return (
      <TieBreakerChallenge
        eventId={currentEventId}
        tiedTeams={tiedTeams}
        tieBreakerReps={tieBreakerReps}
        onComplete={() => setScreen('complete')}
      />
    )
  }

  if (screen === 'complete') {
    return <CompleteScreen />
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 18
      }}
    >
      Invalid state. Reloading…
    </div>
  )
}

export default function App()  {
  const currentEventId = '4c50ac46-4f56-4ba5-8ef4-71875887f547'

  return (
    <Routes>
      {/* Projector / main flow */}
      <Route path="/" element={<ProjectorFlow />} />

      {/* Phone-only marking page */}
      <Route
        path="/markpage"
        element={<ActivityMark eventId={currentEventId} />}
      />
    </Routes>
  )
}