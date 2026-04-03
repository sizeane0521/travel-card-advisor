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
  const [bonuses, setBonuses] = useState<StoreBonus[]>(card?.storeBonus ?? [])
  const [newBonusStore, setNewBonusStore] = useState('')
  const [newBonusRate, setNewBonusRate] = useState('')
  const [newBonusCap, setNewBonusCap] = useState('')

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
      rate: parseFloat(newBonusRate),
      cap: parseInt(newBonusCap, 10),
    }])
    setNewBonusStore('')
    setNewBonusRate('')
    setNewBonusCap('')
  }

  function removeBonus(idx: number) {
    setBonuses(prev => prev.filter((_, i) => i !== idx))
  }

  function applyImportResult(result: CardImportResult) {
    const missing: string[] = []
    if (result.cardName) setName(result.cardName); else missing.push('卡片名稱')
    if (result.baseRate !== null) setBaseRate(String(result.baseRate)); else missing.push('海外回饋率')
    if (result.rewardCap !== null) setRewardCap(String(result.rewardCap))
    if (result.spendCap !== null) setSpendCap(String(result.spendCap))
    if (result.rewardCap === null && result.spendCap === null) missing.push('每月上限金額')
    if (result.storeRules.length > 0) {
      setBonuses(result.storeRules.map(r => ({
        storeName: r.storeName,
        rate: r.bonusRate,
        cap: r.spendCap,
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
    // Task 4.3: check key from context
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
    })
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onCancel} className="text-blue-500 text-sm">← 返回</button>
        <h1 className="text-lg font-semibold text-gray-900">{card ? '編輯卡片' : '新增卡片'}</h1>
      </div>

      {/* Import from URL panel (new cards only) */}
      {!card && (
        <div className="mb-4">
          {!showImportPanel ? (
            <button
              type="button"
              onClick={() => { setShowImportPanel(true); setImportError(null); setMissingFields([]) }}
              className="w-full border border-dashed border-blue-400 text-blue-600 text-sm py-2.5 rounded-xl"
            >
              🔗 從銀行活動網址自動匯入
            </button>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-800">從活動網址匯入（{provider === 'gemini' ? 'Gemini' : 'Claude'}）</p>
                <button type="button" onClick={() => { setShowImportPanel(false); setImportError(null) }} className="text-gray-400 text-xs">關閉</button>
              </div>

              {!apiKey && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  請先至「設定」頁面輸入 API Key 才能使用自動匯入。
                </p>
              )}

              <input
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder="貼入銀行活動頁面網址 https://..."
                type="url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={handleUrlImport}
                disabled={importing || !importUrl.trim() || !apiKey}
                className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg disabled:opacity-40"
              >
                {importing ? '擷取中…' : '自動擷取'}
              </button>

              <button
                type="button"
                onClick={() => setShowHtmlFallback(v => !v)}
                className="text-xs text-gray-500 underline"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleHtmlImport}
                    disabled={importing || !manualHtml.trim() || !apiKey}
                    className="w-full bg-gray-700 text-white text-sm py-2 rounded-lg disabled:opacity-40"
                  >
                    {importing ? '解析中…' : '解析 HTML'}
                  </button>
                </div>
              )}

              {importError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{importError}</p>
              )}
            </div>
          )}

          {missingFields.length > 0 && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              以下欄位未能自動填入，請手動補完：{missingFields.join('、')}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">卡片名稱</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="例：國泰 Cube"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['國泰 Cube', '吉鶴卡', '全支付', 'Line Bank'].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNameChange(n)}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">銀行活動頁面連結（選填）</label>
            <input
              value={bankUrl}
              onChange={e => setBankUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">海外一般回饋 %</label>
            <input
              value={baseRate}
              onChange={e => setBaseRate(e.target.value)}
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="例：3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">每月回饋上限（選填）NT$</label>
            <input
              value={rewardCap}
              onChange={e => setRewardCap(e.target.value)}
              type="number"
              min="0"
              placeholder="例：1500（最多拿 NT$1,500 回饋）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">每月消費金額上限（選填）NT$</label>
            <input
              value={spendCap}
              onChange={e => setSpendCap(e.target.value)}
              type="number"
              min="0"
              placeholder="例：50000（超過後改以基本回饋計算）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Store bonus rules */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">特定店家加碼</h3>

          {bonuses.map((b, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="text-sm">
                <span className="font-medium text-gray-800">{b.storeName}</span>
                <span className="text-gray-500 ml-2">{b.rate}% · 上限 NT${b.cap.toLocaleString()}</span>
              </div>
              <button type="button" onClick={() => removeBonus(i)} className="text-red-400 text-xs">刪除</button>
            </div>
          ))}

          <div className="mt-3 space-y-2">
            <input
              value={newBonusStore}
              onChange={e => setNewBonusStore(e.target.value)}
              placeholder="店家名稱（例：唐吉軻德）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-2">
              <input
                value={newBonusRate}
                onChange={e => setNewBonusRate(e.target.value)}
                type="number"
                step="0.1"
                min="0"
                placeholder="加碼 %"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                value={newBonusCap}
                onChange={e => setNewBonusCap(e.target.value)}
                type="number"
                min="0"
                placeholder="消費上限 NT$"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={addBonus}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm"
              >
                新增
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pb-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium">儲存</button>
          <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-3">取消</button>
        </div>
      </form>
    </div>
  )
}
