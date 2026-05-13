export function toLocalDate(utcDate: Date): Date {
  const offsetMs = -new Date().getTimezoneOffset() * 60000
  return new Date(utcDate.getTime() + offsetMs)
  return new Date(utcDate)
} 

export function isSameDay(a: Date, b: Date): boolean {
  const localA = toLocalDate(a)
  const localB = toLocalDate(b)
  return (
    localA.getFullYear() === localB.getFullYear() &&
    localA.getMonth() === localB.getMonth() &&
    localA.getDate() === localB.getDate()
  )
}

export function formatDateLabel(date: Date): string {
  const localNow = toLocalDate(new Date())
  const today = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate())
  const localDate = toLocalDate(date)
  const target = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / 86400000,
  )

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  if (localDate.getFullYear() === localNow.getFullYear()) {
    return `${months[localDate.getMonth()]} ${localDate.getDate()}`
  }

  return `${months[localDate.getMonth()]} ${localDate.getDate()}, ${localDate.getFullYear()}`
}