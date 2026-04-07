import { useState } from 'react'
import type { Card, StoreBonus, PaymentMethodBonus, PaymentMethodBonusTier } from '../types'
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
      subCategories: b.subCategories ?? [],
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

  // Sub-category management
  const [expandedSubCatIdx, setExpandedSubCatIdx] = useState<number | null>(null)
  const [newSubCatLabel, setNewSubCatLabel] = useState('')
  const [newSubCatStores, setNewSubCatStores] = useState<Record<number, string>>({})

  // Payment method bonus state
  const existingPmb = card?.paymentMethodBonus
  const [pmBonusEnabled, setPmBonusEnabled] = useState(!!existingPmb)
  const [pmMethods, setPmMethods] = useState<('apple_pay' | 'google_pay')[]>(
    existingPmb?.methods ?? ['apple_pay', 'google_pay']
  )
  const [pmTiers, setPmTiers] = useState<PaymentMethodBonusTier[]>(
    existingPmb?.tiers ?? []
  )
  // New tier form state
  const [newTierRate, setNewTierRate] = useState('')
  const [newTierCap, setNewTierCap] = useState('')
  const [newTierPrereq, setNewTierPrereq] = useState('')
  const [newTierPrereqMet, setNewTierPrereqMet] = useState(false)

  // Import panel state
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [showHtmlFallback, setShowHtmlFallback] = useState(false)
  const [manualHtml, setManualHtml] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])

  function togglePmMethod(method: 'apple_pay' | 'google_pay') {
    setPmMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    )
  }

  function addPmTier() {
    if (!newTierRate || !newTierCap) return
    const tier: PaymentMethodBonusTier = {
      rate: parseFloat(newTierRate),
      monthlyCap: parseInt(newTierCap, 10),
    }
    if (newTierPrereq.trim()) {
      tier.prerequisite = newTierPrereq.trim()
      tier.prerequisiteMet = newTierPrereqMet
    }
    setPmTiers(prev => [...prev, tier])
    setNewTierRate('')
    setNewTierCap('')
    setNewTierPrereq('')
    setNewTierPrereqMet(false)
  }

  function removePmTier(idx: number) {
    setPmTiers(prev => prev.filter((_, i) => i !== idx))
  }

  function toggleTierPrereqMet(idx: number) {
    setPmTiers(prev => prev.map((t, i) =>
      i === idx ? { ...t, prerequisiteMet: !t.prerequisiteMet } : t
    ))
  }

  function buildPaymentMethodBonus(): PaymentMethodBonus | undefined {
    if (!pmBonusEnabled || pmTiers.length === 0 || pmMethods.length === 0) return undefined
    return { methods: pmMethods, tiers: pmTiers }
  }

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
      subCategories: [],
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
    if (expandedSubCatIdx === idx) setExpandedSubCatIdx(null)
  }

  function addSubCategory(bonusIdx: number) {
    const label = newSubCatLabel.trim()
    if (!label) return
    setBonuses(prev => prev.map((b, i) =>
      i === bonusIdx
        ? { ...b, subCategories: [...(b.subCategories ?? []), { label, stores: [] }] }
        : b
    ))
    setNewSubCatLabel('')
  }

  function removeSubCategory(bonusIdx: number, subIdx: number) {
    setBonuses(prev => prev.map((b, i) =>
      i === bonusIdx
        ? { ...b, subCategories: (b.subCategories ?? []).filter((_, si) => si !== subIdx) }
        : b
    ))
  }

  function addSubCatStore(bonusIdx: number, subIdx: number) {
    const store = (newSubCatStores[subIdx] ?? '').trim()
    if (!store) return
    setBonuses(prev => prev.map((b, i) => {
      if (i !== bonusIdx) return b
      const subs = (b.subCategories ?? []).map((sc, si) =>
        si === subIdx && !sc.stores.includes(store)
          ? { ...sc, stores: [...sc.stores, store] }
          : sc
      )
      return { ...b, subCategories: subs }
    }))
    setNewSubCatStores(prev => ({ ...prev, [subIdx]: '' }))
  }

  function removeSubCatStore(bonusIdx: number, subIdx: number, store: string) {
    setBonuses(prev => prev.map((b, i) => {
      if (i !== bonusIdx) return b
      const subs = (b.subCategories ?? []).map((sc, si) =>
        si === subIdx ? { ...sc, stores: sc.stores.filter(s => s !== store) } : sc
      )
      return { ...b, subCategories: subs }
    }))
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
        subCategories: [],
        rate: r.bonusRate,
        cap: r.spendCap,
        capPeriod: r.capPeriod,
      })))
    }
    if (result.paymentMethodBonusTiers && result.paymentMethodBonusTiers.length > 0) {
      setPmBonusEnabled(true)
      setPmMethods(['apple_pay', 'google_pay'])
      setPmTiers(result.paymentMethodBonusTiers.map(t => ({
        rate: t.rate,
        monthlyCap: t.monthlyCap,
        prerequisite: t.prerequisite ?? undefined,
        prerequisiteMet: false,
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
      paymentMethodBonus: buildPaymentMethodBonus(),
      validFrom: validFrom || undefined,
      validTo: validTo || undefined,
    })
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 focus:outline-none"
  const panelStyle = { background: '#1a1208', border: '1px solid #4a3418' }

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
                  className="text-xs text-[#9a7040]">關閉</button>
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
                style={{ color: '#9a7040' }}
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
                    style={{ borderColor: '#3a2810', color: '#c8a060', background: '#141008' }}
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
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">卡片名稱</label>
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
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">銀行活動頁面連結（選填）</label>
            <input value={bankUrl} onChange={e => setBankUrl(e.target.value)}
              placeholder="https://..." type="url" className={inputClass} />
          </div>

          <hr style={{ borderColor: '#3a2810', margin: '4px 0' }} />

          <div>
            <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">海外一般回饋 %</label>
            <input value={baseRate} onChange={e => setBaseRate(e.target.value)}
              type="number" step="0.1" min="0" max="100" placeholder="例：3" className={inputClass} />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">每月回饋上限（NT$）</label>
              <input value={rewardCap} onChange={e => setRewardCap(e.target.value)}
                type="number" min="0" placeholder="例：1500" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">每月消費上限（NT$）</label>
              <input value={spendCap} onChange={e => setSpendCap(e.target.value)}
                type="number" min="0" placeholder="例：50000" className={inputClass} />
            </div>
          </div>

          <hr style={{ borderColor: '#3a2810', margin: '4px 0' }} />

          {/* task 4.3: validFrom / validTo */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">活動開始日（選填）</label>
              <input value={validFrom} onChange={e => setValidFrom(e.target.value)}
                type="date" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#c8a060] block mb-1 uppercase tracking-wider">活動結束日（選填）</label>
              <input value={validTo} onChange={e => setValidTo(e.target.value)}
                type="date" className={inputClass} />
            </div>
          </div>
        </div>

        {/* ── Store bonus rules ── */}
        <div className="beast-card rounded-xl p-4" style={panelStyle}>
          <h3 className="text-sm font-semibold text-[#d4a017] mb-3 pl-3 uppercase tracking-widest"
            style={{ borderLeft: '3px solid #c8901a' }}>特定店家加碼</h3>

          {bonuses.map((b, i) => (
            <div key={i} className="mb-3 pb-3" style={{ borderBottom: '1px solid #3d2e14' }}>
              <div className="flex items-start justify-between">
                <div className="text-sm flex-1 min-w-0">
                  <span className="font-medium text-[#f2e8c9]">{b.storeName}</span>
                  <span className="text-[#c8a060] ml-2">
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
                  <button type="button"
                    onClick={() => { setExpandedSubCatIdx(expandedSubCatIdx === i ? null : i); setNewSubCatLabel('') }}
                    className="text-xs transition-colors" style={{ color: '#7aade2' }}>
                    {expandedSubCatIdx === i ? '收起' : '＋分類'}
                  </button>
                  <button type="button" onClick={() => removeBonus(i)}
                    className="text-xs transition-colors" style={{ color: '#8b1a1a' }}>刪除</button>
                </div>
              </div>

              {/* Store alias management */}
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
                    style={{ background: '#3d2e14', color: '#b89444', border: '1px solid #3a2810' }}>
                    加入
                  </button>
                </div>
              )}

              {/* Sub-category management */}
              {expandedSubCatIdx === i && (
                <div className="mt-2 space-y-2">
                  {/* Existing sub-categories */}
                  {(b.subCategories ?? []).map((sub, si) => (
                    <div key={si} className="rounded-lg p-2" style={{ background: '#0e0c06', border: '1px solid #3d2e14' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: '#d4a017' }}>{sub.label}</span>
                        <button type="button" onClick={() => removeSubCategory(i, si)}
                          className="text-[10px]" style={{ color: '#8b1a1a' }}>刪除分類</button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {sub.stores.map(s => (
                          <span key={s} className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(74,174,226,0.1)', color: '#4aade2', border: '1px solid rgba(74,174,226,0.25)' }}>
                            {s}
                            <button type="button" onClick={() => removeSubCatStore(i, si, s)}
                              className="ml-0.5 opacity-60 hover:opacity-100 text-[10px]">✕</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input
                          value={newSubCatStores[si] ?? ''}
                          onChange={e => setNewSubCatStores(prev => ({ ...prev, [si]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubCatStore(i, si) } }}
                          placeholder="新增店家"
                          className="flex-1 border rounded px-2 py-0.5 text-xs focus:outline-none"
                        />
                        <button type="button" onClick={() => addSubCatStore(i, si)}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: '#1e2a3a', color: '#4aade2', border: '1px solid rgba(74,174,226,0.3)' }}>
                          加入
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* New sub-category form */}
                  <div className="flex gap-2">
                    <input
                      value={newSubCatLabel}
                      onChange={e => setNewSubCatLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubCategory(i) } }}
                      placeholder="分類名稱（例：便利商店）"
                      className="flex-1 border rounded-lg px-2 py-1 text-xs focus:outline-none"
                    />
                    <button type="button" onClick={() => addSubCategory(i)}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ background: '#1e2a3a', color: '#4aade2', border: '1px solid rgba(74,174,226,0.3)' }}>
                      新增分類
                    </button>
                  </div>
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
                  : { background: 'transparent', color: '#c8a060', borderColor: '#3a2810' }}>
                每月重置
              </button>
              <button type="button"
                onClick={() => setNewBonusCapPeriod('period')}
                className="flex-1 py-1.5 rounded text-xs border transition-all"
                style={newBonusCapPeriod === 'period'
                  ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a' }
                  : { background: 'transparent', color: '#c8a060', borderColor: '#3a2810' }}>
                活動期間
              </button>
              <button type="button" onClick={addBonus}
                className="text-sm px-3 py-1.5 rounded transition-colors"
                style={{ background: '#3d2e14', color: '#b89444', border: '1px solid #3a2810' }}>
                新增
              </button>
            </div>
          </div>
        </div>

        {/* ── Payment method bonus ── */}
        <div className="beast-card rounded-xl p-4" style={panelStyle}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#d4a017] pl-3 uppercase tracking-widest"
              style={{ borderLeft: '3px solid #c8901a' }}>行動支付加碼</h3>
            <button
              type="button"
              onClick={() => setPmBonusEnabled(v => !v)}
              className="text-xs px-3 py-1 rounded-lg border transition-all"
              style={pmBonusEnabled
                ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600 }
                : { background: 'transparent', color: '#c8a060', borderColor: '#4a3418' }}
            >
              {pmBonusEnabled ? '啟用中' : '未啟用'}
            </button>
          </div>

          {pmBonusEnabled && (
            <div className="space-y-4">
              {/* Supported payment methods */}
              <div>
                <p className="text-xs text-[#c8a060] mb-2 uppercase tracking-wider">適用付款方式</p>
                <div className="flex gap-2">
                  {(['apple_pay', 'google_pay'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => togglePmMethod(m)}
                      className="flex-1 py-1.5 rounded text-xs border transition-all"
                      style={pmMethods.includes(m)
                        ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a' }
                        : { background: 'transparent', color: '#c8a060', borderColor: '#3a2810' }}
                    >
                      {m === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Existing tiers */}
              {pmTiers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#c8a060] uppercase tracking-wider">加碼層級</p>
                  {pmTiers.map((tier, idx) => (
                    <div key={idx} className="rounded-lg p-3 space-y-2"
                      style={{ background: '#141008', border: '1px solid #3d2e14' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#f2e8c9]">
                          +{tier.rate}%・月上限 NT${tier.monthlyCap.toLocaleString()}
                        </span>
                        <button type="button" onClick={() => removePmTier(idx)}
                          className="text-xs" style={{ color: '#8b1a1a' }}>刪除</button>
                      </div>
                      {tier.prerequisite && (
                        <div className="space-y-1">
                          <p className="text-xs" style={{ color: '#9a7040' }}>條件：{tier.prerequisite}</p>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tier.prerequisiteMet ?? false}
                              onChange={() => toggleTierPrereqMet(idx)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="text-xs text-[#c8a060]">我目前符合此條件</span>
                              <span className="block text-xs mt-0.5" style={{ color: '#9a5020' }}>
                                每月初請確認條件是否仍符合
                              </span>
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* New tier form */}
              <div className="space-y-2">
                <p className="text-xs text-[#c8a060] uppercase tracking-wider">新增加碼層級</p>
                <div className="flex gap-2">
                  <input
                    value={newTierRate}
                    onChange={e => setNewTierRate(e.target.value)}
                    type="number" step="0.1" min="0" placeholder="加碼 %"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    value={newTierCap}
                    onChange={e => setNewTierCap(e.target.value)}
                    type="number" min="0" placeholder="月上限 NT$"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <input
                  value={newTierPrereq}
                  onChange={e => setNewTierPrereq(e.target.value)}
                  placeholder="前置條件（選填，例：前月帳單達3萬元）"
                  className={inputClass + ' text-sm'}
                />
                {newTierPrereq.trim() && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTierPrereqMet}
                      onChange={e => setNewTierPrereqMet(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="text-xs text-[#c8a060]">我目前符合此條件</span>
                      <span className="block text-xs mt-0.5" style={{ color: '#9a5020' }}>
                        每月初請確認條件是否仍符合
                      </span>
                    </span>
                  </label>
                )}
                <button
                  type="button"
                  onClick={addPmTier}
                  disabled={!newTierRate || !newTierCap}
                  className="w-full text-sm py-1.5 rounded border transition-all disabled:opacity-30"
                  style={{ background: '#3d2e14', color: '#b89444', border: '1px solid #3a2810' }}
                >
                  ＋ 新增層級
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pb-4">
          <button type="submit" disabled={!name.trim() || !baseRate}
            className="flex-1 rounded-lg py-3 font-semibold text-sm tracking-wider transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}>
            儲存
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-lg py-3 text-sm border transition-colors"
            style={{ borderColor: '#3a2810', color: '#c8a060' }}>
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
