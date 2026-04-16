import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { getAllStoreNames, getSortedRecommendations, calcExpenseReward } from '../lib/rewardCalc'
import type { RewardBreakdown } from '../lib/rewardCalc'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function genId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatBreakdown(total: number, bd: RewardBreakdown, storeBonusLabel: string): string {
  const parts: string[] = []
  if (bd.base > 0) parts.push(`基本 NT$${bd.base.toLocaleString()}`)
  if (bd.store > 0) parts.push(`${storeBonusLabel}加碼 NT$${bd.store.toLocaleString()}`)
  if (bd.paymentMethod > 0) parts.push(`行動支付加碼 NT$${bd.paymentMethod.toLocaleString()}`)
  if (parts.length <= 1) return `NT$${total.toLocaleString()}`
  return `NT$${total.toLocaleString()} = ${parts.join(' + ')}`
}

function getDraftKey(tripId: string | null): string {
  return `calc-draft-${tripId ?? 'none'}`
}

interface Draft {
  amount: string
  store: string
  paymentMethod: 'apple_pay' | 'google_pay' | 'physical'
}

function loadDraft(tripId: string | null): Draft | null {
  try {
    const raw = sessionStorage.getItem(getDraftKey(tripId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(tripId: string | null, draft: Draft) {
  try {
    sessionStorage.setItem(getDraftKey(tripId), JSON.stringify(draft))
  } catch {}
}

function clearDraft(tripId: string | null) {
  try {
    sessionStorage.removeItem(getDraftKey(tripId))
  } catch {}
}

export default function CalcPage() {
  const { data, dispatch } = useStore()
  const activeTrip = data.trips.find(t => t.id === data.activeTripId) ?? null

  // Initialise from sessionStorage draft for current trip
  const initialDraft = loadDraft(data.activeTripId)
  const [amount, setAmount] = useState(initialDraft?.amount ?? '')
  const [store, setStore] = useState<string>(initialDraft?.store ?? '')
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'google_pay' | 'physical'>(initialDraft?.paymentMethod ?? 'apple_pay')

  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [storeQuery, setStoreQuery] = useState(initialDraft?.store ?? '')
  const [amountError, setAmountError] = useState('')
  const [prereqOverrides, setPrereqOverrides] = useState<Record<string, Record<number, boolean>>>({})
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [lastRecordResult, setLastRecordResult] = useState<{ text: string } | null>(null)
  const [storeBonusOverrides, setStoreBonusOverrides] = useState<Record<string, Record<number, boolean>>>({})
  const [expenseDate, setExpenseDate] = useState(todayStr())
  const [customRate, setCustomRate] = useState('')

  // 2.1 Snap expenseDate when active trip changes
  useEffect(() => {
    if (!activeTrip) return
    const today = todayStr()
    const maxDate = activeTrip.endDate ?? today
    if (expenseDate < activeTrip.startDate) {
      setExpenseDate(activeTrip.startDate)
    } else if (expenseDate > maxDate) {
      setExpenseDate(maxDate)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip?.id])

  // 4.1/4.3 Persist draft to sessionStorage; reload when trip changes
  useEffect(() => {
    const draft = loadDraft(data.activeTripId)
    setAmount(draft?.amount ?? '')
    setStore(draft?.store ?? '')
    setStoreQuery(draft?.store ?? '')
    setPaymentMethod(draft?.paymentMethod ?? 'apple_pay')
  }, [data.activeTripId])

  useEffect(() => {
    saveDraft(data.activeTripId, { amount, store, paymentMethod })
  }, [amount, store, paymentMethod, data.activeTripId])

  useEffect(() => {
    if (!lastRecordResult) return
    const timer = setTimeout(() => setLastRecordResult(null), 3000)
    return () => clearTimeout(timer)
  }, [lastRecordResult])

  const storeNames = getAllStoreNames(data.cards)
  const tripExpenses = activeTrip?.expenses ?? []
  const allExpenses = data.trips.flatMap(t => t.expenses)

  const exchangeRate = activeTrip?.exchangeRate
  const effectiveRate = (() => {
    const parsed = parseFloat(customRate)
    return !isNaN(parsed) && parsed > 0 ? parsed : exchangeRate?.rate
  })()
  const parsedAmount = parseInt(amount, 10)
  const validAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const twdAmount = validAmount
    ? (effectiveRate ? Math.floor(parsedAmount * effectiveRate) : parsedAmount)
    : 0

  // 5.1 Frequent stores from current trip
  const frequentStores = (() => {
    const counts: Record<string, number> = {}
    for (const e of tripExpenses) {
      if (e.store) counts[e.store] = (counts[e.store] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s]) => s)
  })()

  // Apply store bonus prerequisite overrides to card copies
  const cardsWithOverrides = data.cards.map(card => {
    const overrides = storeBonusOverrides[card.id]
    if (!overrides) return card
    return {
      ...card,
      storeBonus: card.storeBonus.map((b, i) =>
        i in overrides ? { ...b, prerequisiteMet: overrides[i] } : b
      ),
    }
  })

  const recommendations = cardsWithOverrides.length > 0
    ? getSortedRecommendations(cardsWithOverrides, store || null, tripExpenses, paymentMethod, undefined, prereqOverrides, allExpenses)
    : []

  // When validAmount is true, re-sort by actual estimated reward (accounts for caps)
  const sortedRecommendations = (() => {
    if (!validAmount) return recommendations
    const withReward = recommendations.map(advice => ({
      advice,
      reward: advice.isFull ? -1 : calcExpenseReward(
        advice.card, twdAmount, store || null, tripExpenses, paymentMethod, undefined, prereqOverrides[advice.card.id], allExpenses
      ).estimatedReward,
    }))
    withReward.sort((a, b) => b.reward - a.reward)
    return withReward.map(x => x.advice)
  })()

  const bestCardId = sortedRecommendations.find(a => !a.isFull)?.card.id ?? ''
  const effectiveSelectedCardId = (() => {
    if (!selectedCardId) return bestCardId
    const sel = sortedRecommendations.find(a => a.card.id === selectedCardId)
    if (!sel || sel.isFull) return bestCardId
    return selectedCardId
  })()

  const filteredStores = storeQuery.length > 0
    ? storeNames.filter(n => n.toLowerCase().includes(storeQuery.toLowerCase()))
    : []

  function resetOverrides() {
    setStoreBonusOverrides({})
    setPrereqOverrides({})
  }

  function selectStore(name: string) {
    setStore(name)
    setStoreQuery(name)
    resetOverrides()
  }

  function clearStore() {
    setStore('')
    setStoreQuery('')
    resetOverrides()
  }

  function handleRecordWithCard(cardId: string) {
    const parsed = parseInt(amount, 10)
    if (!parsed || parsed <= 0) {
      setAmountError('請輸入正整數金額')
      return
    }
    if (!activeTrip || (activeTrip.endDate && activeTrip.endDate <= todayStr())) return

    setAmountError('')
    const selectedCard = cardsWithOverrides.find(c => c.id === cardId)!
    const storeName = store || null

    const twd = effectiveRate ? Math.floor(parsed * effectiveRate) : parsed
    const foreignAmount = exchangeRate
      ? { currency: exchangeRate.currency, amount: parsed }
      : undefined

    const selectedAdvice = sortedRecommendations.find(a => a.card.id === cardId)
    const { estimatedReward, paymentMethodReward, breakdown } = calcExpenseReward(
      selectedCard, twd, storeName, activeTrip.expenses, paymentMethod, undefined, prereqOverrides[cardId], allExpenses
    )

    // 6.3 Store customRate if overridden
    const parsedCustomRate = parseFloat(customRate)
    const customRateValue = !isNaN(parsedCustomRate) && parsedCustomRate > 0 && exchangeRate ? parsedCustomRate : undefined

    dispatch({
      type: 'ADD_EXPENSE',
      tripId: activeTrip.id,
      expense: {
        id: genId(),
        amount: twd,
        cardId,
        store: storeName,
        date: expenseDate,
        estimatedReward,
        paymentMethod,
        paymentMethodReward,
        rewardBreakdown: {
          base: breakdown.base,
          store: breakdown.store,
          paymentMethod: breakdown.paymentMethod,
          effectiveRate: selectedAdvice?.effectiveRate ?? 0,
        },
        ...(foreignAmount ? { foreignAmount } : {}),
        ...(customRateValue !== undefined ? { customRate: customRateValue } : {}),
      },
    })

    const storeBonusLabel = store || '店家'
    const toastText = `已記帳！回饋 ${formatBreakdown(estimatedReward, breakdown, storeBonusLabel)}`
    setLastRecordResult({ text: toastText })

    // 4.4 Clear draft after successful record
    setAmount('')
    setStore('')
    setStoreQuery('')
    setCustomRate('')
    setExpenseDate(todayStr())
    clearDraft(data.activeTripId)
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

  if (activeTrip.endDate && activeTrip.endDate <= todayStr()) {
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
      {/* Toast notification */}
      {lastRecordResult && (
        <div className="mb-3 rounded-xl px-4 py-3 text-sm font-medium animate-pulse"
          style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
          {lastRecordResult.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#f2e8c9]">試算</h1>
      </div>

      {/* ── Calc form ── */}
      <div className="beast-card rounded-xl p-4 mb-4 space-y-4"
        style={{ background: '#1a1208', border: '1px solid #3a2810' }}>

        {/* Amount input + exchange rate */}
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
          {/* 6.1 Custom rate input when trip has exchangeRate */}
          {exchangeRate && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs" style={{ color: '#9a7040' }}>匯率</span>
              <input
                type="number"
                inputMode="decimal"
                value={customRate}
                onChange={e => setCustomRate(e.target.value)}
                placeholder={String(exchangeRate.rate)}
                className="w-24 border rounded px-2 py-1 text-xs focus:outline-none"
                style={{ background: '#141008', borderColor: '#4a3418', color: '#c8a060' }}
              />
              <span className="text-xs" style={{ color: '#9a7040' }}>
                （預設 {exchangeRate.rate}）
              </span>
            </div>
          )}
          {exchangeRate && validAmount && (
            <p className="text-2xl font-bold mt-1" style={{ color: '#f2e8c9' }}>
              ≈ NT${twdAmount.toLocaleString()}
            </p>
          )}
          {amountError && <p className="text-xs mt-1" style={{ color: '#c0392b' }}>{amountError}</p>}
        </div>

        {/* Expense date picker */}
        <div>
          <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">消費日期</label>
          <input
            type="date"
            value={expenseDate}
            min={activeTrip.startDate}
            max={activeTrip.endDate ?? todayStr()}
            onChange={e => setExpenseDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none"
          />
        </div>

      </div>

      {/* ── Store section ── */}
      <div className="beast-card rounded-xl p-4 mb-4"
        style={{ background: '#1a1208', border: '1px solid #3a2810' }}>
        <div>
          <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">店家</label>

          <div className="relative mb-2">
            <input
              type="text"
              value={storeQuery}
              onChange={e => {
                const q = e.target.value
                setStoreQuery(q)
                setStore(q)
                // 3.2 Note: overrides are NOT reset while typing
              }}
              placeholder="搜尋店家…"
              className="w-full border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none"
            />
            {storeQuery && (
              <button
                type="button"
                onClick={clearStore}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1"
                style={{ color: '#9a7040' }}
                aria-label="清除"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* 5.2 Frequent store chips when search is empty */}
            {storeQuery === '' && frequentStores.map(n => (
              <button
                key={`freq-${n}`}
                type="button"
                onClick={() => selectStore(n)}
                className="px-3 py-1.5 rounded-lg text-sm border transition-all"
                style={store === n
                  ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                  : { background: 'rgba(212,160,23,0.08)', color: '#c8a060', borderColor: '#4a3418' }}
              >
                {n}
              </button>
            ))}

            {/* Search result chips */}
            {filteredStores.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => selectStore(n)}
                className="px-3 py-1.5 rounded-lg text-sm border transition-all"
                style={store === n && storeQuery === n
                  ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                  : { background: 'transparent', color: '#c8a060', borderColor: '#4a3418' }}
              >
                {n}
              </button>
            ))}
            {/* Custom store confirmation chip */}
            {storeQuery.length > 0 && filteredStores.length === 0 && (
              <div
                className="px-3 py-1.5 rounded-lg text-sm border"
                style={{ background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }}
              >
                {storeQuery}
              </div>
            )}
          </div>

          {/* Category browser */}
          {(() => {
            const bonusesWithSubs = data.cards.flatMap(c =>
              c.storeBonus.filter(b => b.subCategories && b.subCategories.length > 0).map(b => ({ card: c, bonus: b }))
            )
            if (bonusesWithSubs.length === 0) return null
            return (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryBrowser(v => !v)}
                  className="text-xs underline"
                  style={{ color: '#9a7040' }}
                >
                  {showCategoryBrowser ? '收起分類' : '展開分類'}
                </button>
                {showCategoryBrowser && (
                  <div className="mt-2 space-y-3">
                    {bonusesWithSubs.map(({ card, bonus }) => {
                      const groupKey = `${card.id}:${bonus.storeName}`
                      const isExpanded = expandedGroups.has(groupKey)
                      return (
                        <div key={groupKey} className="rounded-lg p-2" style={{ background: '#141008', border: '1px solid #3d2e14' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedGroups(prev => {
                              const next = new Set(prev)
                              next.has(groupKey) ? next.delete(groupKey) : next.add(groupKey)
                              return next
                            })}
                            className="flex items-center gap-1 text-xs font-medium w-full text-left"
                            style={{ color: '#d4a017' }}
                          >
                            <span>{bonus.storeName}</span>
                            <span className="ml-auto" style={{ color: '#9a7040' }}>{isExpanded ? '▲' : '▶'}</span>
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {bonus.subCategories!.map(sub => (
                                <div key={sub.label}>
                                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#9a7040' }}>{sub.label}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {sub.stores.map(s => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => selectStore(s)}
                                        className="px-2.5 py-1 rounded-lg text-xs border transition-all"
                                        style={store === s
                                          ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                                          : { background: 'transparent', color: '#c8a060', borderColor: '#4a3418' }}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

      </div>

      {/* ── Payment method section ── */}
      <div className="beast-card rounded-xl p-4 mb-4"
        style={{ background: '#1a1208', border: '1px solid #3a2810' }}>
        <div>
          <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">付款方式</label>
          <div className="flex gap-2">
            {([
              { value: 'apple_pay', label: 'Apple Pay' },
              { value: 'google_pay', label: 'Google Pay' },
              { value: 'physical', label: '實體卡' },
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
      </div>

      {/* ── Card recommendation list ── */}
      {data.cards.length > 0 && (
        <div className="beast-card rounded-xl p-4 mb-4"
          style={{ background: '#1a1208', border: '1px solid #3a2810' }}>
          <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">選擇信用卡（依回饋排序）</label>
            <div className="space-y-2">
              {sortedRecommendations.map((advice, idx) => {
                const isSelected = advice.card.id === effectiveSelectedCardId
                const isTop = idx === 0 && !advice.isFull
                const rewardInfo = twdAmount > 0 && !advice.isFull
                  ? calcExpenseReward(advice.card, twdAmount, store || null, tripExpenses, paymentMethod, undefined, prereqOverrides[advice.card.id], allExpenses)
                  : null
                const estimated = rewardInfo?.estimatedReward ?? 0
                const breakdown = rewardInfo?.breakdown ?? null
                const storeBonusLabel = advice.storeBonusInfo?.bonus.storeName ?? store
                const opWarning = paymentMethod !== 'physical'
                  ? (advice.card.operationWarnings ?? []).find(w => w.paymentMethod === paymentMethod)?.message
                  : undefined

                const cap = advice.card.monthlyCap.rewardLimit ?? advice.card.monthlyCap.spendLimit
                const showBar = isTop && cap !== undefined && cap > 0
                const barPct = showBar
                  ? Math.min(100, Math.round((cap - advice.remainingAmount) / cap * 100))
                  : 0
                const detailParts: string[] = []
                if (!advice.isFull && twdAmount > 0 && breakdown) {
                  if (breakdown.base > 0) detailParts.push(`基本 ${breakdown.base.toLocaleString()}`)
                  if (breakdown.store > 0) detailParts.push(`${storeBonusLabel}加碼 ${breakdown.store.toLocaleString()}`)
                  if (breakdown.paymentMethod > 0) detailParts.push(breakdown.paymentMethodCapped ? `行動支付加碼 ${breakdown.paymentMethod.toLocaleString()}（已達上限）` : `行動支付加碼 ${breakdown.paymentMethod.toLocaleString()}`)
                }

                return (
                  <div
                    key={advice.card.id}
                    onClick={() => !advice.isFull && validAmount && setSelectedCardId(advice.card.id)}
                    className="rounded-xl overflow-hidden transition-all relative"
                    style={{
                      cursor: advice.isFull || !validAmount ? 'default' : 'pointer',
                      background: isTop && isSelected ? '#2a1f0a' : isSelected ? '#1e1608' : '#141008',
                      border: isTop && isSelected
                        ? '2px solid #ffcc00'
                        : isSelected
                          ? '1px solid #c8901a'
                          : '1px solid #3d2e14',
                      boxShadow: isSelected ? '0 0 12px rgba(255,204,0,0.25)' : 'none',
                      opacity: advice.isFull ? 0.45 : !validAmount ? 0.4 : 1,
                    }}
                  >
                    {/* 推薦 badge — absolute positioned top-left corner */}
                    {isTop && !advice.isFull && (
                      <div className="absolute top-0 left-0 px-1.5 py-0.5 rounded-br-lg text-[10px] font-bold"
                        style={{ background: '#c8901a', color: '#0d0a06' }}>
                        推薦
                      </div>
                    )}

                    {/* Main content */}
                    <div className="flex-1 min-w-0 p-3">
                      {/* Row 1: card name + badges + rate + button */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#f2e8c9] flex-1 min-w-0 truncate">{advice.card.name}</span>
                        {advice.paymentMethodBadge && paymentMethod !== 'physical' && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                            style={{ background: 'rgba(74,174,226,0.15)', color: '#4aade2', border: '1px solid rgba(74,174,226,0.3)' }}>
                            {advice.paymentMethodBadge === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                          </span>
                        )}
                        {advice.isFull && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: 'rgba(139,26,26,0.3)', color: '#c0392b', border: '1px solid #5a1a1a' }}>
                            本月已滿
                          </span>
                        )}
                        <span className="text-lg font-bold shrink-0"
                          style={{ color: advice.isFull ? '#c0392b' : '#d4a017' }}>
                          {advice.isFull ? '0%' : `${advice.effectiveRate}%`}
                        </span>
                        <button
                          type="button"
                          disabled={advice.isFull || !validAmount}
                          onClick={e => {
                            e.stopPropagation()
                            handleRecordWithCard(advice.card.id)
                          }}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                          style={advice.isFull || !validAmount
                            ? { background: 'transparent', color: '#3d2e14', borderColor: '#3d2e14', cursor: 'not-allowed' }
                            : { background: 'transparent', color: '#c8901a', borderColor: '#c8901a' }}
                        >
                          +刷卡
                        </button>
                      </div>

                      {/* Row 2: rate breakdown (left) + reward total (right) */}
                      {!advice.isFull && (
                        <div className="flex items-end justify-between mt-1 gap-2">
                          <p className="text-xs flex-1 min-w-0" style={{ color: '#c8a060' }}>
                            基本{advice.rateBreakdown.base}%
                            {advice.rateBreakdown.paymentMethod > 0 && ` + 行動支付${advice.rateBreakdown.paymentMethod}%`}
                            {advice.rateBreakdown.store > 0 && ` + 店家${advice.rateBreakdown.store}%`}
                          </p>
                          {twdAmount > 0 && breakdown && (
                            <span className="text-2xl font-bold shrink-0" style={{ color: '#4ade80' }}>
                              NT${estimated.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Divider + detail line */}
                      {detailParts.length > 0 && (
                        <>
                          <div className="mt-2 mb-1.5" style={{ height: 1, background: '#3d2e14' }} />
                          <p className="text-xs" style={{ color: '#9a7040' }}>{detailParts.join(' | ')}</p>
                        </>
                      )}

                      {/* Progress bar for top card */}
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

                      {/* Store bonus cap warning */}
                      {breakdown?.storeCapped && (
                        <p className="text-xs mt-1.5" style={{ color: '#f59e0b' }}>
                          ⚠️ {storeBonusLabel}加碼額度本次僅剩 NT${breakdown.storeCapRemaining.toLocaleString()}，總額中已包含此部分
                        </p>
                      )}

                      {/* Operation warning */}
                      {opWarning && (
                        <p className="text-xs mt-1.5" style={{ color: '#f59e0b' }}>
                          ⚠️ {opWarning}
                        </p>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>
        </div>
      )}
    </div>
  )
}
