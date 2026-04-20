import { useState } from 'react'
import type { Trip, Card, Expense } from '../types'

interface Props {
  trip: Trip
  cards: Card[]
  onBack: () => void
}

export default function TripDetailPage({ trip, cards, onBack }: Props) {
  const totalSpend = trip.expenses.reduce((s, e) => s + e.amount, 0)
  const totalReward = trip.expenses.reduce((s, e) => s + e.estimatedReward, 0)

  const byDay: Record<string, Expense[]> = {}
  for (const e of [...trip.expenses].reverse()) {
    if (!byDay[e.date]) byDay[e.date] = []
    byDay[e.date].push(e)
  }
  const sortedDays = Object.keys(byDay).sort().reverse()

  const [selectedDay, setSelectedDay] = useState<string>(sortedDays[0] ?? '')

  function dayOfMonth(dateStr: string): string {
    return String(new Date(dateStr + 'T00:00:00').getDate())
  }

  function dayOfWeek(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', { weekday: 'short' })
  }

  const dayExpenses = selectedDay ? (byDay[selectedDay] ?? []) : []
  const daySpend = dayExpenses.reduce((s, e) => s + e.amount, 0)
  const dayReward = dayExpenses.reduce((s, e) => s + e.estimatedReward, 0)

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="text-sm px-2 py-1 rounded border transition-colors shrink-0"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          ← 返回
        </button>
        <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-base)' }}>{trip.name}</h1>
      </div>
      <p className="text-xs mb-4 pl-1" style={{ color: 'var(--color-text-muted)' }}>
        {trip.startDate}{trip.endDate ? ` — ${trip.endDate}` : ' · 進行中'}
      </p>

      {/* Summary row */}
      <div className="glass-card p-3 mb-4 flex gap-4">
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>總消費</p>
          <p className="font-semibold" style={{ color: 'var(--color-text-base)' }}>NT${totalSpend.toLocaleString()}</p>
        </div>
        <div className="w-px" style={{ background: 'var(--color-border)' }} />
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>總回饋</p>
          <p className="font-semibold" style={{ color: 'var(--color-success)' }}>NT${totalReward.toLocaleString()}</p>
        </div>
        <div className="w-px" style={{ background: 'var(--color-border)' }} />
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>總筆數</p>
          <p className="font-semibold" style={{ color: 'var(--color-text-base)' }}>{trip.expenses.length} 筆</p>
        </div>
      </div>

      {trip.expenses.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>此旅程尚無消費記錄</p>
      ) : (
        <>
          {/* Date chip strip */}
          <div className="overflow-x-auto flex gap-2 pb-2 mb-3 -mx-1 px-1">
            {[...sortedDays].reverse().map(date => {
              const isSelected = date === selectedDay
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDay(date)}
                  className="flex flex-col items-center shrink-0 rounded-full w-12 py-1.5 transition-colors"
                  style={isSelected
                    ? { background: 'var(--color-secondary)', color: '#fff' }
                    : { border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', background: 'transparent' }
                  }
                >
                  <span className="text-sm font-semibold leading-none">{dayOfMonth(date)}</span>
                  <span className="text-[10px] mt-0.5 leading-none">{dayOfWeek(date)}</span>
                </button>
              )
            })}
          </div>

          {/* Daily subtotal */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{dayExpenses.length} 筆</span>
            <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              消費 <span style={{ color: 'var(--color-text-base)' }}>NT${daySpend.toLocaleString()}</span>
              {' · '}回饋 <span style={{ color: 'var(--color-success)' }}>NT${dayReward.toLocaleString()}</span>
            </div>
          </div>

          {/* Expense cards */}
          <div className="space-y-2">
            {dayExpenses.map(e => {
              const card = cards.find(c => c.id === e.cardId)
              return (
                <div key={e.id} className="glass-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.store ?? '一般消費'}</p>
                      <p className="font-medium" style={{ color: 'var(--color-text-base)' }}>
                        {e.foreignAmount
                          ? `¥${e.foreignAmount.amount.toLocaleString()} (NT$${e.amount.toLocaleString()})`
                          : `NT$${e.amount.toLocaleString()}`}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {card?.name ?? '已刪除的卡片'}
                        {e.rewardBreakdown && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                            style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--color-secondary)', border: '1px solid rgba(245,166,35,0.25)' }}>
                            {e.rewardBreakdown.effectiveRate}%
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs" style={{ color: 'var(--color-success)' }}>回饋 NT${e.estimatedReward.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
