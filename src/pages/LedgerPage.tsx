import { useStore } from '../store/useStore'

export default function LedgerPage() {
  const { data, dispatch } = useStore()
  const activeTrip = data.trips.find(t => t.id === data.activeTripId) ?? null

  const expenses = activeTrip ? [...activeTrip.expenses].reverse() : []
  const allExpenses = data.trips.flatMap(t => t.expenses)

  function handleDelete(expenseId: string) {
    if (!activeTrip) return
    dispatch({ type: 'DELETE_EXPENSE', tripId: activeTrip.id, expenseId })
  }

  if (!activeTrip) {
    return (
      <div className="p-4 text-center py-14">
        <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="12" y2="17"/>
        </svg>
        <p className="text-sm text-[#9a7040]">尚無進行中的旅程。請至「旅程」頁面建立新旅程。</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header — 明細 + expense count */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#f2e8c9]">明細</h1>
        <span className="text-sm text-[#c8a060]">本次旅程 {activeTrip.expenses.length} 筆</span>
      </div>

      {/* ── Expense list ── */}
      <h2 className="text-sm font-semibold text-[#d4a017] mb-2 pl-3 uppercase tracking-widest" style={{ borderLeft: '3px solid #c8901a' }}>本次旅程消費記錄</h2>
      {expenses.length === 0 ? (
        <p className="text-[#9a7040] text-sm text-center py-4">尚無消費記錄</p>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => {
            const card = data.cards.find(c => c.id === e.cardId)
            return (
              <div key={e.id}
                className="beast-card rounded-xl p-3 flex items-center justify-between"
                style={{ background: '#1a1208', border: '1px solid #3d2e14' }}>
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs text-[#9a7040]">{e.date} · {e.store ?? '一般消費'}</p>
                  <p className="font-medium text-[#f2e8c9]">
                    {e.foreignAmount
                      ? `¥${e.foreignAmount.amount.toLocaleString()} (NT$${e.amount.toLocaleString()})`
                      : `NT$${e.amount.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-[#c8a060]">
                    {card?.name ?? e.cardId}
                    {e.rewardBreakdown && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                        style={{ background: 'rgba(212,160,23,0.12)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.2)' }}>
                        {e.rewardBreakdown.effectiveRate}%
                      </span>
                    )}
                  </p>
                  {e.rewardBreakdown && (e.rewardBreakdown.store > 0 || e.rewardBreakdown.paymentMethod > 0) ? (
                    <p className="text-xs mt-0.5" style={{ color: '#4ade80' }}>
                      回饋 NT${e.estimatedReward.toLocaleString()} = 基本 NT${e.rewardBreakdown.base.toLocaleString()}
                      {e.rewardBreakdown.store > 0 && ` + ${e.store ?? ''}加碼 NT$${e.rewardBreakdown.store.toLocaleString()}`}
                      {e.rewardBreakdown.paymentMethod > 0 && ` + 行動支付加碼 NT$${e.rewardBreakdown.paymentMethod.toLocaleString()}`}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5" style={{ color: '#4ade80' }}>回饋 NT${e.estimatedReward.toLocaleString()}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-xs px-3 py-1.5 rounded border transition-colors shrink-0"
                  style={{ color: '#c0392b', borderColor: '#3a1010' }}
                  aria-label="刪除"
                >
                  刪除
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Bonus status panel ── */}
      {(() => {
        const today = new Date().toISOString().slice(0, 7)
        const bonusRows = data.cards.flatMap(card =>
          card.storeBonus
            .filter(b => b.cap > 0)
            .map(b => {
              const used = b.capPeriod === 'period'
                ? allExpenses.filter(e => {
                    if (e.cardId !== card.id) return false
                    const matchedBonus = card.storeBonus.find(sb =>
                      sb === b && (
                        sb.stores.includes(e.store ?? '') ||
                        (sb.subCategories ?? []).some(sc => sc.stores.includes(e.store ?? '')) ||
                        sb.storeName === e.store
                      )
                    )
                    if (!matchedBonus) return false
                    if (card.validFrom && e.date < card.validFrom) return false
                    if (card.validTo && e.date > card.validTo) return false
                    return true
                  }).reduce((sum, e) => sum + e.amount, 0)
                : allExpenses.filter(e =>
                    e.cardId === card.id &&
                    e.date.startsWith(today) &&
                    (b.stores.includes(e.store ?? '') ||
                     (b.subCategories ?? []).some(sc => sc.stores.includes(e.store ?? '')) ||
                     b.storeName === e.store)
                  ).reduce((sum, e) => sum + e.amount, 0)
              const pct = Math.min(100, Math.round(used / b.cap * 100))
              const remaining = Math.max(0, b.cap - used)
              return { card, bonus: b, used, remaining, pct }
            })
        )
        if (bonusRows.length === 0) return null
        return (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-[#d4a017] mb-2 pl-3 uppercase tracking-widest" style={{ borderLeft: '3px solid #c8901a' }}>加碼額度狀態</h2>
            <div className="space-y-2">
              {bonusRows.map(({ card, bonus, used, remaining, pct }) => (
                <div key={`${card.id}:${bonus.storeName}`}
                  className="beast-card rounded-xl p-3"
                  style={{ background: '#1a1208', border: '1px solid #3d2e14' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-medium text-[#f2e8c9]">{card.name}</span>
                      <span className="text-xs text-[#9a7040] ml-1">· {bonus.storeName}加碼</span>
                    </div>
                    <span className="text-xs" style={{ color: remaining === 0 ? '#c0392b' : '#c8a060' }}>
                      NT${used.toLocaleString()} / NT${bonus.cap.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-full overflow-hidden h-1.5" style={{ background: '#2e2210' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 100 ? '#c0392b' : 'linear-gradient(90deg, #c8901a, #d4a017)' }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: '#9a7040' }}>
                    {bonus.capPeriod === 'period' ? '活動期間' : '本月'}剩餘 NT${remaining.toLocaleString()}
                    {remaining === 0 && ' · 已達上限'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
