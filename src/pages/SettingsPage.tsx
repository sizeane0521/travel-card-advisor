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

  if (showQR) return <QRCodePanel cards={data.cards} onBack={() => setShowQR(false)} />
  if (showImport) return <QRImportPanel onImport={handleImport} onBack={() => setShowImport(false)} />
  if (editingCard) return <CardForm card={editingCard} onSave={handleSave} onCancel={() => setEditingCard(null)} />
  if (showNewForm) return <CardForm card={null} onSave={handleSave} onCancel={() => setShowNewForm(false)} />

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-[#f2e8c9] mb-4">卡片設定</h1>

      {/* ── QR code sync ── */}
      <div className="beast-card rounded-xl p-4 mb-4"
        style={{ background: '#181308', border: '1px solid #3a2810' }}>
        <h2 className="text-xs font-semibold text-[#c8901a] mb-1.5 uppercase tracking-widest">跨裝置同步</h2>
        <p className="text-xs text-[#7a5c2a] mb-3">
          桌機設定完成後，產生 QR Code 讓手機掃描匯入。
          <br />
          注意：請在 Safari 瀏覽器中操作，「加入主畫面」後的 App 有獨立儲存空間，需重新掃碼匯入。
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            disabled={data.cards.length === 0}
            className="flex-1 text-sm py-2.5 rounded font-medium transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #c8901a, #d4a017)', color: '#0d0a06' }}
          >
            產生 QR Code
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 text-sm py-2.5 rounded font-medium border transition-colors"
            style={{ borderColor: '#c8901a', color: '#c8901a' }}
          >
            掃碼匯入
          </button>
        </div>
      </div>

      {/* ── Card list ── */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium text-[#7a5c2a] uppercase tracking-widest">信用卡列表</h2>
        <button
          onClick={() => setShowNewForm(true)}
          className="text-sm font-medium transition-colors"
          style={{ color: '#c8901a' }}
        >
          ＋ 新增卡片
        </button>
      </div>

      {data.cards.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
            <path d="M11 3L8 9l4 13 4-13-3-6"/>
            <line x1="2" y1="9" x2="22" y2="9"/>
          </svg>
          <p className="text-sm text-[#5a3f1a]">尚未新增卡片</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {data.cards.map(card => (
            <div key={card.id}
              className="beast-card rounded-xl p-4"
              style={{ background: '#1a1208', border: '1px solid #2e2210' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#f2e8c9]">{card.name}</p>
                  <p className="text-sm text-[#7a5c2a] mt-0.5">
                    海外 {card.baseRate}%
                    {card.monthlyCap.rewardLimit !== undefined && ` · 回饋上限 NT$${card.monthlyCap.rewardLimit.toLocaleString()}`}
                    {card.monthlyCap.spendLimit !== undefined && ` · 消費上限 NT$${card.monthlyCap.spendLimit.toLocaleString()}`}
                  </p>
                  {card.storeBonus.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {card.storeBonus.map(b => (
                        <span key={b.storeName}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'rgba(200,144,26,0.1)', color: '#b89444', border: '1px solid rgba(200,144,26,0.2)' }}>
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
                      className="text-xs mt-1.5 inline-flex items-center gap-1 transition-colors"
                      style={{ color: '#7a5c2a' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      銀行活動頁面
                    </a>
                  )}
                </div>
                <div className="flex gap-3 text-sm ml-3">
                  <button onClick={() => setEditingCard(card)}
                    className="transition-colors" style={{ color: '#c8901a' }}>編輯</button>
                  <button onClick={() => handleDelete(card.id)}
                    className="transition-colors" style={{ color: '#8b1a1a' }}>刪除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI provider settings ── */}
      <div className="beast-card rounded-xl p-4"
        style={{ background: '#141008', border: '1px solid #2e2210' }}>
        <h2 className="text-xs font-semibold text-[#7a5c2a] mb-3 uppercase tracking-widest">自動匯入設定</h2>

        <label className="text-xs text-[#5a3f1a] block mb-1.5">AI 服務商</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setProvider('gemini'); setApiKey('') }}
            className="flex-1 py-2 rounded text-sm border font-medium transition-all"
            style={provider === 'gemini'
              ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a' }
              : { background: 'transparent', color: '#7a5c2a', borderColor: '#3a2810' }}
          >
            Gemini
          </button>
          <button
            type="button"
            onClick={() => { setProvider('claude'); setApiKey('') }}
            className="flex-1 py-2 rounded text-sm border font-medium transition-all"
            style={provider === 'claude'
              ? { background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a' }
              : { background: 'transparent', color: '#7a5c2a', borderColor: '#3a2810' }}
          >
            Claude
          </button>
        </div>

        <p className="text-xs text-[#5a3f1a] mb-3">
          {provider === 'gemini'
            ? 'Gemini 提供免費方案，至 aistudio.google.com 申請 API Key'
            : '至 console.anthropic.com 申請 Claude API Key'}
        </p>

        {apiKey ? (
          <div className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ background: '#0f1a0e', border: '1px solid #1a4a28' }}>
            <p className="text-xs" style={{ color: '#4ade80' }}>
              已設定：<span className="font-mono">{'•'.repeat(Math.max(0, apiKey.length - 4))}{apiKey.slice(-4)}</span>
            </p>
            <button onClick={() => setApiKey('')} className="text-xs text-[#5a3f1a]">清除</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              placeholder={provider === 'gemini' ? 'AIza...' : 'sk-ant-...'}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
              className="text-sm px-4 py-2 rounded font-medium transition-all disabled:opacity-30"
              style={{ background: '#2e2210', color: '#c8901a', border: '1px solid #3a2810' }}
            >
              設定
            </button>
          </div>
        )}
        <p className="text-xs text-[#3a2810] mt-2">Key 僅存於本次瀏覽器工作階段，重新整理或關閉分頁後自動清除。</p>
      </div>
    </div>
  )
}
