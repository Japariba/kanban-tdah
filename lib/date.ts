export const APP_TIME_ZONE = 'America/Sao_Paulo'

export function formatDateKeyInTimeZone(
  date: Date,
  timeZone: string = APP_TIME_ZONE
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Could not format date in configured time zone.')
  }

  return `${year}-${month}-${day}`
}
