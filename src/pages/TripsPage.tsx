import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Trip } from '../types'
import TripDetailPage from './TripDetailPage'

function genId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function TripsPage() {
  const { data, dispatch } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState('')
  const [exchangeRateInput, setExchangeRateInput] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  const sortedTrips = [...data.trips].reverse()

  if (selectedTrip !== null) {
    return <TripDetailPage trip={selectedTrip} cards={data.cards} onBack={() => setSelectedTrip(null)} />
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const rateNum = parseFloat(exchangeRateInput)
    const exchangeRate = !isNaN(rateNum) && rateNum > 0
      ? { currency: 'JPY', rate: rateNum }
      : undefined
    dispatch({
      type: 'ADD_TRIP',
      trip: {
        id: genId(),
        name: name.trim(),
        startDate,
        endDate: endDate || null,
        expenses: [],
        ...(exchangeRate ? { exchangeRate } : {}),
      },
    })
    setName('')
    setStartDate(todayStr())
    setEndDate('')
    setExchangeRateInput('')
    setShowForm(false)
  }

  function handleEnd(tripId: string) {
    if (!confirm('確定要結束此旅程嗎？結束後無法新增消費。')) return
    dispatch({ type: 'END_TRIP', tripId, endDate: todayStr() })
  }

  function handleDelete(tripId: string) {
    if (!confirm('確定要刪除此旅程嗎？旅程內所有消費記錄將一併刪除。')) return
    dispatch({ type: 'DELETE_TRIP', tripId })
  }

  function handleSetActive(tripId: string) {
    dispatch({ type: 'SET_ACTIVE_TRIP', tripId })
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#f2e8c9]">旅程</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm px-4 py-1.5 rounded font-semibold tracking-wide transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}
        >
          ＋ 新旅程
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate}
          className="beast-card rounded-xl p-4 mb-4 space-y-3"
          style={{ background: '#1a1208', border: '1px solid #c8901a', boxShadow: '0 0 16px rgba(200,144,26,0.12)' }}>
          <div>
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">旅程名稱</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：2026 六月 日本"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">開始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">結束日期（選填）</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">JPY 匯率（選填）</label>
            <input
              type="number"
              step="0.001"
              value={exchangeRateInput}
              onChange={e => setExchangeRateInput(e.target.value)}
              placeholder="例：0.22（1 JPY = NT$0.22）"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="flex-1 rounded-lg py-2.5 font-semibold text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}>
              建立
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg py-2.5 text-sm border transition-colors"
              style={{ borderColor: '#3a2810', color: '#c8a060' }}>
              取消
            </button>
          </div>
        </form>
      )}

      {sortedTrips.length === 0 ? (
        <div className="text-center py-14">
          <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <p className="text-sm text-[#9a7040]">尚無旅程記錄。點擊「新旅程」開始。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTrips.map(trip => {
            const totalSpend = trip.expenses.reduce((s, e) => s + e.amount, 0)
            const totalReward = trip.expenses.reduce((s, e) => s + e.estimatedReward, 0)
            const isActive = trip.id === data.activeTripId
            const isEnded = !!trip.endDate

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedTrip(trip)}
                className="beast-card rounded-xl p-4 cursor-pointer active:opacity-80 transition-opacity"
                style={isActive
                  ? { background: '#1e1608', border: '1px solid #c8901a', boxShadow: '0 0 14px rgba(200,144,26,0.13)' }
                  : { background: '#1a1208', border: '1px solid #3d2e14' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider"
                          style={{ background: 'rgba(212,160,23,0.18)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.3)' }}>
                          ◆ 進行中
                        </span>
                      )}
                      {isEnded && (
                        <span className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(90,63,26,0.3)', color: '#9a7040', border: '1px solid #3a2810' }}>
                          已結束
                        </span>
                      )}
                      <span className="font-medium text-[#f2e8c9]">{trip.name}</span>
                    </div>
                    <p className="text-xs text-[#9a7040] mt-0.5">
                      {trip.startDate}{trip.endDate ? ` — ${trip.endDate}` : ''}
                    </p>
                  </div>
                  <span className="text-[#9a7040] text-lg ml-2 shrink-0">›</span>
                </div>

                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-[#c8a060]">消費 <span className="font-medium text-[#f2e8c9]">NT${totalSpend.toLocaleString()}</span></span>
                  <span className="text-[#c8a060]">回饋 <span className="font-medium" style={{ color: '#4ade80' }}>NT${totalReward.toLocaleString()}</span></span>
                  <span className="text-[#9a7040]">{trip.expenses.length} 筆</span>
                </div>

                <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                  {!isActive && !isEnded && (
                    <button
                      onClick={() => handleSetActive(trip.id)}
                      className="text-xs px-3 py-1 rounded border transition-colors"
                      style={{ borderColor: '#c8901a', color: '#c8901a' }}
                    >
                      設為當前旅程
                    </button>
                  )}
                  {isActive && !isEnded && (
                    <button
                      onClick={() => handleEnd(trip.id)}
                      className="text-xs px-3 py-1 rounded border transition-colors"
                      style={{ borderColor: '#5a1a1a', color: '#c0392b' }}
                    >
                      結束旅程
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="text-xs px-3 py-1 rounded border transition-colors"
                    style={{ borderColor: '#5a1a1a', color: '#c0392b' }}
                  >
                    刪除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
