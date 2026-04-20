import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Card } from '../types'
import CardForm from '../components/CardForm'
import QRCodePanel from '../components/QRCodePanel'
import QRImportPanel from '../components/QRImportPanel'
import { useApiProvider } from '../lib/apiProviderContext'

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
  'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)',
  'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
  'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)',
  'linear-gradient(135deg, #e65100 0%, #bf360c 100%)',
  'linear-gradient(135deg, #006064 0%, #00838f 100%)',
  'linear-gradient(135deg, #37474f 0%, #546e7a 100%)',
  'linear-gradient(135deg, #4e342e 0%, #6d4c41 100%)',
]

function hashCardColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff
  }
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length]
}

interface Props {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export default function SettingsPage({ theme, onToggleTheme }: Props) {
  const { data, dispatch } = useStore()
  const { provider, apiKey, setProvider, setApiKey } = useApiProvider()
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const [keyInput, setKeyInput] = useState('')
  const [apiPanelOpen, setApiPanelOpen] = useState(false)

  function handleSaveKey() {
    if (!keyInput.trim()) return
    setApiKey(keyInput.trim())
    setKeyInput('')
    setApiPanelOpen(false)
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

  const isDark = theme === 'dark'

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-base)' }}>卡片設定</h1>

      {/* ── Theme toggle ── */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-accent)' }}>外觀主題</h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {isDark ? '🌙 深色模式' : '☀️ 淺色模式'}
            </p>
          </div>
          {/* iOS-style toggle switch */}
          <button
            role="switch"
            aria-checked={!isDark}
            onClick={onToggleTheme}
            className="relative shrink-0 transition-all duration-300"
            style={{
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              background: isDark ? 'rgba(255,255,255,0.15)' : 'var(--color-secondary)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <span
              className="absolute transition-all duration-300"
              style={{
                top: '3px',
                left: isDark ? '3px' : '25px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: isDark ? 'var(--color-text-muted)' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                lineHeight: 1,
              }}
            >
              {isDark ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </div>

      {/* ── AI provider settings ── */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>自動匯入設定</h2>
          {apiKey && !apiPanelOpen ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                {provider === 'gemini' ? 'Gemini' : 'Claude'} · <span className="font-mono">{'•'.repeat(Math.max(0, apiKey.length - 4))}{apiKey.slice(-4)}</span>
              </span>
              <button onClick={() => setApiPanelOpen(true)} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>修改</button>
            </div>
          ) : (
            apiKey && <button onClick={() => setApiPanelOpen(false)} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>收起</button>
          )}
        </div>

        {(!apiKey || apiPanelOpen) && (
          <div className="mt-3">
            <label className="text-xs block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>AI 服務商</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setProvider('gemini'); setApiKey('') }}
                className="flex-1 py-2 rounded text-sm border font-medium transition-all"
                style={provider === 'gemini'
                  ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)' }
                  : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
              >
                Gemini
              </button>
              <button
                type="button"
                onClick={() => { setProvider('claude'); setApiKey('') }}
                className="flex-1 py-2 rounded text-sm border font-medium transition-all"
                style={provider === 'claude'
                  ? { background: 'var(--color-secondary)', color: '#fff', borderColor: 'var(--color-secondary)' }
                  : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
              >
                Claude
              </button>
            </div>

            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              {provider === 'gemini'
                ? 'Gemini 提供免費方案，至 aistudio.google.com 申請 API Key'
                : '至 console.anthropic.com 申請 Claude API Key'}
            </p>

            {apiKey ? (
              <div className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: 'rgba(0,185,181,0.08)', border: '1px solid rgba(0,185,181,0.25)' }}>
                <p className="text-xs" style={{ color: 'var(--color-success)' }}>
                  已設定：<span className="font-mono">{'•'.repeat(Math.max(0, apiKey.length - 4))}{apiKey.slice(-4)}</span>
                </p>
                <button onClick={() => { setApiKey(''); setApiPanelOpen(false) }} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>清除</button>
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
                  style={{ background: 'var(--color-secondary)', color: '#fff', border: 'none' }}
                >
                  設定
                </button>
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: 'var(--color-border)' }}>Key 僅存於本次瀏覽器工作階段，重新整理或關閉分頁後自動清除。</p>
          </div>
        )}
      </div>

      {/* ── Card list ── */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold pl-3 uppercase tracking-widest"
          style={{ color: 'var(--color-secondary)', borderLeft: '3px solid var(--color-secondary)' }}>
          信用卡列表
        </h2>
        <button
          onClick={() => setShowNewForm(true)}
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--color-secondary)' }}
        >
          ＋ 新增卡片
        </button>
      </div>

      {data.cards.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--color-secondary)' }}>
            <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
            <path d="M11 3L8 9l4 13 4-13-3-6"/>
            <line x1="2" y1="9" x2="22" y2="9"/>
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>尚未新增卡片</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {data.cards.map(card => {
            const today = new Date(); today.setHours(0,0,0,0)
            const sevenDaysLater = new Date(today); sevenDaysLater.setDate(today.getDate() + 7)
            const expiryDate = card.validTo ? new Date(card.validTo) : null
            const isExpired = expiryDate ? expiryDate < today : false
            const isExpiringSoon = expiryDate ? (expiryDate >= today && expiryDate <= sevenDaysLater) : false
            const formattedValidTo = card.validTo?.replace(/-/g, '/')
            return (
              <div key={card.id} className="glass-card overflow-hidden">
                {/* Card face */}
                <div className="relative h-40 p-4 flex flex-col justify-between"
                  style={{ background: hashCardColor(card.name) }}>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-1.5">
                      {isExpired && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: 'rgba(0,0,0,0.45)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}>
                          活動已結束
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: 'rgba(0,0,0,0.45)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }}>
                          即將到期
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.35)', color: '#f2e8c9' }}>
                      {card.baseRate}%
                    </span>
                  </div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-6 rounded"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }} />
                  <div className="flex items-end justify-between">
                    <p className="text-xl font-bold leading-tight"
                      style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                      {card.name}
                    </p>
                    {formattedValidTo && (
                      <p className="text-[10px] font-medium"
                        style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {formattedValidTo}
                      </p>
                    )}
                  </div>
                </div>
                {/* Action row */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    {card.bankUrl && (
                      <a href={card.bankUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs inline-flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--color-accent)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        銀行活動頁面
                      </a>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => setEditingCard(card)}
                      className="transition-colors" style={{ color: 'var(--color-secondary)' }}>編輯</button>
                    <button onClick={() => handleDelete(card.id)}
                      className="transition-colors" style={{ color: 'var(--color-danger)' }}>刪除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── QR code sync ── */}
      <div className="glass-card p-4 mb-4">
        <h2 className="text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--color-secondary)' }}>跨裝置同步</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
          桌機設定完成後，產生 QR Code 讓手機掃描匯入。
          <br />
          注意：請在 Safari 瀏覽器中操作，「加入主畫面」後的 App 有獨立儲存空間，需重新掃碼匯入。
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            disabled={data.cards.length === 0}
            className="flex-1 text-sm py-2.5 rounded font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--color-secondary)', color: '#fff' }}
          >
            產生 QR Code
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 text-sm py-2.5 rounded font-medium border transition-colors"
            style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)', background: 'transparent' }}
          >
            掃碼匯入
          </button>
        </div>
      </div>
    </div>
  )
}
