## 1. 建立 ApiProvider Context（Provider + Key 以 React Context 向下傳遞）

- [x] 1.1 在 `src/lib/apiProviderContext.tsx` 建立 `ApiProviderContext`，型別為 `{ provider: 'claude' | 'gemini'; apiKey: string; setProvider: ...; setApiKey: ... }`，預設 provider 為 `'gemini'`，apiKey 為空字串，實作「Provider defaults to Gemini」scenario
- [x] 1.2 在 `src/App.tsx` 以 `useState` 管理 provider 和 apiKey，以 `ApiProviderContext.Provider` 包住整個 App，讓所有子元件可透過 `useContext` 取得

## 2. 移除 localStorage key 讀寫（移除 localStorage key，改為 session state）

- [x] 2.1 從 `src/lib/cardImport.ts` 刪除 `API_KEY_STORAGE_KEY` 常數、`getClaudeApiKey()` 和 `saveClaudeApiKey()` 函式，以及所有 `localStorage.getItem/setItem` 呼叫；`parseCardFromHtml` 和 `importCardFromUrl` 改為直接接收 `apiKey` 和 `provider` 參數，不再從 localStorage 讀取
- [x] 2.2 從 `src/pages/SettingsPage.tsx` 移除 `savedKey`、`apiKeyInput`、`apiKeySaved` 狀態及相關 UI（舊的 API key 輸入區塊），確保不再有任何 localStorage key 操作

## 3. 新增 Gemini API 支援（Gemini API 使用 generateContent endpoint）

- [x] 3.1 在 `src/lib/cardImport.ts` 修改 `parseCardFromHtml(html, apiKey, provider)` 函式：當 `provider === 'gemini'` 時，呼叫 `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`，POST body 格式為 `{ contents: [{ parts: [{ text: prompt }] }] }`；從回應中取 `candidates[0].content.parts[0].text` 作為原始文字，再傳入現有的 `parseClaudeResponse()` 解析
- [x] 3.2 在 `src/lib/cardImport.ts` 修改 `importCardFromUrl(url, apiKey, provider)` 和 `importCardFromHtml(html, apiKey, provider)` 加入 `provider` 參數，移除內部對 `getClaudeApiKey()` 的呼叫，改為接收外部傳入的 key，實作「Gemini extraction succeeds」scenario

## 4. 設定頁 Provider 選擇 UI（AI provider selection）

- [x] 4.1 在 `src/pages/SettingsPage.tsx` 新增 provider 切換按鈕（Claude / Gemini），預設選 Gemini；選 Gemini 時顯示提示「Gemini 提供免費方案，至 aistudio.google.com 申請」，選 Claude 時顯示「至 console.anthropic.com 申請」，實作「AI provider selection」requirement 的「Select Claude as provider」、「Select Gemini as provider」和「Provider defaults to Gemini」scenarios
- [x] 4.2 在 `src/pages/SettingsPage.tsx` 新增 API key 輸入欄位（type=password），輸入後呼叫 Context 的 `setApiKey`（不寫 localStorage）；已輸入 key 時顯示遮罩（後 4 碼）表示本次 session 已設定，實作「Claude API key configuration」requirement 的「Enter API key」scenario；Gemini key 輸入同理，實作「Gemini API key configuration」requirement 的「Enter Gemini API key for session」scenario
- [x] 4.3 在 `src/components/CardForm.tsx` 移除 `onNeedApiKey` prop，改為透過 `useContext(ApiProviderContext)` 取得 provider 和 apiKey；若 apiKey 為空則顯示引導訊息「請先在設定頁輸入 API Key」，實作「Import attempted without API key」scenario

## 5. 整合匯入流程

- [x] 5.1 在 `src/components/CardForm.tsx` 的匯入流程中，從 Context 取得 `{ provider, apiKey }` 後傳入 `importCardFromUrl(url, apiKey, provider)` 和 `importCardFromHtml(html, apiKey, provider)`，確保 401/403 錯誤仍顯示「Key 無效」提示，實作「Import card info from bank promotion URL」requirement 的「Invalid API key」scenario

## 6. 驗證與測試

- [x] 6.1 測試 Claude provider：輸入有效 Claude key → 匯入銀行網址 → 確認卡片資料預填正確
- [x] 6.2 測試 Gemini provider：輸入有效 Gemini key → 匯入銀行網址 → 確認卡片資料預填正確
- [x] 6.3 測試 session 清除：輸入 key 後重新整理頁面 → 確認 key 消失（設定頁輸入欄為空）
- [x] 6.4 確認 localStorage 中不再有任何 API key 相關項目（DevTools → Application → localStorage 確認）
- [x] 6.5 確認現有卡片資料（`travel-card-advisor-data`）不受影響
