// Epley 1RM formula
export function estimate1RM(weight, reps) {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  return Math.round(weight * (1 + reps / 30))
}

// Best set 1RM for an exercise session
export function sessionMax1RM(sets) {
  return sets.reduce((max, set) => {
    const rm = estimate1RM(Number(set.weight), Number(set.reps))
    return rm > max ? rm : max
  }, 0)
}

// Total volume for a session
export function sessionVolume(sets) {
  return sets.reduce((total, set) => total + Number(set.reps) * Number(set.weight), 0)
}

// 7-day rolling average for weight entries
export function rollingAverage(entries, days = 7) {
  if (!entries.length) return []
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))
  return sorted.map((entry, i) => {
    const window = sorted.slice(Math.max(0, i - days + 1), i + 1)
    const avg = window.reduce((sum, e) => sum + Number(e.weight), 0) / window.length
    return { ...entry, rollingAvg: Math.round(avg * 10) / 10 }
  })
}

// Linear regression for trend line
export function linearRegression(data) {
  const n = data.length
  if (n < 2) return null
  const xs = data.map((_, i) => i)
  const ys = data.map(d => d.y)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  const slope = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0) /
    xs.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0)
  const intercept = meanY - slope * meanX
  return { slope, intercept, start: slope * 0 + intercept, end: slope * (n - 1) + intercept }
}

// Detect plateau: no improvement in N days
export function detectPlateaus(exerciseEntries, days = 21) {
  const byExercise = {}
  for (const entry of exerciseEntries) {
    if (!byExercise[entry.exercise]) byExercise[entry.exercise] = []
    byExercise[entry.exercise].push(entry)
  }

  const plateaus = []
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

  for (const [exercise, entries] of Object.entries(byExercise)) {
    const recent = entries
      .filter(e => new Date(e.date).getTime() >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    if (recent.length < 2) continue

    const recentMax = Math.max(...recent.map(e => sessionMax1RM(e.sets)))
    const allBefore = entries.filter(e => new Date(e.date).getTime() < cutoff)
    if (allBefore.length === 0) continue

    const historicalMax = Math.max(...allBefore.map(e => sessionMax1RM(e.sets)))
    if (recentMax <= historicalMax) {
      const lastDate = recent[recent.length - 1].date
      plateaus.push({ exercise, lastDate, recentMax, historicalMax, daysSince: days })
    }
  }
  return plateaus
}

// Personal records: find new PR for each exercise
export function findPRs(exerciseEntries) {
  const byExercise = {}
  for (const entry of exerciseEntries) {
    if (!byExercise[entry.exercise]) byExercise[entry.exercise] = []
    byExercise[entry.exercise].push(entry)
  }

  const prs = {}
  for (const [exercise, entries] of Object.entries(byExercise)) {
    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))
    let maxRM = 0
    for (const entry of sorted) {
      const rm = sessionMax1RM(entry.sets)
      if (rm > maxRM) {
        maxRM = rm
        prs[exercise] = { exercise, date: entry.date, rm, sets: entry.sets }
      }
    }
  }
  return Object.values(prs)
}

// Group exercises by week for volume chart
export function weeklyVolume(exerciseEntries) {
  const weeks = {}
  for (const entry of exerciseEntries) {
    const date = new Date(entry.date)
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const key = monday.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = 0
    weeks[key] += sessionVolume(entry.sets)
  }
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, volume]) => ({ week, volume: Math.round(volume) }))
}

// Group cardio by week
export function weeklyCardio(cardioEntries) {
  const weeks = {}
  for (const entry of cardioEntries) {
    const date = new Date(entry.date)
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const key = monday.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = { week: key, total: 0, sessions: 0 }
    weeks[key].total += Number(entry.duration) || 0
    weeks[key].sessions += 1
  }
  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week))
}

// Weekly alcohol
export function weeklyAlcohol(alcoholEntries) {
  const weeks = {}
  for (const entry of alcoholEntries) {
    const date = new Date(entry.date)
    const monday = new Date(date)
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const key = monday.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = { week: key, drinks: 0 }
    weeks[key].drinks += Number(entry.drinks) || 0
  }
  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week))
}

// Format date for display
export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fmtDateFull(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get this week's date range
export function thisWeekRange() {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

export function isThisWeek(dateStr) {
  const { start, end } = thisWeekRange()
  const d = new Date(dateStr + 'T00:00:00')
  return d >= start && d <= end
}
