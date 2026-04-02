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
        <h1 className="text-lg font-semibold text-gray-900">旅程</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg active:bg-blue-700"
        >
          ＋ 新旅程
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">旅程名稱</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：2026 六月 日本"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">開始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium">建立</button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-600">取消</button>
          </div>
        </form>
      )}

      {sortedTrips.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">✈️</p>
          <p className="text-sm">尚無旅程記錄。點擊「新旅程」開始。</p>
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
                className={`bg-white rounded-xl border p-4 ${isActive ? 'border-blue-400' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">進行中</span>
                      )}
                      {isEnded && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已結束</span>
                      )}
                      <span className="font-medium text-gray-900">{trip.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {trip.startDate}{trip.endDate ? ` ～ ${trip.endDate}` : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-gray-600">消費 <span className="font-medium text-gray-900">NT${totalSpend.toLocaleString()}</span></span>
                  <span className="text-gray-600">回饋 <span className="font-medium text-green-600">NT${totalReward.toLocaleString()}</span></span>
                  <span className="text-gray-400">{trip.expenses.length} 筆</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {!isActive && !isEnded && (
                    <button
                      onClick={() => handleSetActive(trip.id)}
                      className="text-xs border border-blue-300 text-blue-600 px-3 py-1 rounded-full"
                    >
                      設為當前旅程
                    </button>
                  )}
                  {isActive && !isEnded && (
                    <button
                      onClick={() => handleEnd(trip.id)}
                      className="text-xs border border-red-200 text-red-500 px-3 py-1 rounded-full"
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
