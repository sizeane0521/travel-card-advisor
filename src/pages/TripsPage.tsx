import { useState } from 'react'
import { useStore } from '../store/useStore'

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

  const sortedTrips = [...data.trips].reverse()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    dispatch({
      type: 'ADD_TRIP',
      trip: {
        id: genId(),
        name: name.trim(),
        startDate,
        endDate: null,
        expenses: [],
      },
    })
    setName('')
    setStartDate(todayStr())
    setShowForm(false)
  }

  function handleEnd(tripId: string) {
    if (!confirm('確定要結束此旅程嗎？結束後無法新增消費。')) return
    dispatch({ type: 'END_TRIP', tripId, endDate: todayStr() })
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
            <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">旅程名稱</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：2026 六月 日本"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">開始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
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
              style={{ borderColor: '#3a2810', color: '#7a5c2a' }}>
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
          <p className="text-sm text-[#5a3f1a]">尚無旅程記錄。點擊「新旅程」開始。</p>
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
                className="beast-card rounded-xl p-4"
                style={isActive
                  ? { background: '#1e1608', border: '1px solid #c8901a', boxShadow: '0 0 14px rgba(200,144,26,0.13)' }
                  : { background: '#1a1208', border: '1px solid #2e2210' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider"
                          style={{ background: 'rgba(212,160,23,0.18)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.3)' }}>
                          ◆ 進行中
                        </span>
                      )}
                      {isEnded && (
                        <span className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(90,63,26,0.3)', color: '#5a3f1a', border: '1px solid #3a2810' }}>
                          已結束
                        </span>
                      )}
                      <span className="font-medium text-[#f2e8c9]">{trip.name}</span>
                    </div>
                    <p className="text-xs text-[#5a3f1a] mt-0.5">
                      {trip.startDate}{trip.endDate ? ` — ${trip.endDate}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-[#7a5c2a]">消費 <span className="font-medium text-[#f2e8c9]">NT${totalSpend.toLocaleString()}</span></span>
                  <span className="text-[#7a5c2a]">回饋 <span className="font-medium" style={{ color: '#4ade80' }}>NT${totalReward.toLocaleString()}</span></span>
                  <span className="text-[#5a3f1a]">{trip.expenses.length} 筆</span>
                </div>

                <div className="mt-3 flex gap-2">
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
