'use client'

type FocusNotificationsProps = {
  todayCount: number
  doingCount: number
}

const MAX_TODAY = 3
const MAX_DOING = 1

export default function FocusNotifications({ todayCount, doingCount }: FocusNotificationsProps) {
  const tooManyToday = todayCount > MAX_TODAY
  const noneDoing = doingCount === 0 && todayCount > 0

  if (!tooManyToday && !noneDoing) return null

  return (
    <div className="mb-4 space-y-2">
      {tooManyToday && (
        <div className="bg-amber-900/50 border border-amber-700 rounded-lg px-4 py-3 text-amber-200 text-sm">
          Você tem mais de 3 tarefas em &quot;Hoje&quot;. Mova algumas para o Backlog para manter o foco.
        </div>
      )}
      {noneDoing && (
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg px-4 py-3 text-blue-200 text-sm">
          Escolha uma tarefa e comece agora — arraste uma para &quot;Fazendo&quot; ou use o timer de foco.
        </div>
      )}
    </div>
  )
}
