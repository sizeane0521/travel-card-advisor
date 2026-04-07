import { useState } from 'react'
import { useStore } from '../store/useStore'
import { getAllStoreNames, getSortedRecommendations, calcExpenseReward, calcPaymentMethodBonus } from '../lib/rewardCalc'
import type { CardAdvice } from '../lib/rewardCalc'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function genId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// Estimate reward for a card from its advice + current twd amount
function estimateReward(
  advice: CardAdvice,
  twdAmount: number,
  paymentMethod: 'apple_pay' | 'google_pay' | 'physical',
  tripExpenses: import('../types').Expense[]
): number {
  if (advice.isFull || twdAmount <= 0) return 0
  const pmBonus = calcPaymentMethodBonus(advice.card, paymentMethod, twdAmount, tripExpenses)
  const baseRate = advice.effectiveRate - pmBonus.bonusRate
  const baseReward = Math.floor(twdAmount * baseRate / 100)
  const cappedBase = advice.card.monthlyCap.rewardLimit !== undefined
    ? Math.min(baseReward, advice.remainingAmount)
    : baseReward
  return cappedBase + pmBonus.bonusReward
}

const STORE_CHIP_LIMIT = 5

export default function ExpensePage() {
  const { data, dispatch } = useStore()
  const activeTrip = data.trips.find(t => t.id === data.activeTripId) ?? null

  const [amount, setAmount] = useState('')
  const [store, setStore] = useState<string>('')
  // task 1.1: selectedCardId replaces cardId
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [showAllStores, setShowAllStores] = useState(false)
  const [storeQuery, setStoreQuery] = useState('')
  const [amountError, setAmountError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'google_pay' | 'physical'>('physical')

  const storeNames = getAllStoreNames(data.cards)
  const expenses = activeTrip ? [...activeTrip.expenses].reverse() : []
  const tripExpenses = activeTrip?.expenses ?? []

  // Exchange rate derived values
  const exchangeRate = activeTrip?.exchangeRate
  const parsedAmount = parseInt(amount, 10)
  const validAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const twdAmount = validAmount
    ? (exchangeRate ? Math.floor(parsedAmount * exchangeRate.rate) : parsedAmount)
    : 0

  // task 1.1 + 1.2: recommendations re-computed on every render (store, amount, or paymentMethod change drives it)
  // effectiveSelectedCardId: keep user selection unless it's gone or full
  const recommendations = data.cards.length > 0
    ? getSortedRecommendations(data.cards, store || null, tripExpenses, paymentMethod)
    : []

  const bestCardId = recommendations.find(a => !a.isFull)?.card.id ?? ''
  const effectiveSelectedCardId = (() => {
    if (!selectedCardId) return bestCardId
    const sel = recommendations.find(a => a.card.id === selectedCardId)
    // task 1.2: if selected card is now full, fall back to best
    if (!sel || sel.isFull) return bestCardId
    return selectedCardId
  })()

  // Store chip visibility: filter by query when searching, else show paginated default
  const isSearching = storeQuery.length > 0
  const filteredStores = isSearching
    ? storeNames.filter(n => n.toLowerCase().includes(storeQuery.toLowerCase()))
    : (showAllStores ? storeNames : storeNames.slice(0, STORE_CHIP_LIMIT))
  const hasMoreStores = !isSearching && storeNames.length > STORE_CHIP_LIMIT

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(amount, 10)
    if (!parsed || parsed <= 0) {
      setAmountError('請輸入正整數金額')
      return
    }
    if (!effectiveSelectedCardId) return
    if (!activeTrip || activeTrip.endDate) return

    setAmountError('')
    const selectedCard = data.cards.find(c => c.id === effectiveSelectedCardId)!
    const storeName = store || null

    const twd = exchangeRate ? Math.floor(parsed * exchangeRate.rate) : parsed
    const foreignAmount = exchangeRate
      ? { currency: exchangeRate.currency, amount: parsed }
      : undefined

    // task 6.1: use effectiveSelectedCardId, not cardId
    const { estimatedReward, paymentMethodReward } = calcExpenseReward(
      selectedCard, twd, storeName, activeTrip.expenses, paymentMethod
    )

    dispatch({
      type: 'ADD_EXPENSE',
      tripId: activeTrip.id,
      expense: {
        id: genId(),
        amount: twd,
        cardId: effectiveSelectedCardId,
        store: storeName,
        date: todayStr(),
        estimatedReward,
        paymentMethod,
        paymentMethodReward,
        ...(foreignAmount ? { foreignAmount } : {}),
      },
    })

    // task 6.1: reset amount and store, keep selectedCardId (re-ranks on next render)
    setAmount('')
    setStore('')
    setStoreQuery('')
  }

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

  if (activeTrip.endDate) {
    return (
      <div className="p-4 text-center py-14">
        <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p className="text-sm text-[#9a7040]">此旅程已結束，無法新增消費。請建立新旅程。</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* task 5.1: header with trip expense count summary */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#f2e8c9]">記帳</h1>
        <span className="text-sm text-[#c8a060]">本次旅程 {activeTrip.expenses.length} 筆</span>
      </div>

      {/* ── Log expense form ── */}
      <form onSubmit={handleSubmit}
        className="beast-card rounded-xl p-4 mb-4 space-y-4"
        style={{ background: '#1a1208', border: '1px solid #3a2810' }}>

        {/* Amount input + JPY preview */}
        <div>
          <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">
            {exchangeRate ? `金額（${exchangeRate.currency}）` : '金額（NT$）'}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => { setAmount(e.target.value); setAmountError('') }}
            placeholder={exchangeRate ? '例：1500（日幣）' : '例：1200'}
            className="w-full border rounded-lg px-3 py-2.5 text-lg focus:outline-none"
          />
          {/* task 4.1: real-time JPY→TWD conversion preview */}
          {exchangeRate && validAmount && (
            <p className="text-sm mt-1" style={{ color: '#c8a060' }}>
              ≈ NT${twdAmount.toLocaleString()}
            </p>
          )}
          {amountError && <p className="text-xs mt-1" style={{ color: '#c0392b' }}>{amountError}</p>}
        </div>

        {/* store search + chips */}
        <div>
          <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">店家</label>

          {/* Search input */}
          <div className="relative mb-2">
            <input
              type="text"
              value={storeQuery}
              onChange={e => {
                const q = e.target.value
                setStoreQuery(q)
                setStore(q)
              }}
              placeholder="搜尋店家…"
              className="w-full border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none"
            />
            {storeQuery && (
              <button
                type="button"
                onClick={() => { setStoreQuery(''); setStore('') }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1"
                style={{ color: '#9a7040' }}
                aria-label="清除"
              >
                ×
              </button>
            )}
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {/* 一般消費：always visible */}
            <button
              type="button"
              onClick={() => { setStore(''); setStoreQuery('') }}
              className="px-3 py-1.5 rounded-lg text-sm border transition-all"
              style={store === '' && storeQuery === ''
                ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                : { background: 'transparent', color: '#c8a060', borderColor: '#4a3418' }}
            >
              一般消費
            </button>

            {filteredStores.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { setStore(n); setStoreQuery(n) }}
                className="px-3 py-1.5 rounded-lg text-sm border transition-all"
                style={store === n && storeQuery === n
                  ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                  : { background: 'transparent', color: '#c8a060', borderColor: '#4a3418' }}
              >
                {n}
              </button>
            ))}

            {/* expand/collapse: only when not searching */}
            {hasMoreStores && (
              <button
                type="button"
                onClick={() => setShowAllStores(v => !v)}
                className="px-3 py-1.5 rounded-lg text-sm border transition-all"
                style={{ background: 'transparent', color: '#9a7040', borderColor: '#3d2e14', borderStyle: 'dashed' }}
              >
                {showAllStores ? '收起 ▲' : '更多 ▼'}
              </button>
            )}
          </div>
        </div>

        {/* Payment method selector */}
        <div>
          <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">付款方式</label>
          <div className="flex gap-2">
            {([
              { value: 'physical', label: '實體卡' },
              { value: 'apple_pay', label: 'Apple Pay' },
              { value: 'google_pay', label: 'Google Pay' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                style={paymentMethod === value
                  ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                  : { background: 'transparent', color: '#c8a060', borderColor: '#4a3418' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* task 2.1–2.4: inline card recommendation list */}
        {data.cards.length > 0 && (
          <div>
            <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">選擇信用卡（依回饋排序）</label>
            <div className="space-y-2">
              {recommendations.map((advice, idx) => {
                const isSelected = advice.card.id === effectiveSelectedCardId
                const isTop = idx === 0 && !advice.isFull
                const estimated = estimateReward(advice, twdAmount, paymentMethod, tripExpenses)

                // task 2.2: progress bar data
                const cap = advice.card.monthlyCap.rewardLimit ?? advice.card.monthlyCap.spendLimit
                const showBar = isTop && cap !== undefined && cap > 0
                const barPct = showBar
                  ? Math.min(100, Math.round((cap - advice.remainingAmount) / cap * 100))
                  : 0

                return (
                  <div
                    key={advice.card.id}
                    onClick={() => !advice.isFull && setSelectedCardId(advice.card.id)}
                    className="rounded-xl p-3 transition-all"
                    style={{
                      cursor: advice.isFull ? 'default' : 'pointer',
                      background: isTop && isSelected ? '#2a1f0a' : isSelected ? '#1e1608' : '#141008',
                      border: isTop && isSelected
                        ? '2px solid #ffcc00' // 更顯眼的主推薦卡片邊框
                        : isSelected
                          ? '1px solid #c8901a'
                          : '1px solid #3d2e14',
                      boxShadow: isSelected ? '0 0 12px rgba(255,204,0,0.25)' : 'none', // 更顯眼的光暈
                      opacity: advice.isFull ? 0.45 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isTop && (
                          <span className="text-xs px-2 py-1 rounded-lg font-bold tracking-wide"
                            style={{ background: 'linear-gradient(90deg, #ffcc00, #ffea00)', color: '#1a1208', border: '1px solid #ffcc00' }}>
                            🌟 最佳推薦
                          </span>
                        )}
                        <span className="text-sm font-medium text-[#f2e8c9]">{advice.card.name}</span>
                        {advice.paymentMethodBadge && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ background: 'rgba(74,174,226,0.15)', color: '#4aade2', border: '1px solid rgba(74,174,226,0.3)' }}>
                            {advice.paymentMethodBadge === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                          </span>
                        )}
                        {advice.isFull && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(139,26,26,0.3)', color: '#c0392b', border: '1px solid #5a1a1a' }}>
                            本月已滿
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        {advice.isFull ? (
                          <span className="text-sm" style={{ color: '#c0392b' }}>0%</span>
                        ) : (
                          <div>
                            <span className="text-lg font-bold" style={{ color: '#d4a017' }}>{advice.effectiveRate}%</span>
                            {twdAmount > 0 && (
                              <p className="text-xs" style={{ color: '#4ade80' }}>
                                回饋 NT${estimated.toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* task 2.2: progress bar for top card with cap */}
                    {showBar && (
                      <div className="mt-2">
                        <div className="rounded-full overflow-hidden h-1.5" style={{ background: '#2e2210' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${barPct}%`, background: 'linear-gradient(90deg, #c8901a, #d4a017)' }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#c8a060' }}>
                          {advice.remainingCapDisplay}
                        </p>
                      </div>
                    )}

                    {/* task 2.3: no-cap card shows only rate (handled above — no bar rendered) */}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!effectiveSelectedCardId}
          className="w-full rounded-lg py-3 font-semibold text-sm tracking-wider transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}
        >
          ◆ 記錄消費
        </button>
      </form>

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
                <div>
                  <p className="text-xs text-[#9a7040]">{e.date} · {e.store ?? '一般消費'}</p>
                  <p className="font-medium text-[#f2e8c9]">
                    {e.foreignAmount
                      ? `¥${e.foreignAmount.amount.toLocaleString()} (NT$${e.amount.toLocaleString()})`
                      : `NT$${e.amount.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-[#c8a060]">{card?.name ?? e.cardId} · 回饋 <span style={{ color: '#4ade80' }}>NT${e.estimatedReward.toLocaleString()}</span></p>
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-xs px-3 py-1.5 rounded border transition-colors"
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
    </div>
  )
}
