import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Trip } from '../types'
import TripDetailPage from './TripDetailPage'
import DatePicker from '../components/DatePicker'

type CurrencyCode = 'JPY' | 'KRW' | 'EUR' | 'USD' | 'THB'

const POPULAR_CURRENCIES: { code: CurrencyCode; flag: string; label: string }[] = [
  { code: 'JPY', flag: '🇯🇵', label: '日本' },
  { code: 'KRW', flag: '🇰🇷', label: '韓國' },
  { code: 'EUR', flag: '🇪🇺', label: '歐洲' },
  { code: 'USD', flag: '🇺🇸', label: '美國' },
  { code: 'THB', flag: '🇹🇭', label: '泰國' },
]

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
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode | null>(null)
  const [exchangeRateInput, setExchangeRateInput] = useState('')
  const [allRates, setAllRates] = useState<Record<string, number> | null>(null)
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [nameError, setNameError] = useState(false)
  const [rateError, setRateError] = useState(false)

  // Edit trip state
  const [editingTripId, setEditingTripId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editCurrency, setEditCurrency] = useState<CurrencyCode | null>(null)
  const [editRate, setEditRate] = useState('')
  const [editNameError, setEditNameError] = useState(false)
  const [editRateError, setEditRateError] = useState(false)

  const sortedTrips = [...data.trips].reverse()

  if (selectedTrip !== null) {
    return <TripDetailPage trip={selectedTrip} cards={data.cards} onBack={() => setSelectedTrip(null)} />
  }

  async function fetchRates(): Promise<Record<string, number> | null> {
    setFetchStatus('loading')
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/TWD')
      if (!res.ok) throw new Error('non-2xx')
      const json = await res.json()
      const rates = json.rates as Record<string, number>
      setAllRates(rates)
      setFetchStatus('idle')
      return rates
    } catch {
      setFetchStatus('error')
      return null
    }
  }

  async function handleCurrencySelect(code: CurrencyCode) {
    if (selectedCurrency === code) {
      setSelectedCurrency(null)
      setExchangeRateInput('')
      return
    }
    setSelectedCurrency(code)

    let rates = allRates
    if (!rates) {
      rates = await fetchRates()
    }

    if (rates && rates[code]) {
      const rate = Math.round((1 / rates[code]) * 10000) / 10000
      setExchangeRateInput(String(rate))
    }
  }

  function startEditTrip(trip: Trip) {
    setEditingTripId(trip.id)
    setEditName(trip.name)
    setEditStartDate(trip.startDate)
    setEditEndDate(trip.endDate ?? '')
    setEditCurrency((trip.exchangeRate?.currency as CurrencyCode) ?? null)
    setEditRate(trip.exchangeRate ? String(trip.exchangeRate.rate) : '')
    setEditNameError(false)
    setEditRateError(false)
  }

  function cancelEditTrip() {
    setEditingTripId(null)
  }

  function saveEditTrip(trip: Trip) {
    if (!editName.trim()) { setEditNameError(true); return }
    const rateNum = parseFloat(editRate)
    if (editCurrency && (isNaN(rateNum) || rateNum <= 0)) { setEditRateError(true); return }
    const exchangeRate = editCurrency && !isNaN(rateNum) && rateNum > 0
      ? { currency: editCurrency, rate: rateNum }
      : undefined
    dispatch({
      type: 'UPDATE_TRIP',
      trip: { ...trip, name: editName.trim(), startDate: editStartDate, endDate: editEndDate || null, exchangeRate },
    })
    setEditingTripId(null)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setNameError(true); return }
    const rateNum = parseFloat(exchangeRateInput)
    if (selectedCurrency && (isNaN(rateNum) || rateNum <= 0)) { setRateError(true); return }
    const exchangeRate = selectedCurrency && !isNaN(rateNum) && rateNum > 0
      ? { currency: selectedCurrency, rate: rateNum }
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
    setNameError(false)
    setRateError(false)
    setStartDate(todayStr())
    setEndDate('')
    setExchangeRateInput('')
    setSelectedCurrency(null)
    setAllRates(null)
    setFetchStatus('idle')
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
              onChange={e => { setName(e.target.value); if (nameError) setNameError(false) }}
              placeholder="例：2026 六月 日本"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
              style={nameError ? { borderColor: '#ff5555', boxShadow: '0 0 0 2px rgba(192,57,43,0.2)' } : undefined}
              autoFocus
            />
            {nameError && <p className="text-xs mt-1" style={{ color: '#ff5555' }}>請輸入旅程名稱</p>}
          </div>
          <div>
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">開始日期</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">結束日期（選填）</label>
            <DatePicker
              value={endDate}
              min={startDate}
              onChange={setEndDate}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#c8a060] block mb-2 uppercase tracking-wider">幣別（選填）</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {POPULAR_CURRENCIES.map(({ code, flag }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleCurrencySelect(code)}
                  className="px-3 py-1.5 rounded-lg text-sm border transition-all"
                  style={selectedCurrency === code
                    ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                    : { background: 'transparent', color: '#c8a060', borderColor: '#4a3418' }}
                >
                  {flag} {code}
                </button>
              ))}
              {fetchStatus === 'loading' && (
                <span className="text-xs self-center" style={{ color: '#9a7040' }}>載入中…</span>
              )}
            </div>
            {fetchStatus === 'error' && (
              <p className="text-xs mb-2" style={{ color: '#ff5555' }}>無法取得最新匯率，請手動輸入</p>
            )}
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">匯率（1 外幣 = NT$?）</label>
            <input
              type="number"
              step="0.0001"
              value={exchangeRateInput}
              onChange={e => { setExchangeRateInput(e.target.value); if (rateError) setRateError(false) }}
              disabled={fetchStatus === 'loading'}
              placeholder={selectedCurrency ? `例：0.2136（1 ${selectedCurrency} = NT$0.2136）` : '先選擇幣別'}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none disabled:opacity-50"
              style={rateError ? { borderColor: '#ff5555', boxShadow: '0 0 0 2px rgba(255,85,85,0.2)' } : undefined}
            />
            {rateError && <p className="text-xs mt-1" style={{ color: '#ff5555' }}>請輸入有效匯率</p>}
            {!rateError && fetchStatus === 'idle' && selectedCurrency && exchangeRateInput && (
              <p className="text-xs mt-1" style={{ color: '#9a7040' }}>已自動帶入最新參考匯率，可手動調整</p>
            )}
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
            const isEnded = !!trip.endDate && trip.endDate <= todayStr()

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
                {trip.exchangeRate && (
                  <p className="text-xs mt-1" style={{ color: '#9a7040' }}>
                    {trip.exchangeRate.currency} · 匯率 {trip.exchangeRate.rate}
                  </p>
                )}

                <div className="mt-3 flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
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
                      style={{ borderColor: '#5a1a1a', color: '#ff5555' }}
                    >
                      結束旅程
                    </button>
                  )}
                  <button
                    onClick={() => startEditTrip(trip)}
                    className="text-xs px-3 py-1 rounded border transition-colors"
                    style={{ borderColor: '#3d2e14', color: '#c8a060' }}
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="text-xs px-3 py-1 rounded border transition-colors"
                    style={{ borderColor: '#5a1a1a', color: '#ff5555' }}
                  >
                    刪除
                  </button>
                </div>

                {/* Inline edit form */}
                {editingTripId === trip.id && (
                  <div className="mt-3 space-y-2 pt-3" style={{ borderTop: '1px solid #3d2e14' }} onClick={e => e.stopPropagation()}>
                    <div>
                      <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">旅程名稱</label>
                      <input
                        value={editName}
                        onChange={e => { setEditName(e.target.value); if (editNameError) setEditNameError(false) }}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ background: '#141008', borderColor: editNameError ? '#ff5555' : '#4a3418', color: '#f2e8c9' }}
                      />
                      {editNameError && <p className="text-xs mt-0.5" style={{ color: '#ff5555' }}>請輸入旅程名稱</p>}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">開始日期</label>
                        <DatePicker value={editStartDate} onChange={setEditStartDate} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">結束日期</label>
                        <DatePicker value={editEndDate} onChange={setEditEndDate} min={editStartDate} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                    {trip.exchangeRate && (
                      <div>
                        <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">匯率（1 {editCurrency} = NT$?）</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editRate}
                          onChange={e => { setEditRate(e.target.value); if (editRateError) setEditRateError(false) }}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                          style={{ background: '#141008', borderColor: editRateError ? '#ff5555' : '#4a3418', color: '#f2e8c9' }}
                        />
                        {editRateError && <p className="text-xs mt-0.5" style={{ color: '#ff5555' }}>請輸入有效匯率</p>}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEditTrip(trip)}
                        className="flex-1 rounded-lg py-1.5 text-xs font-semibold"
                        style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}
                      >
                        儲存
                      </button>
                      <button
                        onClick={cancelEditTrip}
                        className="flex-1 rounded-lg py-1.5 text-xs border"
                        style={{ borderColor: '#3a2810', color: '#c8a060' }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
