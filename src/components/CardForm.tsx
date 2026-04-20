import { useState, useRef } from 'react'
import type { Card, StoreBonus, PaymentMethodBonus, PaymentMethodBonusTier } from '../types'
import DatePicker from './DatePicker'
import { importCardFromUrl, importCardFromHtml, importCardFromImage } from '../lib/cardImport'
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
  const [newUserBonuses, setNewUserBonuses] = useState<StoreBonus[]>(
    (card?.newUserBonus ?? []).map(b => ({
      ...b,
      stores: b.stores ?? [],
      subCategories: b.subCategories ?? [],
      capPeriod: b.capPeriod ?? 'monthly',
    }))
  )

  // New bonus form state (store bonuses)
  const [newBonusStore, setNewBonusStore] = useState('')
  const [newBonusRate, setNewBonusRate] = useState('')
  const [newBonusCap, setNewBonusCap] = useState('')
  const [newBonusCapPeriod, setNewBonusCapPeriod] = useState<'monthly' | 'period'>('monthly')

  // New user bonus form state
  const [newNubBonusStore, setNewNubBonusStore] = useState('')
  const [newNubBonusRate, setNewNubBonusRate] = useState('')
  const [newNubBonusCap, setNewNubBonusCap] = useState('')
  const [newNubBonusCapPeriod, setNewNubBonusCapPeriod] = useState<'monthly' | 'period'>('monthly')

  // Task 1.2: Unified group editor state
  // key format: `${type}-${bonusIdx}-${subIdx}` or `${type}-${bonusIdx}-default`
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null)

  // Task 1.3: Group editor inputs
  const [newGroupStoreInput, setNewGroupStoreInput] = useState('')
  const [editingGroupLabel, setEditingGroupLabel] = useState('')

  // Task 1.4: +分類 inline form state
  const [addingSubCatForBonusIdx, setAddingSubCatForBonusIdx] = useState<{ type: 'store' | 'nub'; idx: number } | null>(null)
  const [newSubCatNameInput, setNewSubCatNameInput] = useState('')

  // Payment method bonus state
  const existingPmb = card?.paymentMethodBonus
  const [pmBonusEnabled, setPmBonusEnabled] = useState(!!existingPmb)
  const [pmMethods, setPmMethods] = useState<('apple_pay' | 'google_pay')[]>(
    existingPmb?.methods ?? ['apple_pay', 'google_pay']
  )
  const [pmTiers, setPmTiers] = useState<PaymentMethodBonusTier[]>(
    existingPmb?.tiers ?? []
  )
  const [newTierRate, setNewTierRate] = useState('')
  const [newTierCap, setNewTierCap] = useState('')
  const [newTierPrereq, setNewTierPrereq] = useState('')
  const [newTierPrereqMet, setNewTierPrereqMet] = useState(false)

  // Add bonus form visibility state
  const [showAddStoreForm, setShowAddStoreForm] = useState(false)
  const [showAddNubForm, setShowAddNubForm] = useState(false)

  // Section focus state for active border highlight
  const [focusedSection, setFocusedSection] = useState<string | null>(null)

  function sectionStyle(id: string) {
    const isActive = focusedSection === id
    return {
      
      
      background: 'var(--color-bg-surface)',
      border: `1px solid ${isActive ? 'var(--color-secondary)' : 'var(--color-border)'}`,
      boxShadow: isActive ? '0 0 0 2px rgba(245,166,35,0.15)' : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }
  }

  function handleSectionFocus(id: string) { setFocusedSection(id) }
  function handleSectionBlur(e: React.FocusEvent<HTMLDivElement>, id: string) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setFocusedSection(prev => prev === id ? null : prev)
    }
  }

  // Import panel state
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [showHtmlFallback, setShowHtmlFallback] = useState(false)
  const [manualHtml, setManualHtml] = useState('')
  const [importImage, setImportImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Payment method bonus helpers ─────────────────────────────────────────

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

  function updatePmTier(idx: number, patch: Partial<PaymentMethodBonusTier>) {
    setPmTiers(prev => prev.map((t, i) => i === idx ? { ...t, ...patch } : t))
  }

  function buildPaymentMethodBonus(): PaymentMethodBonus | undefined {
    if (!pmBonusEnabled || pmTiers.length === 0 || pmMethods.length === 0) return undefined
    return { methods: pmMethods, tiers: pmTiers }
  }

  // ── Basic field helpers ───────────────────────────────────────────────────

  function handleNameChange(v: string) {
    setName(v)
    if (!bankUrl) {
      const match = Object.entries(DEFAULT_BANK_URLS).find(([k]) => v.includes(k.split(' ')[0]))
      if (match) setBankUrl(match[1])
    }
  }

  // ── Store bonus top-level helpers ─────────────────────────────────────────

  function getList(type: 'store' | 'nub') {
    return type === 'store' ? bonuses : newUserBonuses
  }

  function setList(type: 'store' | 'nub', updater: (prev: StoreBonus[]) => StoreBonus[]) {
    if (type === 'store') setBonuses(updater)
    else setNewUserBonuses(updater)
  }

  function updateBonus(type: 'store' | 'nub', idx: number, patch: Partial<StoreBonus>) {
    setList(type, prev => prev.map((b, i) => i === idx ? { ...b, ...patch } : b))
  }

  function addBonus(type: 'store' | 'nub') {
    const [store, rate, cap, period] = type === 'store'
      ? [newBonusStore, newBonusRate, newBonusCap, newBonusCapPeriod]
      : [newNubBonusStore, newNubBonusRate, newNubBonusCap, newNubBonusCapPeriod]
    if (!store.trim() || !rate || !cap) return
    const entry: StoreBonus = {
      storeName: store.trim(),
      stores: [],
      subCategories: [],
      rate: parseFloat(rate),
      cap: parseInt(cap, 10),
      capPeriod: period,
    }
    setList(type, prev => [...prev, entry])
    if (type === 'store') { setNewBonusStore(''); setNewBonusRate(''); setNewBonusCap(''); setNewBonusCapPeriod('monthly') }
    else { setNewNubBonusStore(''); setNewNubBonusRate(''); setNewNubBonusCap(''); setNewNubBonusCapPeriod('monthly') }
  }

  function removeBonus(type: 'store' | 'nub', idx: number) {
    setList(type, prev => prev.filter((_, i) => i !== idx))
    if (expandedGroupKey?.startsWith(`${type}-${idx}-`)) setExpandedGroupKey(null)
    if (addingSubCatForBonusIdx?.type === type && addingSubCatForBonusIdx.idx === idx) setAddingSubCatForBonusIdx(null)
  }

  // ── Task 2.1: Group editor open ───────────────────────────────────────────

  function openGroupEditor(key: string, initialLabel: string) {
    setExpandedGroupKey(key)
    setEditingGroupLabel(initialLabel)
    setNewGroupStoreInput('')
    setAddingSubCatForBonusIdx(null)
  }

  // ── Task 2.2: Add store to open group ─────────────────────────────────────

  function addStoreToGroup(type: 'store' | 'nub', bonusIdx: number, subIdx: number | null) {
    const store = newGroupStoreInput.trim()
    if (!store) return
    setList(type, prev => prev.map((b, i) => {
      if (i !== bonusIdx) return b
      if (subIdx === null) {
        return b.stores.includes(store) ? b : { ...b, stores: [...b.stores, store] }
      }
      const subs = (b.subCategories ?? []).map((sc, si) =>
        si === subIdx && !sc.stores.includes(store)
          ? { ...sc, stores: [...sc.stores, store] }
          : sc
      )
      return { ...b, subCategories: subs }
    }))
    setNewGroupStoreInput('')
  }

  // ── Task 2.3: Remove store from group ─────────────────────────────────────

  function removeStoreFromGroup(type: 'store' | 'nub', bonusIdx: number, subIdx: number | null, store: string) {
    setList(type, prev => prev.map((b, i) => {
      if (i !== bonusIdx) return b
      if (subIdx === null) {
        return { ...b, stores: b.stores.filter(s => s !== store) }
      }
      const subs = (b.subCategories ?? []).map((sc, si) =>
        si === subIdx ? { ...sc, stores: sc.stores.filter(s => s !== store) } : sc
      )
      return { ...b, subCategories: subs }
    }))
  }

  // ── Task 2.4: Rename subcategory ──────────────────────────────────────────

  function renameSubCategory(type: 'store' | 'nub', bonusIdx: number, subIdx: number, label: string) {
    setList(type, prev => prev.map((b, i) => {
      if (i !== bonusIdx) return b
      const subs = (b.subCategories ?? []).map((sc, si) =>
        si === subIdx ? { ...sc, label } : sc
      )
      return { ...b, subCategories: subs }
    }))
  }

  // ── Task 2.5: Delete subcategory ──────────────────────────────────────────

  function deleteSubCategory(type: 'store' | 'nub', bonusIdx: number, subIdx: number) {
    const key = `${type}-${bonusIdx}-${subIdx}`
    if (expandedGroupKey === key) setExpandedGroupKey(null)
    setList(type, prev => prev.map((b, i) => {
      if (i !== bonusIdx) return b
      return { ...b, subCategories: (b.subCategories ?? []).filter((_, si) => si !== subIdx) }
    }))
  }

  // ── Task 2.6: Commit new subcategory ──────────────────────────────────────

  function commitNewSubCategory(type: 'store' | 'nub', bonusIdx: number) {
    const label = newSubCatNameInput.trim()
    if (!label) return
    let newSubIdx = 0
    setList(type, prev => prev.map((b, i) => {
      if (i !== bonusIdx) return b
      newSubIdx = (b.subCategories ?? []).length
      return { ...b, subCategories: [...(b.subCategories ?? []), { label, stores: [] }] }
    }))
    setAddingSubCatForBonusIdx(null)
    setNewSubCatNameInput('')
    // Open the new group's editor
    openGroupEditor(`${type}-${bonusIdx}-${newSubIdx}`, label)
  }

  // ── Image import helpers ──────────────────────────────────────────────────

  function handleImageFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setImportError('圖片超過 5 MB，請縮小截圖後再試。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const comma = dataUrl.indexOf(',')
      const header = dataUrl.slice(0, comma)
      const base64 = dataUrl.slice(comma + 1)
      const mimeType = header.match(/data:(.*);base64/)?.[1] ?? 'image/png'
      setImportImage({ base64, mimeType, preview: dataUrl })
      setImportError(null)
    }
    reader.readAsDataURL(file)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(e.clipboardData.files)
    const imageFile = files.find(f => f.type.startsWith('image/'))
    if (imageFile) {
      e.preventDefault()
      handleImageFile(imageFile)
    }
  }

  async function handleImageImport() {
    if (!importImage) return
    if (!apiKey) {
      setImportError('請先至「設定」頁面輸入 API Key 才能使用自動匯入。')
      return
    }
    setImporting(true)
    setImportError(null)
    try {
      const result = await importCardFromImage(importImage.base64, importImage.mimeType, apiKey, provider)
      applyImportResult(result)
    } catch (err) {
      handleImportError(err)
    } finally {
      setImporting(false)
    }
  }

  // ── Apply import result ───────────────────────────────────────────────────

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
        subCategories: r.subCategories ?? [],
        rate: r.bonusRate,
        cap: r.spendCap,
        capPeriod: r.capPeriod,
        ...(r.prerequisite ? { prerequisite: r.prerequisite, prerequisiteMet: false } : {}),
      })))
    }
    if (result.newUserBonusRules && result.newUserBonusRules.length > 0) {
      setNewUserBonuses(result.newUserBonusRules.map(r => ({
        storeName: r.categoryName,
        stores: r.stores,
        subCategories: r.subCategories ?? [],
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
    if (!bankUrl && importUrl.trim()) setBankUrl(importUrl.trim())
    setShowImportPanel(false)
    setShowHtmlFallback(false)
    setImportUrl('')
    setManualHtml('')
    setImportImage(null)
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
      newUserBonus: newUserBonuses.length > 0 ? newUserBonuses : undefined,
      paymentMethodBonus: buildPaymentMethodBonus(),
      validFrom: validFrom || undefined,
      validTo: validTo || undefined,
    })
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 focus:outline-none"
  const inlineNumStyle = { background: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-muted)' }

  // ── Task 3 & 4 & 5 & 6: Bonus list renderer ──────────────────────────────

  function renderGroupEditor(type: 'store' | 'nub', bonusIdx: number, subIdx: number | null, isDefault: boolean) {
    const currentStores = subIdx === null
      ? getList(type)[bonusIdx]?.stores ?? []
      : getList(type)[bonusIdx]?.subCategories?.[subIdx]?.stores ?? []

    return (
      <div className="mt-1.5 space-y-1.5 rounded-lg p-2"
        style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)' }}>
        {/* Label input – only for named subcategories */}
        {!isDefault && (
          <input
            value={editingGroupLabel}
            onChange={e => {
              setEditingGroupLabel(e.target.value)
              if (subIdx !== null) renameSubCategory(type, bonusIdx, subIdx, e.target.value)
            }}
            placeholder="分類名稱"
            className="w-full border rounded px-2 py-0.5 text-xs focus:outline-none"
          />
        )}
        {/* Store add row */}
        <div className="flex gap-1">
          <input
            value={newGroupStoreInput}
            onChange={e => setNewGroupStoreInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStoreToGroup(type, bonusIdx, subIdx) } }}
            placeholder="輸入店家名稱"
            className="flex-1 min-w-0 border rounded px-2 py-0.5 text-xs focus:outline-none"
          />
          <button type="button" onClick={() => addStoreToGroup(type, bonusIdx, subIdx)}
            className="text-xs px-2 py-0.5 rounded border"
            style={{ color: 'var(--color-text-muted)', borderColor: '#4a3418', background: 'var(--color-bg-surface)' }}>
            加入
          </button>
        </div>
        {/* Current store chips */}
        {currentStores.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {currentStores.map(s => (
              <span key={s} className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(0,185,181,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(0,185,181,0.25)' }}>
                {s}
                <button type="button" onClick={() => removeStoreFromGroup(type, bonusIdx, subIdx, s)}
                  className="ml-0.5 opacity-60 hover:opacity-100 text-[10px]">×</button>
              </span>
            ))}
          </div>
        )}
        {/* Footer actions */}
        <div className="flex items-center justify-between pt-0.5">
          {!isDefault && subIdx !== null ? (
            <button type="button" onClick={() => deleteSubCategory(type, bonusIdx, subIdx)}
              className="text-[10px] px-1.5 py-0.5 rounded border"
              style={{ color: 'var(--color-danger)', borderColor: '#5a1a1a' }}>
              刪除此分類
            </button>
          ) : <span />}
          <button type="button" onClick={() => setExpandedGroupKey(null)}
            className="text-[10px] px-2 py-0.5 rounded border"
            style={{ color: 'var(--color-text-muted)', borderColor: '#4a3418', background: '#1a1208' }}>
            完成
          </button>
        </div>
      </div>
    )
  }

  function renderBonusList(type: 'store' | 'nub') {
    const list = getList(type)
    return list.map((b, bonusIdx) => {
      const hasSubCats = (b.subCategories ?? []).length > 0

      return (
        <div key={bonusIdx} className="rounded-xl p-3"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid #3d2e14',
            ...(b.prerequisite ? { borderLeft: '3px solid var(--color-accent)' } : {}),
          }}>
          {/* Header row: storeName + prereq badge | +分類 刪除 */}
          <div className="flex items-start justify-between">
            <div className="text-sm flex-1 min-w-0">
              <span className="font-medium text-[#f2e8c9]">{b.storeName}</span>
              {b.prerequisite && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(0,185,181,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(0,185,181,0.3)' }}>
                  {b.prerequisite}
                </span>
              )}
              {/* Task 3.2: Rate/cap row — fixed widths, no flex-wrap */}
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number" step="0.1" min="0"
                  value={b.rate}
                  onChange={e => updateBonus(type, bonusIdx, { rate: parseFloat(e.target.value) || 0 })}
                  className="border rounded px-1.5 py-0.5 text-xs focus:outline-none"
                  style={{ ...inlineNumStyle, width: '44px' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>%</span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>·</span>
                <input
                  type="number" min="0"
                  value={b.cap}
                  onChange={e => updateBonus(type, bonusIdx, { cap: parseInt(e.target.value) || 0 })}
                  className="border rounded px-1.5 py-0.5 text-xs focus:outline-none"
                  style={{ ...inlineNumStyle, width: '64px' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>NT$</span>
                <span className="text-[10px] px-1 py-0.5 rounded"
                  style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--color-text-muted)' }}>
                  {b.capPeriod === 'period' ? '期間' : '每月'}
                </span>
              </div>
            </div>
            {/* Task 3.1: Only ＋分類 and 刪除 — no ＋店家 */}
            <div className="flex gap-1.5 ml-2 shrink-0">
              <button type="button"
                onClick={() => {
                  setAddingSubCatForBonusIdx({ type, idx: bonusIdx })
                  setExpandedGroupKey(null)
                  setNewSubCatNameInput('')
                }}
                className="text-xs px-2 py-1 rounded-lg border transition-colors"
                style={{ color: 'var(--color-text-muted)', borderColor: '#4a3418' }}>
                ＋分類
              </button>
              <button type="button" onClick={() => removeBonus(type, bonusIdx)}
                className="text-xs px-2 py-1 rounded-lg border transition-colors"
                style={{ color: 'var(--color-danger)', borderColor: '#5a1a1a' }}>
                刪除
              </button>
            </div>
          </div>

          {/* Task 4.1 & 4.2: Collapsed group display */}
          <div className="mt-2 space-y-1.5">
            {hasSubCats
              ? (b.subCategories ?? []).map((sub, si) => {
                  const gKey = `${type}-${bonusIdx}-${si}`
                  const isOpen = expandedGroupKey === gKey
                  return (
                    <div key={si}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                          {sub.label}
                        </span>
                        <button type="button"
                          onClick={() => isOpen ? setExpandedGroupKey(null) : openGroupEditor(gKey, sub.label)}
                          className="text-[10px] px-1.5 py-0.5 rounded border transition-colors"
                          style={{ color: 'var(--color-text-muted)', borderColor: '#4a3418' }}>
                          {isOpen ? '收起' : '編輯'}
                        </button>
                      </div>
                      {isOpen
                        ? renderGroupEditor(type, bonusIdx, si, false)
                        : sub.stores.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {sub.stores.map(s => (
                              <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(0,185,181,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(0,185,181,0.25)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  )
                })
              : (() => {
                  const gKey = `${type}-${bonusIdx}-default`
                  const isOpen = expandedGroupKey === gKey
                  return (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                          適用店家
                        </span>
                        <button type="button"
                          onClick={() => isOpen ? setExpandedGroupKey(null) : openGroupEditor(gKey, '')}
                          className="text-[10px] px-1.5 py-0.5 rounded border transition-colors"
                          style={{ color: 'var(--color-text-muted)', borderColor: '#4a3418' }}>
                          {isOpen ? '收起' : '編輯'}
                        </button>
                      </div>
                      {isOpen
                        ? renderGroupEditor(type, bonusIdx, null, true)
                        : b.stores.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {b.stores.map(s => (
                              <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(0,185,181,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(0,185,181,0.25)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  )
                })()
            }

            {/* Task 6.1 & 6.2 & 6.3: +分類 inline form */}
            {addingSubCatForBonusIdx?.type === type && addingSubCatForBonusIdx.idx === bonusIdx && (
              <div className="rounded-lg p-2 space-y-1.5 mt-1"
                style={{ background: 'var(--color-input-bg)', border: '1px dashed var(--color-border)' }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>新增分類</p>
                <input
                  value={newSubCatNameInput}
                  onChange={e => setNewSubCatNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitNewSubCategory(type, bonusIdx) } }}
                  placeholder="分類名稱（例：便利商店）"
                  className="w-full border rounded px-2 py-1 text-xs focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => commitNewSubCategory(type, bonusIdx)}
                    disabled={!newSubCatNameInput.trim()}
                    className="flex-1 text-xs py-1 rounded border disabled:opacity-30"
                    style={{ color: 'var(--color-text-muted)', borderColor: '#4a3418', background: 'var(--color-bg-surface)' }}>
                    新增分類
                  </button>
                  <button type="button" onClick={() => setAddingSubCatForBonusIdx(null)}
                    className="text-xs px-2 py-1 rounded border"
                    style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prerequisite toggle */}
          {b.prerequisite && (
            <div className="mt-2 space-y-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={b.prerequisiteMet ?? false}
                  onChange={() => updateBonus(type, bonusIdx, { prerequisiteMet: !b.prerequisiteMet })}
                  className="mt-0.5"
                />
                <span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>我目前符合此條件</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    未勾選時此加碼不會計入回饋
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>
      )
    })
  }

  function renderAddBonusForm(type: 'store' | 'nub') {
    const showForm = type === 'store' ? showAddStoreForm : showAddNubForm
    const setShowForm = type === 'store' ? setShowAddStoreForm : setShowAddNubForm

    if (!showForm) {
      return (
        <div className="mt-3 pt-3" style={{ borderTop: '1px dashed var(--color-border)' }}>
          <button type="button" onClick={() => setShowForm(true)}
            className="w-full text-xs py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: '#4a3418', color: 'var(--color-text-muted)', background: 'transparent' }}>
            ＋ {type === 'store' ? '新增加碼' : '新增新戶加碼'}
          </button>
        </div>
      )
    }

    const [store, rate, cap, period] = type === 'store'
      ? [newBonusStore, newBonusRate, newBonusCap, newBonusCapPeriod]
      : [newNubBonusStore, newNubBonusRate, newNubBonusCap, newNubBonusCapPeriod]
    const setStore = type === 'store' ? setNewBonusStore : setNewNubBonusStore
    const setRate = type === 'store' ? setNewBonusRate : setNewNubBonusRate
    const setCap = type === 'store' ? setNewBonusCap : setNewNubBonusCap
    const setPeriod = type === 'store'
      ? (v: 'monthly' | 'period') => setNewBonusCapPeriod(v)
      : (v: 'monthly' | 'period') => setNewNubBonusCapPeriod(v)

    return (
      <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px dashed var(--color-border)' }}>
        <input
          value={store}
          onChange={e => setStore(e.target.value)}
          placeholder={type === 'store' ? '通路名稱（例：熱門商店）' : '加碼名稱（例：新戶實體消費加碼）'}
          className={inputClass + ' text-sm'}
        />
        <div className="flex gap-2">
          <input value={rate} onChange={e => setRate(e.target.value)}
            type="number" step="0.1" min="0" placeholder="加碼%"
            className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none" />
          <input value={cap} onChange={e => setCap(e.target.value)}
            type="number" min="0" placeholder="上限$"
            className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPeriod('monthly')}
            className="flex-1 py-1.5 rounded text-xs border transition-all"
            style={period === 'monthly'
              ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)' }
              : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
            每月重置
          </button>
          <button type="button" onClick={() => setPeriod('period')}
            className="flex-1 py-1.5 rounded text-xs border transition-all"
            style={period === 'period'
              ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)' }
              : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
            活動期間
          </button>
          <button type="button" onClick={() => { addBonus(type); setShowForm(false) }}
            className="text-sm px-3 py-1.5 rounded transition-colors"
            style={{ background: 'var(--color-bg-surface)', color: 'var(--color-secondary)', border: '1px solid #3a2810' }}>
            新增
          </button>
        </div>
        <button type="button" onClick={() => setShowForm(false)}
          className="text-xs w-full text-center transition-colors"
          style={{ color: 'var(--color-text-muted)' }}>
          取消
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="relative flex items-center mb-4">
        <button onClick={onCancel}
          className="text-sm transition-colors flex items-center gap-1"
          style={{ color: 'var(--color-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          返回
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold" style={{ color: 'var(--color-text-base)' }}>{card ? '編輯卡片' : '新增卡片'}</h1>
      </div>

      {/* ── Import panel ── */}
      {!card && (
        <div className="mb-4">
          {!showImportPanel ? (
            <button
              type="button"
              onClick={() => { setShowImportPanel(true); setImportError(null); setMissingFields([]) }}
              className="w-full border border-dashed text-sm py-2.5 rounded-xl transition-colors"
              style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
            >
              從銀行活動網址自動匯入
            </button>
          ) : (
            <div className="glass-card p-4 space-y-3"
              onPaste={handlePaste}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>從活動網址匯入（{provider === 'gemini' ? 'Gemini' : 'Claude'}）</p>
                <button type="button"
                  onClick={() => { setShowImportPanel(false); setImportError(null); setImportImage(null) }}
                  className="text-xs" style={{ color: 'var(--color-text-muted)' }}>關閉</button>
              </div>

              {!apiKey && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--color-secondary)' }}>
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
                style={{ background: 'var(--color-secondary)', color: '#fff' }}
              >
                {importing ? '擷取中…' : '自動擷取'}
              </button>

              <div>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>或從截圖辨識</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-xs py-2 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'transparent' }}
                >
                  選擇圖片檔案
                </button>
                <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  也可直接 Ctrl+V 貼上截圖
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImageFile(file)
                    e.target.value = ''
                  }}
                />
                {importImage && (
                  <div className="mt-2 space-y-2">
                    <img src={importImage.preview} alt="截圖預覽"
                      className="w-full rounded-lg max-h-40 object-contain"
                      style={{ border: '1px solid var(--color-border)' }} />
                    <button type="button" onClick={handleImageImport}
                      disabled={importing || !apiKey}
                      className="w-full text-sm py-2 rounded font-medium transition-all disabled:opacity-30"
                      style={{ background: 'var(--color-secondary)', color: '#fff' }}>
                      {importing ? '辨識中…' : '開始辨識'}
                    </button>
                    <button type="button" onClick={() => setImportImage(null)}
                      className="w-full text-xs py-1 rounded border transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      移除截圖
                    </button>
                  </div>
                )}
              </div>

              <button type="button" onClick={() => setShowHtmlFallback(v => !v)}
                className="text-xs underline" style={{ color: 'var(--color-text-muted)' }}>
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
                  <button type="button" onClick={handleHtmlImport}
                    disabled={importing || !manualHtml.trim() || !apiKey}
                    className="w-full text-sm py-2 rounded font-medium border transition-all disabled:opacity-30"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg-surface)' }}>
                    {importing ? '解析中…' : '解析 HTML'}
                  </button>
                </div>
              )}

              {importError && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--color-danger)' }}>
                  {importError}
                </p>
              )}
            </div>
          )}

          {missingFields.length > 0 && (
            <p className="mt-2 text-xs rounded-lg px-3 py-2"
              style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--color-secondary)' }}>
              以下欄位未能自動填入，請手動補完：{missingFields.join('、')}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Basic info ── */}
        <div className="glass-card rounded-xl p-4 space-y-3" style={sectionStyle('basic')}
          onFocus={() => handleSectionFocus('basic')}
          onBlur={e => handleSectionBlur(e, 'basic')}>
          <div>
            <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>卡片名稱</label>
            <input value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="例：國泰 Cube" className={inputClass} />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['國泰 Cube', '吉鶴卡', '全支付', 'Line Bank'].map(n => (
                <button key={n} type="button" onClick={() => handleNameChange(n)}
                  className="text-xs px-2 py-0.5 rounded transition-colors"
                  style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--color-secondary)', border: '1px solid rgba(245,166,35,0.25)' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>銀行活動頁面連結（選填）</label>
            <input value={bankUrl} onChange={e => setBankUrl(e.target.value)}
              placeholder="https://..." type="url" className={inputClass} />
            {bankUrl && (
              <a href={bankUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs mt-1.5 transition-colors"
                style={{ color: 'var(--color-secondary)' }}>
                前往活動頁面 ↗
              </a>
            )}
          </div>
          <hr style={{ borderColor: 'var(--color-border)', margin: '4px 0' }} />
          <div>
            <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>海外一般回饋 %</label>
            <input value={baseRate} onChange={e => setBaseRate(e.target.value)}
              type="number" step="0.1" min="0" max="100" placeholder="例：3" className={inputClass} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>每月回饋上限（NT$）</label>
              <input value={rewardCap} onChange={e => setRewardCap(e.target.value)}
                type="number" min="0" placeholder="例：1500" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>每月消費上限（NT$）</label>
              <input value={spendCap} onChange={e => setSpendCap(e.target.value)}
                type="number" min="0" placeholder="例：50000" className={inputClass} />
            </div>
          </div>
          <hr style={{ borderColor: 'var(--color-border)', margin: '4px 0' }} />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>活動開始日（選填）</label>
              <DatePicker value={validFrom} onChange={setValidFrom} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs block mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>活動結束日（選填）</label>
              <DatePicker value={validTo} onChange={setValidTo} className={inputClass} />
            </div>
          </div>
        </div>

        {/* ── New user bonus section ── */}
        <div className="glass-card rounded-xl p-4" style={sectionStyle('nub')}
          onFocus={() => handleSectionFocus('nub')}
          onBlur={e => handleSectionBlur(e, 'nub')}>
          <h3 className="text-sm font-semibold mb-3 pl-3 uppercase tracking-widest"
            style={{ color: 'var(--color-accent)', borderLeft: '3px solid var(--color-accent)' }}>新戶加碼</h3>
          <div className="space-y-2">{renderBonusList('nub')}</div>
          {renderAddBonusForm('nub')}
        </div>

        {/* ── Store bonus section ── */}
        <div className="glass-card rounded-xl p-4" style={sectionStyle('store')}
          onFocus={() => handleSectionFocus('store')}
          onBlur={e => handleSectionBlur(e, 'store')}>
          <h3 className="text-sm font-semibold mb-3 pl-3 uppercase tracking-widest"
            style={{ color: 'var(--color-secondary)', borderLeft: '3px solid var(--color-secondary)' }}>特定店家加碼</h3>
          <div className="space-y-2">{renderBonusList('store')}</div>
          {renderAddBonusForm('store')}
        </div>

        {/* ── Payment method bonus ── */}
        <div className="glass-card rounded-xl p-4" style={sectionStyle('payment')}
          onFocus={() => handleSectionFocus('payment')}
          onBlur={e => handleSectionBlur(e, 'payment')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold pl-3 uppercase tracking-widest"
              style={{ color: 'var(--color-secondary)', borderLeft: '3px solid var(--color-secondary)' }}>行動支付加碼</h3>
            <button type="button" onClick={() => setPmBonusEnabled(v => !v)}
              className="text-xs px-3 py-1 rounded-lg border transition-all"
              style={pmBonusEnabled
                ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)', fontWeight: 600 }
                : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: '#4a3418' }}>
              {pmBonusEnabled ? '啟用中' : '未啟用'}
            </button>
          </div>

          {pmBonusEnabled && (
            <div className="space-y-4">
              <div>
                <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>適用付款方式</p>
                <div className="flex gap-2">
                  {(['apple_pay', 'google_pay'] as const).map(m => (
                    <button key={m} type="button" onClick={() => togglePmMethod(m)}
                      className="flex-1 py-1.5 rounded text-xs border transition-all"
                      style={pmMethods.includes(m)
                        ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)' }
                        : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                      {m === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                    </button>
                  ))}
                </div>
              </div>

              {pmTiers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>加碼層級</p>
                  {pmTiers.map((tier, idx) => (
                    <div key={idx} className="rounded-lg p-3 space-y-2"
                      style={{ background: 'var(--color-bg-surface)', border: '1px solid #3d2e14' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+</span>
                          <input type="number" step="0.1" min="0"
                            value={tier.rate}
                            onChange={e => updatePmTier(idx, { rate: parseFloat(e.target.value) || 0 })}
                            className="border rounded px-1.5 py-0.5 text-xs focus:outline-none"
                            style={{ ...inlineNumStyle, width: '44px', color: 'var(--color-text-base)' }} />
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>%・月上限 NT$</span>
                          <input type="number" min="0"
                            value={tier.monthlyCap}
                            onChange={e => updatePmTier(idx, { monthlyCap: parseInt(e.target.value) || 0 })}
                            className="border rounded px-1.5 py-0.5 text-xs focus:outline-none"
                            style={{ ...inlineNumStyle, width: '68px', color: 'var(--color-text-base)' }} />
                        </div>
                        <button type="button" onClick={() => removePmTier(idx)}
                          className="text-xs ml-2" style={{ color: 'var(--color-danger)' }}>刪除</button>
                      </div>
                      {tier.prerequisite && (
                        <div className="space-y-1">
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>條件：{tier.prerequisite}</p>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" checked={tier.prerequisiteMet ?? false}
                              onChange={() => toggleTierPrereqMet(idx)} className="mt-0.5" />
                            <span>
                              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>我目前符合此條件</span>
                              <span className="block text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
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

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>新增加碼層級</p>
                <div className="flex gap-2">
                  <input value={newTierRate} onChange={e => setNewTierRate(e.target.value)}
                    type="number" step="0.1" min="0" placeholder="加碼 %"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                  <input value={newTierCap} onChange={e => setNewTierCap(e.target.value)}
                    type="number" min="0" placeholder="月上限 NT$"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <input value={newTierPrereq} onChange={e => setNewTierPrereq(e.target.value)}
                  placeholder="前置條件（選填，例：前月帳單達3萬元）"
                  className={inputClass + ' text-sm'} />
                {newTierPrereq.trim() && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={newTierPrereqMet}
                      onChange={e => setNewTierPrereqMet(e.target.checked)} className="mt-0.5" />
                    <span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>我目前符合此條件</span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        每月初請確認條件是否仍符合
                      </span>
                    </span>
                  </label>
                )}
                <button type="button" onClick={addPmTier}
                  disabled={!newTierRate || !newTierCap}
                  className="w-full text-sm py-1.5 rounded border transition-all disabled:opacity-30"
                  style={{ background: 'var(--color-bg-surface)', color: 'var(--color-secondary)', border: '1px solid #3a2810' }}>
                  ＋ 新增層級
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pb-4">
          <button type="submit" disabled={!name.trim() || !baseRate}
            className="flex-1 rounded-lg py-3 font-semibold text-sm tracking-wider transition-all disabled:opacity-30"
            style={{ background: 'var(--color-secondary)', color: '#fff' }}>

            儲存
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-lg py-3 text-sm border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'transparent' }}>
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
