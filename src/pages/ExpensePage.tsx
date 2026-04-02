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
      <div className="p-4 text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">📝</p>
        <p className="text-sm">尚無進行中的旅程。請至「旅程」頁面建立新旅程。</p>
      </div>
    )
  }

  if (activeTrip.endDate) {
    return (
      <div className="p-4 text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🔒</p>
        <p className="text-sm">此旅程已結束，無法新增消費。請建立新旅程。</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">記帳</h1>

      {/* Log expense form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        <div>
          <label className="text-sm text-gray-600 block mb-1">金額（NT$）</label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => { setAmount(e.target.value); setAmountError('') }}
            placeholder="例：1200"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {amountError && <p className="text-red-500 text-xs mt-1">{amountError}</p>}
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1">信用卡</label>
          <select
            value={cardId}
            onChange={e => setCardId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {data.cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1">店家（選填）</label>
          <select
            value={store}
            onChange={e => setStore(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">一般消費</option>
            {storeNames.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium active:bg-blue-700 transition-colors"
        >
          記錄消費
        </button>

        {lastReward !== null && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            <p className="text-green-700 text-sm">估算回饋：<span className="font-semibold">NT${lastReward.toLocaleString()}</span></p>
          </div>
        )}
      </form>

      {/* Expense list */}
      <h2 className="text-sm font-medium text-gray-500 mb-2">本次旅程消費記錄</h2>
      {expenses.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">尚無消費記錄</p>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => {
            const card = data.cards.find(c => c.id === e.cardId)
            return (
              <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{e.date} · {e.store ?? '一般消費'}</p>
                  <p className="font-medium text-gray-900">NT${e.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{card?.name ?? e.cardId} · 回饋 NT${e.estimatedReward.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-red-400 text-sm px-2 py-1 hover:text-red-600"
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
