export function todayString() {
  return new Date().toISOString().split('T')[0]
}

export function formatDateLabel(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
