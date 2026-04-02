import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Card } from '../types'
import CardForm from '../components/CardForm'
import QRCodePanel from '../components/QRCodePanel'
import QRImportPanel from '../components/QRImportPanel'
import { useApiProvider } from '../lib/apiProviderContext'

export default function SettingsPage() {
  const { data, dispatch } = useStore()
  const { provider, apiKey, setProvider, setApiKey } = useApiProvider()
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showImport, setShowImport] = useState(false)

  // Task 4.2: session key input (not persisted)
  const [keyInput, setKeyInput] = useState('')

  function handleSaveKey() {
    if (!keyInput.trim()) return
    setApiKey(keyInput.trim())
    setKeyInput('')
  }

  function handleSave(card: Card) {
    if (data.cards.find(c => c.id === card.id)) {
      dispatch({ type: 'UPDATE_CARD', card })
    } else {
      dispatch({ type: 'ADD_CARD', card })
    }
    setEditingCard(null)
    setShowNewForm(false)
  }

  function handleDelete(cardId: string) {
    if (!confirm('確定要刪除此卡片嗎？')) return
    dispatch({ type: 'DELETE_CARD', cardId })
  }

  function handleImport(cards: Card[]) {
    dispatch({ type: 'SET_CARDS', cards })
    setShowImport(false)
    alert('卡片設定已成功匯入！')
  }

  if (showQR) {
    return <QRCodePanel cards={data.cards} onBack={() => setShowQR(false)} />
  }
  if (showImport) {
    return <QRImportPanel onImport={handleImport} onBack={() => setShowImport(false)} />
  }
  if (editingCard) {
    return <CardForm card={editingCard} onSave={handleSave} onCancel={() => setEditingCard(null)} />
  }
  if (showNewForm) {
    return (
      <CardForm
        card={null}
        onSave={handleSave}
        onCancel={() => setShowNewForm(false)}
      />
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">卡片設定</h1>

      {/* QR code sync actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-medium text-blue-800 mb-2">跨裝置同步</h2>
        <p className="text-xs text-blue-600 mb-3">
          桌機設定完成後，產生 QR Code 讓手機掃描匯入。
          <br />
          ⚠️ 注意：請在 Safari 瀏覽器中操作，「加入主畫面」後的 App 有獨立儲存空間，需重新掃碼匯入。
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            disabled={data.cards.length === 0}
            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg disabled:opacity-40"
          >
            📤 產生 QR Code
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 border border-blue-400 text-blue-600 text-sm py-2 rounded-lg"
          >
            📷 掃碼匯入
          </button>
        </div>
      </div>

      {/* Card list */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-gray-500">信用卡列表</h2>
        <button
          onClick={() => setShowNewForm(true)}
          className="text-sm text-blue-600 font-medium"
        >
          ＋ 新增卡片
        </button>
      </div>

      {data.cards.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">💳</p>
          <p className="text-sm">尚未新增卡片</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.cards.map(card => (
            <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{card.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    海外 {card.baseRate}% ·{' '}
                    {card.monthlyCap.type === 'reward'
                      ? `回饋上限 NT$${card.monthlyCap.amount.toLocaleString()}`
                      : `消費上限 NT$${card.monthlyCap.amount.toLocaleString()}`}
                  </p>
                  {card.storeBonus.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {card.storeBonus.map(b => (
                        <span key={b.storeName} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {b.storeName} {b.rate}%
                        </span>
                      ))}
                    </div>
                  )}
                  {card.bankUrl && (
                    <a
                      href={card.bankUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 mt-1.5 inline-block"
                    >
                      🔗 銀行活動頁面
                    </a>
                  )}
                </div>
                <div className="flex gap-2 text-sm">
                  <button onClick={() => setEditingCard(card)} className="text-blue-500">編輯</button>
                  <button onClick={() => handleDelete(card.id)} className="text-red-400">刪除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks 4.1 + 4.2: AI Provider selection + session key input */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">自動匯入設定</h2>

        {/* Task 4.1: Provider toggle */}
        <label className="text-xs text-gray-500 block mb-1.5">AI 服務商</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setProvider('gemini'); setApiKey('') }}
            className={`flex-1 py-1.5 rounded-lg text-sm border ${provider === 'gemini' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'}`}
          >
            Gemini
          </button>
          <button
            type="button"
            onClick={() => { setProvider('claude'); setApiKey('') }}
            className={`flex-1 py-1.5 rounded-lg text-sm border ${provider === 'claude' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'}`}
          >
            Claude
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {provider === 'gemini'
            ? 'Gemini 提供免費方案，至 aistudio.google.com 申請 API Key'
            : '至 console.anthropic.com 申請 Claude API Key'}
        </p>

        {/* Task 4.2: Session-only key input */}
        {apiKey ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <p className="text-xs text-green-700">
              本次已設定：<span className="font-mono">{'•'.repeat(Math.max(0, apiKey.length - 4))}{apiKey.slice(-4)}</span>
            </p>
            <button onClick={() => setApiKey('')} className="text-xs text-gray-400">清除</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              placeholder={provider === 'gemini' ? 'AIza...' : 'sk-ant-...'}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
              className="bg-gray-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40"
            >
              設定
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">Key 僅存於本次瀏覽器工作階段，重新整理或關閉分頁後自動清除。</p>
      </div>
    </div>
  )
}
