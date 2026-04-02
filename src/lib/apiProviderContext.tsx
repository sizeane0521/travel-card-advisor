import { createContext, useContext } from 'react'

export type ApiProvider = 'claude' | 'gemini'

export interface ApiProviderState {
  provider: ApiProvider
  apiKey: string
  setProvider: (p: ApiProvider) => void
  setApiKey: (k: string) => void
}

export const ApiProviderContext = createContext<ApiProviderState>({
  provider: 'gemini',
  apiKey: '',
  setProvider: () => {},
  setApiKey: () => {},
})

export function useApiProvider(): ApiProviderState {
  return useContext(ApiProviderContext)
}
