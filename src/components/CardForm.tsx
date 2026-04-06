import { useState } from 'react'
import type { Card, StoreBonus } from '../types'
import { importCardFromUrl, importCardFromHtml } from '../lib/cardImport'
import type { CardImportResult } from '../lib/cardImport'
import { useApiProvider } from '../lib/apiProviderContext'

const DEFAULT_BANK_URLS: Record<string, string> = {
  '國泰 Cube': 'https://www.cathaybk.com.tw/cathaybk/personal/product/credit-card/cards/cube/',
  '吉鶴卡': 'https://www.hncb.com.tw/wps/portal/HNCB/personal/card/credit/product/',
  '全支付': 'https://www.pxpay.com.tw/',
  'Line Bank': 'https://linebank.com.tw/card',
}

function genId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

interface Props {
  card: Card | null
  onSave: (card: Card) => void
  onCancel: () => void
}

export default function CardForm({ card, onSave, onCancel }: Props) {
  const { provider, apiKey } = useApiProvider()

  const [name, setName] = useState(card?.name ?? '')
  const [bankUrl, setBankUrl] = useState(card?.bankUrl ?? '')
  const [baseRate, setBaseRate] = useState(String(card?.baseRate ?? ''))
  const [rewardCap, setRewardCap] = useState(card?.monthlyCap.rewardLimit !== undefined ? String(card.monthlyCap.rewardLimit) : '')
  const [spendCap, setSpendCap] = useState(card?.monthlyCap.spendLimit !== undefined ? String(card.monthlyCap.spendLimit) : '')
  const [validFrom, setValidFrom] = useState(card?.validFrom ?? '')
  const [validTo, setValidTo] = useState(card?.validTo ?? '')
  const [bonuses, setBonuses] = useState<StoreBonus[]>(
    (card?.storeBonus ?? []).map(b => ({
      ...b,
      stores: b.stores ?? [],
      capPeriod: b.capPeriod ?? 'monthly',
    }))
  )

  // New bonus form state
  const [newBonusStore, setNewBonusStore] = useState('')
  const [newBonusRate, setNewBonusRate] = useState('')
  const [newBonusCap, setNewBonusCap] = useState('')
  const [newBonusCapPeriod, setNewBonusCapPeriod] = useState<'monthly' | 'period'>('monthly')

  // Store alias management: track which bonus index is expanded
  const [expandedAliasIdx, setExpandedAliasIdx] = useState<number | null>(null)
  const [newAliasInput, setNewAliasInput] = useState('')

  // Import panel state
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [showHtmlFallback, setShowHtmlFallback] = useState(false)
  const [manualHtml, setManualHtml] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])

  function handleNameChange(v: string) {
    setName(v)
    if (!bankUrl) {
      const match = Object.entries(DEFAULT_BANK_URLS).find(([k]) => v.includes(k.split(' ')[0]))
      if (match) setBankUrl(match[1])
    }
  }

  function addBonus() {
    if (!newBonusStore.trim() || !newBonusRate || !newBonusCap) return
    setBonuses(prev => [...prev, {
      storeName: newBonusStore.trim(),
      stores: [],
      rate: parseFloat(newBonusRate),
      cap: parseInt(newBonusCap, 10),
      capPeriod: newBonusCapPeriod,
    }])
    setNewBonusStore('')
    setNewBonusRate('')
    setNewBonusCap('')
    setNewBonusCapPeriod('monthly')
  }

  function removeBonus(idx: number) {
    setBonuses(prev => prev.filter((_, i) => i !== idx))
    if (expandedAliasIdx === idx) setExpandedAliasIdx(null)
  }

  function addAlias(idx: number) {
    const alias = newAliasInput.trim()
    if (!alias) return
    setBonuses(prev => prev.map((b, i) =>
      i === idx && !b.stores.includes(alias)
        ? { ...b, stores: [...b.stores, alias] }
        : b
    ))
    setNewAliasInput('')
  }

  function removeAlias(bonusIdx: number, alias: string) {
    setBonuses(prev => prev.map((b, i) =>
      i === bonusIdx ? { ...b, stores: b.stores.filter(s => s !== alias) } : b
    ))
  }

  // task 3.4: map new CardImportResult structure to form state
  function applyImportResult(result: CardImportResult) {
    const missing: string[] = []
    if (result.cardName) setName(result.cardName); else missing.push('卡片名稱')
    if (result.baseRate !== null) setBaseRate(String(result.baseRate)); else missing.push('海外回饋率')
    if (result.rewardCap !== null) setRewardCap(String(result.rewardCap))
    if (result.spendCap !== null) setSpendCap(String(result.spendCap))
    if (result.rewardCap === null && result.spendCap === null) missing.push('每月上限金額')
    if (result.validFrom) setValidFrom(result.validFrom)
    if (result.validTo) setValidTo(result.validTo)
    if (result.storeRules.length > 0) {
      setBonuses(result.storeRules.map(r => ({
        storeName: r.categoryName,
        stores: r.stores,
        rate: r.bonusRate,
        cap: r.spendCap,
        capPeriod: r.capPeriod,
      })))
    }
    setMissingFields(missing)
    setShowImportPanel(false)
    setShowHtmlFallback(false)
    setImportUrl('')
    setManualHtml('')
    setImportError(null)
  }

  function handleImportError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'INVALID_API_KEY') {
      setImportError('API Key 無效，請至設定頁面重新輸入。')
    } else {
      setImportError(msg)
    }
  }

  async function handleUrlImport() {
    if (!importUrl.trim()) return
    if (!apiKey) {
      setImportError('請先至「設定」頁面輸入 API Key 才能使用自動匯入。')
      return
    }
    setImporting(true)
    setImportError(null)
    try {
      const result = await importCardFromUrl(importUrl.trim(), apiKey, provider)
      applyImportResult(result)
    } catch (err) {
      handleImportError(err)
    } finally {
      setImporting(false)
    }
  }

  async function handleHtmlImport() {
    if (!manualHtml.trim()) return
    if (!apiKey) {
      setImportError('請先至「設定」頁面輸入 API Key 才能使用自動匯入。')
      return
    }
    setImporting(true)
    setImportError(null)
    try {
      const result = await importCardFromHtml(manualHtml, apiKey, provider)
      applyImportResult(result)
    } catch (err) {
      handleImportError(err)
    } finally {
      setImporting(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !baseRate) return
    const monthlyCap: Card['monthlyCap'] = {}
    if (rewardCap) monthlyCap.rewardLimit = parseInt(rewardCap, 10)
    if (spendCap) monthlyCap.spendLimit = parseInt(spendCap, 10)
    onSave({
      id: card?.id ?? genId(),
      name: name.trim(),
      bankUrl: bankUrl.trim(),
      baseRate: parseFloat(baseRate),
      monthlyCap,
      storeBonus: bonuses,
      validFrom: validFrom || undefined,
      validTo: validTo || undefined,
    })
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 focus:outline-none"
  const panelStyle = { background: '#1a1208', border: '1px solid #2e2210' }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onCancel}
          className="text-sm transition-colors flex items-center gap-1"
          style={{ color: '#c8901a' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          返回
        </button>
        <h1 className="text-lg font-semibold text-[#f2e8c9]">{card ? '編輯卡片' : '新增卡片'}</h1>
      </div>

      {/* ── Import from URL panel ── */}
      {!card && (
        <div className="mb-4">
          {!showImportPanel ? (
            <button
              type="button"
              onClick={() => { setShowImportPanel(true); setImportError(null); setMissingFields([]) }}
              className="w-full border border-dashed text-sm py-2.5 rounded-xl transition-colors"
              style={{ borderColor: '#c8901a', color: '#c8901a' }}
            >
              從銀行活動網址自動匯入
            </button>
          ) : (
            <div className="beast-card rounded-xl p-4 space-y-3"
              style={{ background: '#181308', border: '1px solid #3a2810' }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#c8901a]">從活動網址匯入（{provider === 'gemini' ? 'Gemini' : 'Claude'}）</p>
                <button type="button"
                  onClick={() => { setShowImportPanel(false); setImportError(null) }}
                  className="text-xs text-[#5a3f1a]">關閉</button>
              </div>

              {!apiKey && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: '#1a1005', border: '1px solid #5a3010', color: '#c8841a' }}>
                  請先至「設定」頁面輸入 API Key 才能使用自動匯入。
                </p>
              )}

              <input
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder="貼入銀行活動頁面網址 https://..."
                type="url"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleUrlImport}
                disabled={importing || !importUrl.trim() || !apiKey}
                className="w-full text-sm py-2 rounded font-medium transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}
              >
                {importing ? '擷取中…' : '自動擷取'}
              </button>

              <button
                type="button"
                onClick={() => setShowHtmlFallback(v => !v)}
                className="text-xs underline"
                style={{ color: '#5a3f1a' }}
              >
                {showHtmlFallback ? '收起' : '網址無法抓取？手動貼入頁面 HTML'}
              </button>
              {showHtmlFallback && (
                <div className="space-y-2">
                  <textarea
                    value={manualHtml}
                    onChange={e => setManualHtml(e.target.value)}
                    placeholder="將銀行活動頁面的 HTML 原始碼貼於此處…"
                    rows={5}
                    className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleHtmlImport}
                    disabled={importing || !manualHtml.trim() || !apiKey}
                    className="w-full text-sm py-2 rounded font-medium border transition-all disabled:opacity-30"
                    style={{ borderColor: '#3a2810', color: '#7a5c2a', background: '#141008' }}
                  >
                    {importing ? '解析中…' : '解析 HTML'}
                  </button>
                </div>
              )}

              {importError && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: '#1a0808', border: '1px solid #5a1010', color: '#c0392b' }}>
                  {importError}
                </p>
              )}
            </div>
          )}

          {missingFields.length > 0 && (
            <p className="mt-2 text-xs rounded-lg px-3 py-2"
              style={{ background: '#1a1005', border: '1px solid #5a3010', color: '#c8841a' }}>
              以下欄位未能自動填入，請手動補完：{missingFields.join('、')}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Basic info ── */}
        <div className="beast-card rounded-xl p-4 space-y-3" style={panelStyle}>
          <div>
            <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">卡片名稱</label>
            <input value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="例：國泰 Cube" className={inputClass} />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['國泰 Cube', '吉鶴卡', '全支付', 'Line Bank'].map(n => (
                <button key={n} type="button" onClick={() => handleNameChange(n)}
                  className="text-xs px-2 py-0.5 rounded transition-colors"
                  style={{ background: 'rgba(200,144,26,0.1)', color: '#b89444', border: '1px solid rgba(200,144,26,0.2)' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">銀行活動頁面連結（選填）</label>
            <input value={bankUrl} onChange={e => setBankUrl(e.target.value)}
              placeholder="https://..." type="url" className={inputClass} />
          </div>

          <div>
            <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">海外一般回饋 %</label>
            <input value={baseRate} onChange={e => setBaseRate(e.target.value)}
              type="number" step="0.1" min="0" max="100" placeholder="例：3" className={inputClass} />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">每月回饋上限（NT$）</label>
              <input value={rewardCap} onChange={e => setRewardCap(e.target.value)}
                type="number" min="0" placeholder="例：1500" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">每月消費上限（NT$）</label>
              <input value={spendCap} onChange={e => setSpendCap(e.target.value)}
                type="number" min="0" placeholder="例：50000" className={inputClass} />
            </div>
          </div>

          {/* task 4.3: validFrom / validTo */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">活動開始日（選填）</label>
              <input value={validFrom} onChange={e => setValidFrom(e.target.value)}
                type="date" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#7a5c2a] block mb-1 uppercase tracking-wider">活動結束日（選填）</label>
              <input value={validTo} onChange={e => setValidTo(e.target.value)}
                type="date" className={inputClass} />
            </div>
          </div>
        </div>

        {/* ── Store bonus rules ── */}
        <div className="beast-card rounded-xl p-4" style={panelStyle}>
          <h3 className="text-xs font-semibold text-[#7a5c2a] mb-3 uppercase tracking-widest">特定店家加碼</h3>

          {bonuses.map((b, i) => (
            <div key={i} className="mb-3 pb-3" style={{ borderBottom: '1px solid #2e2210' }}>
              <div className="flex items-start justify-between">
                <div className="text-sm flex-1 min-w-0">
                  <span className="font-medium text-[#f2e8c9]">{b.storeName}</span>
                  <span className="text-[#7a5c2a] ml-2">
                    {b.rate}% · 上限 NT${b.cap.toLocaleString()}
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(200,144,26,0.1)', color: '#8a6f28' }}>
                      {b.capPeriod === 'period' ? '活動期間' : '每月'}
                    </span>
                  </span>
                  {/* store aliases chips */}
                  {b.stores.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {b.stores.map(s => (
                        <span key={s} className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(90,63,26,0.3)', color: '#b89444', border: '1px solid #3a2810' }}>
                          {s}
                          <button type="button" onClick={() => removeAlias(i, s)}
                            className="ml-0.5 opacity-60 hover:opacity-100 text-[10px]">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-2 shrink-0">
                  <button type="button"
                    onClick={() => { setExpandedAliasIdx(expandedAliasIdx === i ? null : i); setNewAliasInput('') }}
                    className="text-xs transition-colors" style={{ color: '#c8901a' }}>
                    {expandedAliasIdx === i ? '收起' : '＋店家'}
                  </button>
                  <button type="button" onClick={() => removeBonus(i)}
                    className="text-xs transition-colors" style={{ color: '#8b1a1a' }}>刪除</button>
                </div>
              </div>

              {/* task 4.2: store alias management inline */}
              {expandedAliasIdx === i && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={newAliasInput}
                    onChange={e => setNewAliasInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAlias(i) } }}
                    placeholder="輸入實際店家名稱"
                    className="flex-1 border rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                  <button type="button" onClick={() => addAlias(i)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{ background: '#2e2210', color: '#b89444', border: '1px solid #3a2810' }}>
                    加入
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* New bonus form */}
          <div className="mt-2 space-y-2">
            <input
              value={newBonusStore}
              onChange={e => setNewBonusStore(e.target.value)}
              placeholder="通路名稱（例：熱門商店）"
              className={inputClass + ' text-sm'}
            />
            <div className="flex gap-2">
              <input value={newBonusRate} onChange={e => setNewBonusRate(e.target.value)}
                type="number" step="0.1" min="0" placeholder="加碼 %"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              <input value={newBonusCap} onChange={e => setNewBonusCap(e.target.value)}
                type="number" min="0" placeholder="上限 NT$"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            {/* task 4.1: capPeriod selector */}
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setNewBonusCapPeriod('monthly')}
                className="flex-1 py-1.5 rounded text-xs border transition-all"
                style={newBonusCapPeriod === 'monthly'
                  ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a' }
                  : { background: 'transparent', color: '#7a5c2a', borderColor: '#3a2810' }}>
                每月重置
              </button>
              <button type="button"
                onClick={() => setNewBonusCapPeriod('period')}
                className="flex-1 py-1.5 rounded text-xs border transition-all"
                style={newBonusCapPeriod === 'period'
                  ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a' }
                  : { background: 'transparent', color: '#7a5c2a', borderColor: '#3a2810' }}>
                活動期間
              </button>
              <button type="button" onClick={addBonus}
                className="text-sm px-3 py-1.5 rounded transition-colors"
                style={{ background: '#2e2210', color: '#b89444', border: '1px solid #3a2810' }}>
                新增
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pb-4">
          <button type="submit" disabled={!name.trim() || !baseRate}
            className="flex-1 rounded-lg py-3 font-semibold text-sm tracking-wider transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}>
            儲存
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-lg py-3 text-sm border transition-colors"
            style={{ borderColor: '#3a2810', color: '#7a5c2a' }}>
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
