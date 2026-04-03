import { useState } from 'react'
import { useStore } from '../store/useStore'
import { getAllStoreNames, calcExpenseReward } from '../lib/rewardCalc'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function genId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function ExpensePage() {
  const { data, dispatch } = useStore()
  const activeTrip = data.trips.find(t => t.id === data.activeTripId) ?? null

  const [amount, setAmount] = useState('')
  const [cardId, setCardId] = useState(data.cards[0]?.id ?? '')
  const [store, setStore] = useState<string>('')
  const [lastReward, setLastReward] = useState<number | null>(null)
  const [amountError, setAmountError] = useState('')

  const storeNames = getAllStoreNames(data.cards)
  const expenses = activeTrip ? [...activeTrip.expenses].reverse() : []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(amount, 10)
    if (!parsed || parsed <= 0) {
      setAmountError('請輸入正整數金額')
      return
    }
    if (!cardId) return
    if (!activeTrip || activeTrip.endDate) return

    setAmountError('')
    const selectedCard = data.cards.find(c => c.id === cardId)!
    const storeName = store || null
    const reward = calcExpenseReward(selectedCard, parsed, storeName, activeTrip.expenses)

    const expense = {
      id: genId(),
      amount: parsed,
      cardId,
      store: storeName,
      date: todayStr(),
      estimatedReward: reward,
    }

    dispatch({ type: 'ADD_EXPENSE', tripId: activeTrip.id, expense })
    setLastReward(reward)
    setAmount('')
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
        <p className="text-sm text-[#5a3f1a]">尚無進行中的旅程。請至「旅程」頁面建立新旅程。</p>
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
        <p className="text-sm text-[#5a3f1a]">此旅程已結束，無法新增消費。請建立新旅程。</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-[#f2e8c9] mb-4">記帳</h1>

      {/* ── Log expense form ── */}
      <form onSubmit={handleSubmit}
        className="beast-card rounded-xl p-4 mb-4 space-y-3"
        style={{ background: '#1a1208', border: '1px solid #3a2810' }}>

        <div>
          <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">金額（NT$）</label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => { setAmount(e.target.value); setAmountError('') }}
            placeholder="例：1200"
            className="w-full border rounded-lg px-3 py-2.5 text-lg focus:outline-none"
          />
          {amountError && <p className="text-xs mt-1" style={{ color: '#c0392b' }}>{amountError}</p>}
        </div>

        <div>
          <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">信用卡</label>
          <select
            value={cardId}
            onChange={e => setCardId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none"
          >
            {data.cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">店家（選填）</label>
          <select
            value={store}
            onChange={e => setStore(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none"
          >
            <option value="">一般消費</option>
            {storeNames.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg py-3 font-semibold text-sm tracking-wider transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}
        >
          ◆ 記錄消費
        </button>

        {lastReward !== null && (
          <div className="rounded-lg px-3 py-2.5 text-center"
            style={{ background: '#0f1a0e', border: '1px solid #1a4a28' }}>
            <p className="text-sm" style={{ color: '#4ade80' }}>
              估算回饋：<span className="font-semibold">NT${lastReward.toLocaleString()}</span>
            </p>
          </div>
        )}
      </form>

      {/* ── Expense list ── */}
      <h2 className="text-xs font-medium text-[#7a5c2a] mb-2 uppercase tracking-widest">本次旅程消費記錄</h2>
      {expenses.length === 0 ? (
        <p className="text-[#5a3f1a] text-sm text-center py-4">尚無消費記錄</p>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => {
            const card = data.cards.find(c => c.id === e.cardId)
            return (
              <div key={e.id}
                className="beast-card rounded-xl p-3 flex items-center justify-between"
                style={{ background: '#1a1208', border: '1px solid #2e2210' }}>
                <div>
                  <p className="text-xs text-[#5a3f1a]">{e.date} · {e.store ?? '一般消費'}</p>
                  <p className="font-medium text-[#f2e8c9]">NT${e.amount.toLocaleString()}</p>
                  <p className="text-xs text-[#7a5c2a]">{card?.name ?? e.cardId} · 回饋 <span style={{ color: '#4ade80' }}>NT${e.estimatedReward.toLocaleString()}</span></p>
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
