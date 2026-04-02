## Why

目前匯入功能只支援 Claude API，且 API key 永久存於 localStorage，存在被他人從瀏覽器 DevTools 查看的風險。改為支援 Gemini（有免費方案，門檻更低）並將 key 改為僅存於記憶體，可降低安全風險且提升朋友使用的便利性。

## What Changes

- 新增 Gemini API 支援：使用者可選擇以 Claude 或 Gemini key 進行卡片資訊解析
- **BREAKING**：API key 不再儲存於 localStorage，改為只存於 React 狀態（記憶體），關閉分頁即清除
- 設定頁新增 provider 選擇（Claude / Gemini），輸入對應 key 後即可使用，不自動儲存
- 移除 `travel-card-advisor-claude-api-key` localStorage key 的讀寫邏輯
- 匯入模組依 provider 選擇不同 API endpoint 和請求格式

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `card-import-from-url`：新增 Gemini provider 支援；API key 改為記憶體存取（不寫入 localStorage）
- `card-settings`：API key 設定 UI 改為 session-only 輸入，新增 provider 選擇

## Impact

- 受影響的規格：`card-import-from-url`、`card-settings`
- 受影響的程式碼：
  - `src/lib/cardImport.ts`（核心邏輯，移除 localStorage、新增 Gemini 呼叫）
  - `src/components/CardForm.tsx`（接收 provider + key 作為 props 或 context）
  - `src/pages/SettingsPage.tsx`（provider 選擇 UI、session key 輸入）
- 外部依賴新增：Google Gemini API（`generativelanguage.googleapis.com`）
