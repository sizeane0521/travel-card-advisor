import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Card } from '../types'
import CardForm from '../components/CardForm'
import QRCodePanel from '../components/QRCodePanel'
import QRImportPanel from '../components/QRImportPanel'
import { getClaudeApiKey, saveClaudeApiKey } from '../lib/cardImport'

export default function SettingsPage() {
  const { data, dispatch } = useStore()
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showImport, setShowImport] = useState(false)

  // Task 1.1: Claude API key state
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const savedKey = getClaudeApiKey()

  function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return
    saveClaudeApiKey(apiKeyInput.trim())
    setApiKeyInput('')
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
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

  // Called from CardForm when API key is missing
  function handleNeedApiKey() {
    setShowNewForm(false)
    alert('請先在設定頁面底部填入 Claude API Key，才能使用自動匯入功能。')
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
        onNeedApiKey={handleNeedApiKey}
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

      {/* Task 1.1: Claude API Key configuration */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-1">Claude API Key</h2>
        <p className="text-xs text-gray-500 mb-3">
          用於「從網址自動匯入」功能。Key 僅儲存於本裝置，不會上傳至任何伺服器。
        </p>
        {savedKey && (
          <p className="text-xs text-gray-500 mb-2">
            目前已設定：<span className="font-mono">{'•'.repeat(savedKey.length - 4)}{savedKey.slice(-4)}</span>
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder={savedKey ? '輸入新 Key 以覆蓋' : 'sk-ant-...'}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSaveApiKey}
            disabled={!apiKeyInput.trim()}
            className="bg-gray-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40"
          >
            {apiKeySaved ? '已儲存 ✓' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}
