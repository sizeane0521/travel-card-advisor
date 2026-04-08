import { useState } from 'react'
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

export default function CalcPage() {
  const { data, dispatch } = useStore()
  const activeTrip = data.trips.find(t => t.id === data.activeTripId) ?? null

  const [amount, setAmount] = useState('')
  const [store, setStore] = useState<string>('')
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [storeQuery, setStoreQuery] = useState('')
  const [amountError, setAmountError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'google_pay' | 'physical'>('apple_pay')
  const [prereqOverrides, setPrereqOverrides] = useState<Record<string, Record<number, boolean>>>({})
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const storeNames = getAllStoreNames(data.cards)
  const tripExpenses = activeTrip?.expenses ?? []
  const allExpenses = data.trips.flatMap(t => t.expenses)

  const exchangeRate = activeTrip?.exchangeRate
  const parsedAmount = parseInt(amount, 10)
  const validAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const twdAmount = validAmount
    ? (exchangeRate ? Math.floor(parsedAmount * exchangeRate.rate) : parsedAmount)
    : 0

  const recommendations = data.cards.length > 0
    ? getSortedRecommendations(data.cards, store || null, tripExpenses, paymentMethod, undefined, prereqOverrides, allExpenses)
    : []

  const bestCardId = recommendations.find(a => !a.isFull)?.card.id ?? ''
  const effectiveSelectedCardId = (() => {
    if (!selectedCardId) return bestCardId
    const sel = recommendations.find(a => a.card.id === selectedCardId)
    if (!sel || sel.isFull) return bestCardId
    return selectedCardId
  })()

  const filteredStores = storeQuery.length > 0
    ? storeNames.filter(n => n.toLowerCase().includes(storeQuery.toLowerCase()))
    : []

  function handleRecordWithCard(cardId: string) {
    const parsed = parseInt(amount, 10)
    if (!parsed || parsed <= 0) {
      setAmountError('請輸入正整數金額')
      return
    }
    if (!activeTrip || activeTrip.endDate) return

    setAmountError('')
    const selectedCard = data.cards.find(c => c.id === cardId)!
    const storeName = store || null

    const twd = exchangeRate ? Math.floor(parsed * exchangeRate.rate) : parsed
    const foreignAmount = exchangeRate
      ? { currency: exchangeRate.currency, amount: parsed }
      : undefined

    const selectedAdvice = recommendations.find(a => a.card.id === cardId)
    const { estimatedReward, paymentMethodReward, breakdown } = calcExpenseReward(
      selectedCard, twd, storeName, activeTrip.expenses, paymentMethod, undefined, prereqOverrides[cardId], allExpenses
    )

    dispatch({
      type: 'ADD_EXPENSE',
      tripId: activeTrip.id,
      expense: {
        id: genId(),
        amount: twd,
        cardId,
        store: storeName,
        date: todayStr(),
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
      },
    })

    setAmount('')
    setStore('')
    setStoreQuery('')
    setPrereqOverrides({})
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
      {/* Header — 試算 only, no expense count */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#f2e8c9]">試算</h1>
      </div>

      {/* ── Calc form (no onSubmit) ── */}
      <div className="beast-card rounded-xl p-4 mb-4 space-y-4"
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

          <div className="flex flex-wrap gap-2">
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
                                        onClick={() => { setStore(s); setStoreQuery(s) }}
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

        {/* Payment method selector */}
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

        {/* Card recommendation list with per-card +記帳 button */}
        {data.cards.length > 0 && (
          <div>
            <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">選擇信用卡（依回饋排序）</label>
            <div className="space-y-2">
              {recommendations.map((advice, idx) => {
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

                return (
                  <div
                    key={advice.card.id}
                    onClick={() => !advice.isFull && setSelectedCardId(advice.card.id)}
                    className="rounded-xl p-3 transition-all"
                    style={{
                      cursor: advice.isFull ? 'default' : 'pointer',
                      background: isTop && isSelected ? '#2a1f0a' : isSelected ? '#1e1608' : '#141008',
                      border: isTop && isSelected
                        ? '2px solid #ffcc00'
                        : isSelected
                          ? '1px solid #c8901a'
                          : '1px solid #3d2e14',
                      boxShadow: isSelected ? '0 0 12px rgba(255,204,0,0.25)' : 'none',
                      opacity: advice.isFull ? 0.45 : 1,
                    }}
                  >
                    {isTop && (
                      <div className="mb-1">
                        <span className="text-xs px-2 py-1 rounded-lg font-bold tracking-wide"
                          style={{ background: 'linear-gradient(90deg, #ffcc00, #ffea00)', color: '#1a1208', border: '1px solid #ffcc00' }}>
                          🌟 最佳推薦
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                        <div className="mt-0.5">
                          {advice.isFull ? (
                            <span className="text-sm" style={{ color: '#c0392b' }}>0%</span>
                          ) : (
                            <div>
                              <span className="text-lg font-bold" style={{ color: '#d4a017' }}>{advice.effectiveRate}%</span>
                              {(advice.rateBreakdown.paymentMethod > 0 || advice.rateBreakdown.store > 0) && (
                                <p className="text-xs" style={{ color: '#c8a060' }}>
                                  基本{advice.rateBreakdown.base}
                                  {advice.rateBreakdown.paymentMethod > 0 && ` + ${advice.paymentMethodBadge === 'apple_pay' ? 'AP' : 'GP'}${advice.rateBreakdown.paymentMethod}`}
                                  {advice.rateBreakdown.store > 0 && ` + 店家${advice.rateBreakdown.store}`}
                                </p>
                              )}
                              {twdAmount > 0 && breakdown && (
                                <p className="text-xs" style={{ color: '#4ade80' }}>
                                  {formatBreakdown(estimated, breakdown, storeBonusLabel)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Per-card +記帳 button */}
                      <button
                        type="button"
                        disabled={advice.isFull}
                        onClick={e => {
                          e.stopPropagation()
                          handleRecordWithCard(advice.card.id)
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                        style={advice.isFull
                          ? { background: 'transparent', color: '#3d2e14', borderColor: '#3d2e14', cursor: 'not-allowed' }
                          : { background: 'transparent', color: '#c8901a', borderColor: '#c8901a' }}
                      >
                        +記帳
                      </button>
                    </div>

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

                    {/* Store bonus cap truncation warning */}
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

                    {/* Prerequisite tier toggles */}
                    {paymentMethod !== 'physical' &&
                      advice.card.paymentMethodBonus?.methods.includes(paymentMethod) &&
                      advice.card.paymentMethodBonus.tiers.some(t => t.prerequisite) && (
                      <div className="mt-2 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                        {advice.card.paymentMethodBonus.tiers.map((tier, tierIdx) => {
                          if (!tier.prerequisite) return null
                          const isEnabled = prereqOverrides[advice.card.id]?.[tierIdx] === true
                          return (
                            <button
                              key={tierIdx}
                              type="button"
                              onClick={() => setPrereqOverrides(prev => ({
                                ...prev,
                                [advice.card.id]: { ...(prev[advice.card.id] ?? {}), [tierIdx]: !isEnabled },
                              }))}
                              className="text-xs px-2 py-1 rounded-lg border transition-all"
                              style={isEnabled
                                ? { background: 'rgba(74,174,226,0.2)', color: '#4aade2', borderColor: '#4aade2' }
                                : { background: 'transparent', color: '#9a7040', borderColor: '#3d2e14' }}
                            >
                              {isEnabled ? '✓' : '+'} {tier.prerequisite} (+{tier.rate}%)
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
