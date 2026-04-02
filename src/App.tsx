import { useState } from 'react'
import AdvisorPage from './pages/AdvisorPage'
import ExpensePage from './pages/ExpensePage'
import SettingsPage from './pages/SettingsPage'
import TripsPage from './pages/TripsPage'
import { ApiProviderContext, type ApiProvider } from './lib/apiProviderContext'

type Tab = 'advisor' | 'expense' | 'trips' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'advisor', label: '推薦', icon: '💳' },
  { id: 'expense', label: '記帳', icon: '📝' },
  { id: 'trips', label: '旅程', icon: '✈️' },
  { id: 'settings', label: '設定', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('advisor')
  const [provider, setProvider] = useState<ApiProvider>('gemini')
  const [apiKey, setApiKey] = useState('')

  return (
    <ApiProviderContext.Provider value={{ provider, apiKey, setProvider, setApiKey }}>
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'advisor' && <AdvisorPage />}
        {tab === 'expense' && <ExpensePage />}
        {tab === 'trips' && <TripsPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex safe-area-pb">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
              tab === t.id ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
    </ApiProviderContext.Provider>
  )
}
