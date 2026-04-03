import { useState } from 'react'
import AdvisorPage from './pages/AdvisorPage'
import ExpensePage from './pages/ExpensePage'
import SettingsPage from './pages/SettingsPage'
import TripsPage from './pages/TripsPage'
import { ApiProviderContext, type ApiProvider } from './lib/apiProviderContext'

type Tab = 'advisor' | 'expense' | 'trips' | 'settings'

// ── SVG Icons ────────────────────────────────────────────
const GemIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
    <path d="M11 3L8 9l4 13 4-13-3-6"/>
    <line x1="2" y1="9" x2="22" y2="9"/>
  </svg>
)

const ScrollIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
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
  { id: 'advisor',  label: '推薦', icon: <GemIcon /> },
  { id: 'expense',  label: '記帳', icon: <ScrollIcon /> },
  { id: 'trips',    label: '旅程', icon: <GlobeIcon /> },
  { id: 'settings', label: '設定', icon: <ShieldIcon /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('advisor')
  const [provider, setProvider] = useState<ApiProvider>('gemini')
  const [apiKey, setApiKey] = useState('')

  return (
    <ApiProviderContext.Provider value={{ provider, apiKey, setProvider, setApiKey }}>
      <div className="flex flex-col min-h-dvh bg-transparent">
        <main className="flex-1 overflow-y-auto pb-20">
          {tab === 'advisor'  && <AdvisorPage />}
          {tab === 'expense'  && <ExpensePage />}
          {tab === 'trips'    && <TripsPage />}
          {tab === 'settings' && <SettingsPage />}
        </main>

        {/* ── Bottom tab bar ── */}
        <nav className="fixed bottom-0 inset-x-0 flex safe-area-pb"
          style={{
            background: 'linear-gradient(to top, #0d0a06, #110d05)',
            borderTop: '1px solid #3a2810',
          }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all"
              style={{
                color: tab === t.id ? '#d4a017' : '#5a3f1a',
                textShadow: tab === t.id ? '0 0 8px rgba(212,160,23,0.5)' : 'none',
              }}
            >
              {t.icon}
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
              {tab === t.id && (
                <span className="absolute bottom-0 h-[2px] w-8 rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }} />
              )}
            </button>
          ))}
        </nav>
      </div>
    </ApiProviderContext.Provider>
  )
}
