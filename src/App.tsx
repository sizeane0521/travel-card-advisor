import { useState, useEffect } from 'react'
import CalcPage from './pages/CalcPage'
import LedgerPage from './pages/LedgerPage'
import SettingsPage from './pages/SettingsPage'
import TripsPage from './pages/TripsPage'
import { ApiProviderContext, type ApiProvider } from './lib/apiProviderContext'

type Tab = 'calc' | 'ledger' | 'trips' | 'settings'
type Theme = 'dark' | 'light'

// ── SVG Icons ────────────────────────────────────────────
const CalcIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="10" y2="10"/>
    <line x1="14" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="10" y2="14"/>
    <line x1="14" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="10" y2="18"/>
    <line x1="14" y1="18" x2="16" y2="18"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
    <line x1="6" y1="15" x2="10" y2="15"/>
  </svg>
)

const GlobeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

// ── Tab Config ───────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'calc',     label: '試算', icon: <CalcIcon /> },
  { id: 'ledger',   label: '刷卡金', icon: <CreditCardIcon /> },
  { id: 'trips',    label: '旅程', icon: <GlobeIcon /> },
  { id: 'settings', label: '設定', icon: <ShieldIcon /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('calc')
  const [provider, setProvider] = useState<ApiProvider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'dark'
  )

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  return (
    <ApiProviderContext.Provider value={{ provider, apiKey, setProvider, setApiKey }}>
      <div className="flex flex-col min-h-dvh bg-transparent">
        <main className="flex-1 overflow-y-auto pb-20">
          {tab === 'calc'     && <CalcPage />}
          {tab === 'ledger'   && <LedgerPage />}
          {tab === 'trips'    && <TripsPage />}
          {tab === 'settings' && <SettingsPage theme={theme} onToggleTheme={toggleTheme} />}
        </main>

        {/* ── Bottom tab bar ── */}
        <nav className="glass-nav fixed bottom-0 inset-x-0 flex safe-area-pb">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
              style={{
                color: tab === t.id ? 'var(--color-secondary)' : 'var(--color-text-muted)',
              }}
            >
              {t.icon}
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
              {tab === t.id && (
                <span className="absolute bottom-0 h-[2px] w-8 rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, var(--color-secondary), transparent)' }} />
              )}
            </button>
          ))}
        </nav>
      </div>
    </ApiProviderContext.Provider>
  )
}
