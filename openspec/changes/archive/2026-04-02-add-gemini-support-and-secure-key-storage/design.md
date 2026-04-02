## Context

目前 `src/lib/cardImport.ts` 寫死呼叫 Claude API，key 透過 `getClaudeApiKey()` 從 localStorage 讀取。`SettingsPage.tsx` 有一個永久儲存 key 的輸入欄位。

本次變更涉及：新增外部 API provider（Gemini）、改變 key 的生命週期（localStorage → 記憶體）、跨多個元件傳遞 provider/key 狀態。

## Goals / Non-Goals

**Goals:**

- 支援 Claude 和 Gemini 兩種 provider，使用者選一種輸入對應 key
- API key 只存活於當次瀏覽器 session（React state），關閉分頁後消失
- 移除所有 localStorage key 讀寫邏輯

**Non-Goals:**

- 不同時支援兩個 provider（使用者在設定頁選一個，只輸入一個 key）
- 不支援 OAuth 或其他非 API key 的認證方式
- 不提供 key 驗證（輸入後直到實際呼叫 API 才知道是否有效）

## Decisions

### Provider + Key 以 React Context 向下傳遞

**決策**：在 `App.tsx`（或 `SettingsPage`）建立 `ApiProviderContext`，存放 `{ provider: 'claude' | 'gemini', apiKey: string }`，`CardForm` 透過 `useContext` 取得，不再接收 `onNeedApiKey` prop。

**理由**：key 需要在 `SettingsPage`（設定）和 `CardForm`（使用）兩個不同頁面共用，Context 比 prop drilling 乾淨；且 Context 的值天然存在記憶體，不需額外處理生命週期。

**替代方案**：prop drilling（`onNeedApiKey` 現況）→ `CardForm` 要往上傳，但設定頁和卡片頁是平行路由，傳遞困難，捨棄。

### Gemini API 使用 generateContent endpoint

**決策**：呼叫 `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=<apiKey>`，POST body 格式與 Claude 不同，需在 `parseCardFromHtml` 內依 provider 分支。

**理由**：Gemini Flash 免費方案足夠，latency 低，適合解析網頁文字。

**替代方案**：用 `@google/generative-ai` SDK → 增加 bundle 大小，直接 fetch 已夠用，捨棄。

### 移除 localStorage key，改為 session state

**決策**：刪除 `getClaudeApiKey()` / `saveClaudeApiKey()`，改為在 `ApiProviderContext` 的 Provider 元件中以 `useState` 管理；`SettingsPage` 的 key 輸入欄不再呼叫 `localStorage.setItem`。

**理由**：`useState` 的值在 React tree unmount（關閉分頁）後自然消失，無需額外清理邏輯；且零 localStorage 讀寫意味著開發者工具中找不到 key。

## Risks / Trade-offs

- [取捨] 每次開 App 都要重新輸入 key → 對使用情境（一年一兩次解析）可接受，已與使用者確認
- [風險] Context value 在頁面重新整理後消失 → 預期行為，符合零風險設計
- [風險] Gemini API CORS 限制 → Gemini `generateContent` endpoint 支援 browser direct call（與 Claude `anthropic-dangerous-direct-browser-calls` 類似），需測試確認
