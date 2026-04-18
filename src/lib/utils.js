export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function convertWeight(value, from, to) {
  if (from === to) return value
  if (from === 'lbs' && to === 'kg') return Math.round(value * 0.453592 * 10) / 10
  if (from === 'kg' && to === 'lbs') return Math.round(value * 2.20462 * 10) / 10
  return value
}

export function exportToJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToCSV(data, storeName) {
  const rows = data[storeName]
  if (!rows || rows.length === 0) return

  let csv = ''
  if (storeName === 'exercises') {
    csv = 'id,date,exercise,sets,notes\n'
    rows.forEach(r => {
      const setsStr = r.sets.map(s => `${s.reps}x${s.weight}${s.unit}`).join(';')
      csv += `${r.id},${r.date},${r.exercise},"${setsStr}","${r.notes || ''}"\n`
    })
  } else if (storeName === 'weight') {
    csv = 'id,date,weight,unit,notes\n'
    rows.forEach(r => { csv += `${r.id},${r.date},${r.weight},${r.unit},"${r.notes || ''}"\n` })
  } else if (storeName === 'cardio') {
    csv = 'id,date,type,duration,intensity,distance,notes\n'
    rows.forEach(r => { csv += `${r.id},${r.date},${r.type},${r.duration},${r.intensity || ''},${r.distance || ''},"${r.notes || ''}"\n` })
  } else if (storeName === 'alcohol') {
    csv = 'id,date,drinks,type,notes\n'
    rows.forEach(r => { csv += `${r.id},${r.date},${r.drinks},${r.type || ''},"${r.notes || ''}"\n` })
  }

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitness-${storeName}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function timeSince(ms) {
  if (!ms) return 'never'
  const diff = Date.now() - ms
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
