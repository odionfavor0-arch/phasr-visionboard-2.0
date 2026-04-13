import React, { useEffect, useState } from 'react'

export default function DailyCheckin(props) {
  const [tasks, setTasks] = useState([])
  const [dayNumber, setDayNumber] = useState(1)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [daysCompleted, setDaysCompleted] = useState(0)

  const boardData = JSON.parse(localStorage.getItem('phasr_vb') || '{}')
  const currentPhase = boardData.phases?.[0]

  // RULE 1 — No vision board
  if (!currentPhase?.pillars?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 8 }}>
          Set up your Vision Board first
        </p>
        <p style={{ fontSize: '0.82rem', color: '#7a5a66', lineHeight: 1.6 }}>
          Your daily tasks come from your pillars and activities. Add them to your Vision Board to activate your streak.
        </p>
      </div>
    )
  }

  // RULE 3 — ALL activities
  const allActivities = currentPhase.pillars.flatMap(pillar =>
    (pillar.activities || []).map(act => ({
      id: `${pillar.id}_${act}`,
      description: act,
      pillar: pillar.name,
      done: false,
    }))
  )

  // Get phase start
  const phaseStart = new Date(currentPhase.startDate || new Date())
  const today = new Date()

  const diffDays = Math.floor((today - phaseStart) / (1000 * 60 * 60 * 24))

  const computedWeek = Math.floor(diffDays / 7) + 1
  const computedDay = (diffDays % 7) + 1

  useEffect(() => {
    setCurrentWeek(computedWeek)
    setDayNumber(computedDay)

    const saved = JSON.parse(
      localStorage.getItem(`phasr_tasks_w${computedWeek}_d${computedDay}`) || 'null'
    )

    if (saved) {
      setTasks(saved)
    } else {
      setTasks(allActivities)
    }

    // RULE 4 — count completed days
    let completed = 0
    for (let d = 1; d <= 7; d++) {
      const dayData = JSON.parse(
        localStorage.getItem(`phasr_tasks_w${computedWeek}_d${d}`) || 'null'
      )
      if (dayData && dayData.length > 0 && dayData.every(t => t.done)) {
        completed++
      }
    }
    setDaysCompleted(completed)
  }, [])

  // Save tasks
  const toggleTask = id => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    setTasks(updated)
    localStorage.setItem(
      `phasr_tasks_w${currentWeek}_d${dayNumber}`,
      JSON.stringify(updated)
    )
  }

  // Sage Data
  const totalTasksThisWeek = allActivities.length * 7

  let completedTasksThisWeek = 0
  for (let d = 1; d <= 7; d++) {
    const saved = JSON.parse(
      localStorage.getItem(`phasr_tasks_w${currentWeek}_d${d}`) || 'null'
    ) || []
    completedTasksThisWeek += saved.filter(t => t.done).length
  }

  const weekStreakPercent = Math.round(
    (completedTasksThisWeek / totalTasksThisWeek) * 100
  ) || 0

  const prevWeekPulseDone =
    currentWeek === 1 ||
    localStorage.getItem(`phasr_weekly_pulse_w${currentWeek - 1}_done`) === 'true'

  const currentWeekPulseDone =
    localStorage.getItem(`phasr_weekly_pulse_w${currentWeek}_done`) === 'true'

  const weekComplete = daysCompleted === 7

  return (
    <div>

      {/* Quiet reminder */}
      {currentWeek > 1 && !prevWeekPulseDone && (
        <p
          style={{ fontSize: '0.7rem', color: '#e8407a', marginBottom: 8, cursor: 'pointer' }}
          onClick={props.onOpenWeeklyPulse}
        >
          Week {currentWeek - 1} reflection with Sage is still pending. Tap to complete it.
        </p>
      )}

      {/* Top card */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontWeight: 700 }}>
          Week {currentWeek} • Day {dayNumber} of 7
        </p>

        <div style={{
          height: 6,
          background: '#f3d1dc',
          borderRadius: 4,
          overflow: 'hidden',
          marginTop: 6
        }}>
          <div style={{
            width: `${(daysCompleted / 7) * 100}%`,
            height: '100%',
            background: '#e8407a'
          }} />
        </div>
      </div>

      {/* Tasks */}
      <div>
        <p style={{ marginBottom: 8 }}>
          {tasks.filter(t => t.done).length}/{tasks.length} completed
        </p>

        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            style={{
              padding: '0.7rem',
              border: '1px solid #eee',
              borderRadius: 10,
              marginBottom: 6,
              cursor: 'pointer',
              background: task.done ? '#ffe6ef' : '#fff'
            }}
          >
            {task.description}
          </div>
        ))}
      </div>

      {/* Sage Card */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #f2c4d0',
        borderRadius: 16,
        padding: '1rem',
        marginTop: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e8407a, #f472a8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.55rem',
            color: '#fff'
          }}>SAGE</div>

          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e8407a' }}>
            Live Score
          </p>

          <p style={{ fontSize: '0.65rem', color: '#b08090', marginLeft: 'auto' }}>
            {weekStreakPercent}% this week
          </p>
        </div>

        {weekComplete && !currentWeekPulseDone && (
          <>
            <p style={{ fontSize: '0.82rem', marginBottom: 12 }}>
              Week {currentWeek} closed at {weekStreakPercent}%.
              Two questions. Sage reads your week and tells you
              what matters going into week {currentWeek + 1}.
            </p>

            <button
              onClick={props.onOpenWeeklyPulse}
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #e8407a, #f472a8)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Open Weekly Pulse
            </button>
          </>
        )}

        {weekComplete && currentWeekPulseDone && (
          <p style={{ fontSize: '0.82rem' }}>
            Week {currentWeek} done. Reflection complete.
            Week {currentWeek + 1} is open.
          </p>
        )}

        {!weekComplete && !prevWeekPulseDone && currentWeek > 1 && (
          <p style={{ fontSize: '0.82rem' }}>
            You are {dayNumber} days into week {currentWeek}.
            Your week {currentWeek - 1} reflection with Sage
            is still pending.
            <span
              onClick={props.onOpenWeeklyPulse}
              style={{ color: '#e8407a', fontWeight: 700, cursor: 'pointer' }}
            >
              Complete now
            </span>
          </p>
        )}

        {!weekComplete && prevWeekPulseDone && (
          <p style={{ fontSize: '0.82rem' }}>
            Day {dayNumber} of 7. You have completed {completedTasksThisWeek} of {totalTasksThisWeek} tasks this week.
            {weekStreakPercent >= 50
              ? ' You are on track. Keep going.'
              : ' Stay consistent. Every task counts.'}
          </p>
        )}
      </div>

    </div>
  )
}
