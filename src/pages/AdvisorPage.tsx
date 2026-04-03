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

      {/* ── Active trip indicator ── */}
      <div className="mb-4">
        {activeTrip ? (
          <div className="beast-card flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: '#1a1208', border: '1px solid #c8901a', boxShadow: '0 0 12px rgba(200,144,26,0.12)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span className="text-[#d4a017] text-sm font-medium">{activeTrip.name}</span>
            {activeTrip.endDate && (
              <span className="text-xs text-[#7a5c2a] ml-auto">已結束</span>
            )}
          </div>
        ) : (
          <div className="rounded-xl px-4 py-3" style={{ background: '#1a1005', border: '1px solid #5a3010' }}>
            <p className="text-[#c8841a] text-sm">尚無進行中的旅程。請至「旅程」頁面建立新旅程。</p>
          </div>
        )}
      </div>

      {/* ── Store selection ── */}
      <div className="mb-4">
        <h2 className="text-xs font-medium text-[#7a5c2a] mb-2 uppercase tracking-widest">選擇店家</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStore(null)}
            className="px-3 py-1.5 rounded text-sm border transition-all"
            style={selectedStore === null
              ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
              : { background: 'transparent', color: '#b89444', borderColor: '#3a2810' }}
          >
            一般消費
          </button>
          {storeNames.map(name => (
            <button
              key={name}
              onClick={() => setSelectedStore(name)}
              className="px-3 py-1.5 rounded text-sm border transition-all"
              style={selectedStore === name
                ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                : { background: 'transparent', color: '#b89444', borderColor: '#3a2810' }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Card recommendations ── */}
      {data.cards.length === 0 ? (
        <div className="text-center py-14">
          <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
            <path d="M11 3L8 9l4 13 4-13-3-6"/>
            <line x1="2" y1="9" x2="22" y2="9"/>
          </svg>
          <p className="text-sm text-[#5a3f1a]">尚未設定信用卡。請至「設定」頁面新增。</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-[#7a5c2a] uppercase tracking-widest">刷卡建議</h2>
          {recommendations.map((advice, idx) => (
            <div
              key={advice.card.id}
              className="beast-card rounded-xl p-4 transition-all"
              style={advice.isFull
                ? { background: '#110d05', border: '1px solid #2a1e0a', opacity: 0.5 }
                : idx === 0
                  ? { background: '#1e1608', border: '1px solid #c8901a', boxShadow: '0 0 16px rgba(200,144,26,0.15)' }
                  : { background: '#1a1208', border: '1px solid #3a2810' }
              }
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {idx === 0 && !advice.isFull && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider"
                        style={{ background: 'rgba(212,160,23,0.2)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.3)' }}>
                        ◆ 推薦
                      </span>
                    )}
                    <span className="font-medium text-[#f2e8c9]">{advice.card.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  {advice.isFull ? (
                    <span className="text-sm font-medium" style={{ color: '#c0392b' }}>本月已滿</span>
                  ) : advice.remainingCapDisplay ? (
                    <div>
                      <p className="text-xl font-bold" style={{ color: '#d4a017' }}>{advice.remainingCapDisplay}</p>
                      <p className="text-sm text-[#7a5c2a]">{advice.effectiveRate}% 回饋率</p>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold" style={{ color: '#d4a017' }}>{advice.effectiveRate}%</span>
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
