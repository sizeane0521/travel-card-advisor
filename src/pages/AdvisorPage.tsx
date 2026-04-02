import { useState } from 'react'
import { useStore } from '../store/useStore'
import { getAllStoreNames, getSortedRecommendations } from '../lib/rewardCalc'

export default function AdvisorPage() {
  const { data } = useStore()
  const [selectedStore, setSelectedStore] = useState<string | null>(null)

  const activeTrip = data.trips.find(t => t.id === data.activeTripId) ?? null
  const storeNames = getAllStoreNames(data.cards)
  const tripExpenses = activeTrip?.expenses ?? []

  const recommendations = data.cards.length > 0
    ? getSortedRecommendations(data.cards, selectedStore, tripExpenses)
    : []

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Active trip indicator */}
      <div className="mb-4">
        {activeTrip ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-blue-600 text-sm">✈️</span>
            <span className="text-blue-700 text-sm font-medium">{activeTrip.name}</span>
            {activeTrip.endDate && (
              <span className="text-xs text-blue-400 ml-auto">已結束</span>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <p className="text-amber-700 text-sm">尚無進行中的旅程。請至「旅程」頁面建立新旅程。</p>
          </div>
        )}
      </div>

      {/* Store selection */}
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-2">選擇店家</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStore(null)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selectedStore === null
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            一般消費
          </button>
          {storeNames.map(name => (
            <button
              key={name}
              onClick={() => setSelectedStore(name)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedStore === name
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Card recommendations */}
      {data.cards.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">💳</p>
          <p className="text-sm">尚未設定信用卡。請至「設定」頁面新增。</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500">刷卡建議</h2>
          {recommendations.map((advice, idx) => (
            <div
              key={advice.card.id}
              className={`bg-white rounded-xl border p-4 ${
                advice.isFull ? 'opacity-50' : idx === 0 ? 'border-blue-400 shadow-sm' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {idx === 0 && !advice.isFull && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">推薦</span>
                    )}
                    <span className="font-medium text-gray-900">{advice.card.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{advice.remainingCapDisplay}</p>
                </div>
                <div className="text-right">
                  {advice.isFull ? (
                    <span className="text-sm text-red-500 font-medium">本月已滿</span>
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">{advice.effectiveRate}%</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
