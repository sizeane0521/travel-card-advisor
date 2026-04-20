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
  const [currencyError, setCurrencyError] = useState(false)
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
    const rateNum = parseFloat(exchangeRateInput)
    let hasError = false
    if (!name.trim()) { setNameError(true); hasError = true }
    if (!selectedCurrency) { setCurrencyError(true); hasError = true }
    if (selectedCurrency && (isNaN(rateNum) || rateNum <= 0)) { setRateError(true); hasError = true }
    if (hasError) return
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
    setCurrencyError(false)
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

  if (sortedTrips.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8"
        style={{ minHeight: 'calc(100dvh - 80px)', paddingBottom: '15vh' }}>
        <svg className="mb-4 opacity-40" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--color-secondary)' }} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>
          尚無旅程記錄。<br />點擊下方按鈕建立新旅程。
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm px-6 py-2.5 rounded font-semibold tracking-wide transition-all active:scale-95"
          style={{ background: 'var(--color-secondary)', color: '#fff' }}
        >
          ＋ 新旅程
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-base)' }}>旅程</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm px-4 py-1.5 rounded font-semibold tracking-wide transition-all active:scale-95"
          style={{ background: 'var(--color-secondary)', color: '#fff' }}
        >
          ＋ 新旅程
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate}
          className="glass-card rounded-xl p-4 mb-4 space-y-3"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-secondary)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div>
            <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>旅程名稱 <span style={{ color: '#ff5555' }}>*</span></label>
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
            <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>開始日期 <span style={{ color: '#ff5555' }}>*</span></label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>結束日期（選填）</label>
            <DatePicker
              value={endDate}
              min={startDate}
              onChange={setEndDate}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs block mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>幣別 <span style={{ color: '#ff5555' }}>*</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {POPULAR_CURRENCIES.map(({ code, flag }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => { handleCurrencySelect(code); if (currencyError) setCurrencyError(false) }}
                  className="px-3 py-1.5 rounded-lg text-sm border transition-all"
                  style={selectedCurrency === code
                    ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)', fontWeight: 600 }
                    : { background: 'transparent', color: currencyError ? '#ff5555' : 'var(--color-text-muted)', borderColor: currencyError ? '#ff5555' : 'var(--color-border)' }}
                >
                  {flag} {code}
                </button>
              ))}
              {fetchStatus === 'loading' && (
                <span className="text-xs self-center" style={{ color: 'var(--color-text-muted)' }}>載入中…</span>
              )}
            </div>
            {currencyError && <p className="text-xs mb-2" style={{ color: '#ff5555' }}>請選擇幣別</p>}
            {fetchStatus === 'error' && (
              <p className="text-xs mb-2" style={{ color: '#ff5555' }}>無法取得最新匯率，請手動輸入</p>
            )}
            <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>匯率（1 外幣 = NT$?）<span style={{ color: '#ff5555' }}>*</span></label>
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
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>已自動帶入最新參考匯率，可手動調整</p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="flex-1 rounded-lg py-2.5 font-semibold text-sm transition-all"
              style={{ background: 'var(--color-secondary)', color: '#fff' }}>
              建立
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg py-2.5 text-sm border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              取消
            </button>
          </div>
        </form>
      )}

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
                className="glass-card rounded-xl p-4 cursor-pointer active:opacity-80 transition-opacity"
                style={isActive
                  ? { background: 'var(--color-bg-surface)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--color-secondary)' }
                  : { border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider"
                          style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--color-secondary)', border: '1px solid rgba(245,166,35,0.35)' }}>
                          ◆ 進行中
                        </span>
                      )}
                      {isEnded && (
                        <span className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(0,185,181,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(0,185,181,0.2)' }}>
                          已結束
                        </span>
                      )}
                      <span className="font-medium" style={{ color: 'var(--color-text-base)' }}>{trip.name}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {trip.startDate}{trip.endDate ? ` — ${trip.endDate}` : ''}
                    </p>
                  </div>
                  <span className="text-lg ml-2 shrink-0" style={{ color: 'var(--color-text-muted)' }}>›</span>
                </div>

                <div className="mt-2 flex gap-4 text-sm">
                  <span className="" style={{ color: 'var(--color-text-muted)' }}>消費 <span className="font-medium" style={{ color: 'var(--color-text-base)' }}>NT${totalSpend.toLocaleString()}</span></span>
                  <span className="" style={{ color: 'var(--color-text-muted)' }}>回饋 <span className="font-medium" style={{ color: 'var(--color-success)' }}>NT${totalReward.toLocaleString()}</span></span>
                  <span className="" style={{ color: 'var(--color-text-muted)' }}>{trip.expenses.length} 筆</span>
                </div>
                {trip.exchangeRate && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {trip.exchangeRate.currency} · 匯率 {trip.exchangeRate.rate}
                  </p>
                )}

                <div className="mt-3 flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  {!isActive && !isEnded && (
                    <button
                      onClick={() => handleSetActive(trip.id)}
                      className="text-xs px-3 py-1 rounded border transition-colors"
                      style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
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
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
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
                  <div className="mt-3 space-y-2 pt-3" style={{ borderTop: '1px solid var(--color-border)' }} onClick={e => e.stopPropagation()}>
                    <div>
                      <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>旅程名稱</label>
                      <input
                        value={editName}
                        onChange={e => { setEditName(e.target.value); if (editNameError) setEditNameError(false) }}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ background: 'var(--color-input-bg)', borderColor: editNameError ? '#ff5555' : 'var(--color-input-border)', color: 'var(--color-text-base)' }}
                      />
                      {editNameError && <p className="text-xs mt-0.5" style={{ color: '#ff5555' }}>請輸入旅程名稱</p>}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>開始日期</label>
                        <DatePicker value={editStartDate} onChange={setEditStartDate} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>結束日期</label>
                        <DatePicker value={editEndDate} onChange={setEditEndDate} min={editStartDate} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                    {trip.exchangeRate && (
                      <div>
                        <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>匯率（1 {editCurrency} = NT$?）</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editRate}
                          onChange={e => { setEditRate(e.target.value); if (editRateError) setEditRateError(false) }}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                          style={{ background: 'var(--color-input-bg)', borderColor: editRateError ? '#ff5555' : 'var(--color-input-border)', color: 'var(--color-text-base)' }}
                        />
                        {editRateError && <p className="text-xs mt-0.5" style={{ color: '#ff5555' }}>請輸入有效匯率</p>}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEditTrip(trip)}
                        className="flex-1 rounded-lg py-1.5 text-xs font-semibold"
                        style={{ background: 'var(--color-secondary)', color: '#fff' }}
                      >
                        儲存
                      </button>
                      <button
                        onClick={cancelEditTrip}
                        className="flex-1 rounded-lg py-1.5 text-xs border"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
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
    </div>
  )
}
