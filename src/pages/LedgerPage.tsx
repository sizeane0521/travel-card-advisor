import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { calcExpenseReward } from '../lib/rewardCalc'
import type { Expense } from '../types'
import DatePicker from '../components/DatePicker'

export default function LedgerPage() {
  const { data, dispatch } = useStore()
  const activeTrip = data.trips.find(t => t.id === data.activeTripId) ?? null

  const expenses = activeTrip ? [...activeTrip.expenses].reverse() : []
  const allExpenses = data.trips.flatMap(t => t.expenses)

  // Group expenses by date for date chip strip
  const byDay: Record<string, typeof expenses> = {}
  for (const e of expenses) {
    if (!byDay[e.date]) byDay[e.date] = []
    byDay[e.date].push(e)
  }
  const sortedDays = Object.keys(byDay).sort().reverse()

  // 7.1 Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editCardId, setEditCardId] = useState('')

  // Card filter state
  const [filterCardId, setFilterCardId] = useState<string>('all')

  // Date chip state — '' means auto-select most recent day
  const [selectedDay, setSelectedDay] = useState<string>('')
  const effectiveDay = (selectedDay && byDay[selectedDay]) ? selectedDay : (sortedDays[0] ?? '')

  // Reset filters when active trip changes
  useEffect(() => {
    setFilterCardId('all')
    setSelectedDay('')
  }, [data.activeTripId])

  function handleDelete(expenseId: string) {
    if (!activeTrip) return
    dispatch({ type: 'DELETE_EXPENSE', tripId: activeTrip.id, expenseId })
  }

  function startEdit(e: Expense) {
    setEditingId(e.id)
    setEditAmount(String(e.amount))
    setEditDate(e.date)
    setEditCardId(e.cardId)
  }

  // 7.3 Cancel edit
  function cancelEdit() {
    setEditingId(null)
  }

  // 7.4 Save edit — recalculate reward with default prerequisites
  function saveEdit(original: Expense) {
    if (!activeTrip) return
    const parsedAmount = parseInt(editAmount, 10)
    if (!parsedAmount || parsedAmount <= 0) return

    const card = data.cards.find(c => c.id === editCardId)
    if (!card) return

    const { estimatedReward, paymentMethodReward, breakdown } = calcExpenseReward(
      card,
      parsedAmount,
      original.store,
      activeTrip.expenses,
      original.paymentMethod ?? 'physical',
      undefined,
      undefined, // no prereq overrides — accepted small difference
      allExpenses
    )

    const updated: Expense = {
      ...original,
      amount: parsedAmount,
      date: editDate,
      cardId: editCardId,
      estimatedReward,
      paymentMethodReward,
      rewardBreakdown: {
        base: breakdown.base,
        store: breakdown.store,
        paymentMethod: breakdown.paymentMethod,
        effectiveRate: breakdown.base + breakdown.store + breakdown.paymentMethod > 0
          ? Math.round((estimatedReward / parsedAmount) * 10000) / 100
          : 0,
      },
    }

    dispatch({ type: 'UPDATE_EXPENSE', tripId: activeTrip.id, expense: updated })
    setEditingId(null)
  }

  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8"
        style={{ minHeight: 'calc(100dvh - 80px)', paddingBottom: '15vh' }}>
        <svg className="mb-4 opacity-40" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--color-secondary)' }} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="12" y2="17"/>
        </svg>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          尚無進行中的旅程。<br />請至「旅程」頁面建立新旅程。
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-base)' }}>刷卡金</h1>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>本次旅程 {activeTrip.expenses.length} 筆</span>
      </div>

      {/* ── Card filter tabs ── */}
      {(() => {
        const seen = new Set<string>()
        const filterCardOptions: { cardId: string; name: string }[] = []
        for (const e of expenses) {
          if (!seen.has(e.cardId)) {
            const c = data.cards.find(c => c.id === e.cardId)
            if (c) {
              filterCardOptions.push({ cardId: e.cardId, name: c.name })
              seen.add(e.cardId)
            }
          }
        }
        if (filterCardOptions.length < 2) return null
        return (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => setFilterCardId('all')}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs border transition-all whitespace-nowrap"
              style={filterCardId === 'all'
                ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)', fontWeight: 600 }
                : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
            >
              全部
            </button>
            {filterCardOptions.map(({ cardId, name }) => (
              <button
                key={cardId}
                type="button"
                onClick={() => setFilterCardId(cardId)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs border transition-all whitespace-nowrap"
                style={filterCardId === cardId
                  ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)', fontWeight: 600 }
                  : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
              >
                {name}
              </button>
            ))}
          </div>
        )
      })()}

      {/* ── Date chip strip ── */}
      {sortedDays.length > 0 && (
        <div className="overflow-x-auto flex gap-2 pb-2 mb-4 -mx-1 px-1">
          {[...sortedDays].reverse().map(date => {
            const isSelected = date === effectiveDay
            const d = new Date(date + 'T00:00:00')
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
                <span className="text-sm font-semibold leading-none">{d.getDate()}</span>
                <span className="text-[10px] mt-0.5 leading-none">{d.toLocaleDateString('zh-TW', { weekday: 'short' })}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Bonus status panel ── */}
      {(() => {
        const currentMonth = new Date().toISOString().slice(0, 7)
        type BonusRow = { cardName: string; label: string; key: string; used: number; cap: number; periodLabel: string }
        const rows: BonusRow[] = []

        for (const card of data.cards) {
          if (filterCardId !== 'all' && card.id !== filterCardId) continue
          for (const b of card.storeBonus) {
            if (b.cap <= 0) continue
            if (b.prerequisite !== undefined && b.prerequisiteMet !== true) continue
            const matchesBonus = (e: typeof allExpenses[0]) =>
              b.stores.includes(e.store ?? '') ||
              (b.subCategories ?? []).some(sc => sc.stores.includes(e.store ?? '')) ||
              b.storeName === e.store
            const rewardUsed = b.capPeriod === 'period'
              ? allExpenses.filter(e => {
                  if (e.cardId !== card.id) return false
                  if (!matchesBonus(e)) return false
                  if (card.validFrom && e.date < card.validFrom) return false
                  if (card.validTo && e.date > card.validTo) return false
                  return true
                }).reduce((sum, e) => sum + (e.rewardBreakdown?.store ?? 0), 0)
              : allExpenses.filter(e =>
                  e.cardId === card.id && e.date.startsWith(currentMonth) && matchesBonus(e)
                ).reduce((sum, e) => sum + (e.rewardBreakdown?.store ?? 0), 0)
            rows.push({
              cardName: card.name,
              label: b.storeName,
              key: `${card.id}:store:${b.storeName}`,
              used: rewardUsed,
              cap: b.cap,
              periodLabel: b.capPeriod === 'period' ? '活動期間' : '本月',
            })
          }

          if (card.paymentMethodBonus) {
            const activePmTierCount = card.paymentMethodBonus.tiers.filter(
              t => t.monthlyCap > 0 && (t.prerequisite === undefined || t.prerequisiteMet === true)
            ).length
            let pmSeq = 0
            for (const [tierIdx, tier] of card.paymentMethodBonus.tiers.entries()) {
              if (tier.monthlyCap <= 0) continue
              if (tier.prerequisite !== undefined && tier.prerequisiteMet !== true) continue
              pmSeq++
              const tierLabel = activePmTierCount > 1 ? `行動支付加碼 #${pmSeq}` : '行動支付加碼'
              const monthlyPmReward = allExpenses
                .filter(e => e.cardId === card.id && e.date.startsWith(currentMonth))
                .reduce((sum, e) => sum + (e.paymentMethodReward ?? 0), 0)
              let remaining = monthlyPmReward
              let tierUsed = 0
              for (let i = 0; i <= tierIdx; i++) {
                const t = card.paymentMethodBonus!.tiers[i]
                if (t.prerequisite !== undefined && t.prerequisiteMet !== true) continue
                if (t.monthlyCap === 0) continue
                const consumed = Math.min(remaining, t.monthlyCap)
                remaining -= consumed
                if (i === tierIdx) tierUsed = consumed
              }
              rows.push({
                cardName: card.name,
                label: tierLabel,
                key: `${card.id}:pm:${tierIdx}`,
                used: tierUsed,
                cap: tier.monthlyCap,
                periodLabel: '本月',
              })
            }
          }
        }

        if (rows.length === 0) return null
        return (
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2 pl-3 uppercase tracking-widest" style={{ color: 'var(--color-secondary)', borderLeft: '3px solid var(--color-secondary)' }}>加碼額度狀態</h2>
            <div className="space-y-2">
              {rows.map(({ cardName, label, key, used, cap, periodLabel }) => {
                const pct = Math.min(100, Math.round(used / cap * 100))
                const remaining = Math.max(0, cap - used)
                return (
                  <div key={key}
                    className="glass-card rounded-xl p-3"
                    style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-base)' }}>{cardName}</span>
                        <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>· {label}</span>
                      </div>
                      <span className="text-xs" style={{ color: remaining === 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                        NT${used.toLocaleString()} / NT${cap.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden h-1.5" style={{ background: 'var(--color-border)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--color-danger)' : 'var(--color-secondary)' }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {periodLabel}剩餘 NT${remaining.toLocaleString()}
                      {remaining === 0 && ' · 已達上限'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Expense list ── */}
      <h2 className="text-sm font-semibold mb-2 pl-3 uppercase tracking-widest" style={{ color: 'var(--color-secondary)', borderLeft: '3px solid var(--color-secondary)' }}>本次旅程消費記錄</h2>
      {expenses.length === 0 ? (
        <p className="text-[#9a7040] text-sm text-center py-4">尚無消費記錄</p>
      ) : (
        <>
          <div className="space-y-2">
          {(filterCardId === 'all' ? (byDay[effectiveDay] ?? []) : (byDay[effectiveDay] ?? []).filter(e => e.cardId === filterCardId)).map(e => {
            const card = data.cards.find(c => c.id === e.cardId)
            const isEditing = editingId === e.id

            if (isEditing) {
              // 7.2 Inline edit mode
              return (
                <div key={e.id}
                  className="glass-card rounded-xl p-3"
                  style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-secondary)' }}>
                  <p className="text-xs text-[#9a7040] mb-2">{e.store ?? '一般消費'} · 編輯模式</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-[#9a7040] block mb-0.5">金額（NT$）</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={editAmount}
                        onChange={ev => setEditAmount(ev.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none"
                        style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-base)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#9a7040] block mb-0.5">日期</label>
                      <DatePicker
                        value={editDate}
                        min={activeTrip.startDate}
                        max={activeTrip.endDate ?? new Date().toISOString().slice(0, 10)}
                        onChange={setEditDate}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#9a7040] block mb-0.5">信用卡</label>
                      <select
                        value={editCardId}
                        onChange={ev => setEditCardId(ev.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none"
                        style={{ background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-base)' }}
                      >
                        {data.cards.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(e)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold border"
                        style={{ background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)' }}
                      >
                        儲存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 py-1.5 rounded-lg text-xs border"
                        style={{ background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={e.id}
                className="glass-card rounded-xl p-3 flex items-center justify-between"
                style={{ cursor: 'pointer' }}
                onClick={() => startEdit(e)}
              >
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.date} · {e.store ?? '一般消費'}</p>
                  <p className="font-medium" style={{ color: 'var(--color-text-base)' }}>
                    {e.foreignAmount
                      ? `¥${e.foreignAmount.amount.toLocaleString()} (NT$${e.amount.toLocaleString()})`
                      : `NT$${e.amount.toLocaleString()}`}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded border"
                      style={card
                        ? { borderColor: 'var(--color-secondary)', color: 'var(--color-text-muted)', background: 'transparent' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'transparent' }}>
                      {card?.name ?? '已刪除的卡片'}
                    </span>
                    {e.paymentMethod && e.paymentMethod !== 'physical' && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(74,174,226,0.15)', color: '#4aade2', border: '1px solid rgba(74,174,226,0.3)' }}>
                        {e.paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                      </span>
                    )}
                    {e.rewardBreakdown && (
                      <span className="px-1.5 py-0.5 rounded text-[10px]"
                        style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--color-secondary)', border: '1px solid rgba(245,166,35,0.25)' }}>
                        {e.rewardBreakdown.effectiveRate}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-success)' }}>回饋 NT${e.estimatedReward.toLocaleString()}</p>
                  {e.rewardBreakdown && (e.rewardBreakdown.store > 0 || e.rewardBreakdown.paymentMethod > 0) && (
                    <>
                      <div className="mt-1 mb-0.5" style={{ height: 1, background: 'var(--color-border)' }} />
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {[
                          `基本 NT$${e.rewardBreakdown.base.toLocaleString()}`,
                          e.rewardBreakdown.store > 0 ? `${e.store ?? '店家'}加碼 NT$${e.rewardBreakdown.store.toLocaleString()}` : null,
                          e.rewardBreakdown.paymentMethod > 0 ? `行動支付加碼 NT$${e.rewardBreakdown.paymentMethod.toLocaleString()}` : null,
                        ].filter(Boolean).join(' | ')}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={ev => { ev.stopPropagation(); handleDelete(e.id) }}
                  className="text-xs px-3 py-1.5 rounded border transition-colors shrink-0"
                  style={{ color: 'var(--color-danger)', borderColor: 'rgba(248,113,113,0.3)' }}
                  aria-label="刪除"
                >
                  刪除
                </button>
              </div>
            )
          })}
          </div>
        </>
      )}
    </div>
  )
}
