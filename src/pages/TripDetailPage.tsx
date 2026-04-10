import type { Trip, Card, Expense } from '../types'

interface Props {
  trip: Trip
  cards: Card[]
  onBack: () => void
}

export default function TripDetailPage({ trip, cards, onBack }: Props) {
  const totalSpend = trip.expenses.reduce((s, e) => s + e.amount, 0)
  const totalReward = trip.expenses.reduce((s, e) => s + e.estimatedReward, 0)

  // Group expenses by date (most recent first within each day, days descending)
  const byDay: Record<string, Expense[]> = {}
  for (const e of [...trip.expenses].reverse()) {
    if (!byDay[e.date]) byDay[e.date] = []
    byDay[e.date].push(e)
  }
  const sortedDays = Object.keys(byDay).sort().reverse()

  function dayOfWeek(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', { weekday: 'short' })
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="text-sm px-2 py-1 rounded border transition-colors shrink-0"
          style={{ borderColor: '#3a2810', color: '#c8a060' }}
        >
          ← 返回
        </button>
        <h1 className="text-lg font-semibold text-[#f2e8c9] truncate">{trip.name}</h1>
      </div>
      <p className="text-xs text-[#9a7040] mb-4 pl-1">
        {trip.startDate}{trip.endDate ? ` — ${trip.endDate}` : ' · 進行中'}
      </p>

      {/* Summary row */}
      <div className="beast-card rounded-xl p-3 mb-4 flex gap-4"
        style={{ background: '#1a1208', border: '1px solid #3d2e14' }}>
        <div className="flex-1 text-center">
          <p className="text-[10px] text-[#9a7040] uppercase tracking-wider mb-0.5">總消費</p>
          <p className="font-semibold text-[#f2e8c9]">NT${totalSpend.toLocaleString()}</p>
        </div>
        <div className="w-px" style={{ background: '#3d2e14' }} />
        <div className="flex-1 text-center">
          <p className="text-[10px] text-[#9a7040] uppercase tracking-wider mb-0.5">總回饋</p>
          <p className="font-semibold" style={{ color: '#4ade80' }}>NT${totalReward.toLocaleString()}</p>
        </div>
        <div className="w-px" style={{ background: '#3d2e14' }} />
        <div className="flex-1 text-center">
          <p className="text-[10px] text-[#9a7040] uppercase tracking-wider mb-0.5">總筆數</p>
          <p className="font-semibold text-[#f2e8c9]">{trip.expenses.length} 筆</p>
        </div>
      </div>

      {/* Empty state */}
      {trip.expenses.length === 0 ? (
        <p className="text-[#9a7040] text-sm text-center py-8">此旅程尚無消費記錄</p>
      ) : (
        <div className="space-y-4">
          {sortedDays.map(date => {
            const dayExpenses = byDay[date]
            const daySpend = dayExpenses.reduce((s, e) => s + e.amount, 0)
            const dayReward = dayExpenses.reduce((s, e) => s + e.estimatedReward, 0)

            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#d4a017]">{date}</span>
                    <span className="text-[10px] text-[#9a7040]">（{dayOfWeek(date)}）</span>
                    <span className="text-[10px] text-[#9a7040]">{dayExpenses.length} 筆</span>
                  </div>
                  <div className="text-[10px] text-[#9a7040]">
                    消費 <span className="text-[#c8a060]">NT${daySpend.toLocaleString()}</span>
                    {' · '}回饋 <span style={{ color: '#4ade80' }}>NT${dayReward.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expense cards */}
                <div className="space-y-2">
                  {dayExpenses.map(e => {
                    const card = cards.find(c => c.id === e.cardId)
                    return (
                      <div key={e.id}
                        className="beast-card rounded-xl p-3"
                        style={{ background: '#1a1208', border: '1px solid #3d2e14' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#9a7040]">{e.store ?? '一般消費'}</p>
                            <p className="font-medium text-[#f2e8c9]">
                              {e.foreignAmount
                                ? `¥${e.foreignAmount.amount.toLocaleString()} (NT$${e.amount.toLocaleString()})`
                                : `NT$${e.amount.toLocaleString()}`}
                            </p>
                            <p className="text-xs text-[#c8a060] mt-0.5">
                              {card?.name ?? e.cardId}
                              {e.rewardBreakdown && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                                  style={{ background: 'rgba(212,160,23,0.12)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.2)' }}>
                                  {e.rewardBreakdown.effectiveRate}%
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs" style={{ color: '#4ade80' }}>回饋 NT${e.estimatedReward.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
