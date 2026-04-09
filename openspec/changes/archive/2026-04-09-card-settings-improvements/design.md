## Context

目前卡片匯入流程僅支援 URL 抓取與手動貼入 HTML；AI prompt 將所有加碼規則（含新戶條件）統一輸出至 `storeRules`；CardForm 現有加碼區塊只能刪除，無法直接修改 rate/cap。

## Goals / Non-Goals

**Goals:**

- 在匯入面板加入 Vision API 辨識路徑（截圖貼上 + 檔案上傳）
- 將「新戶加碼」從 `storeBonus[]` 分離為獨立欄位 `newUserBonus[]`，讓 AI 辨識時自動分類
- 讓現有加碼區塊（store bonus、new user bonus、payment method tier）的 rate 與 cap 可以 inline 編輯

**Non-Goals:**

- 不支援多張截圖批次辨識
- 不修改 CORS proxy 架構
- 不變更 `paymentMethodBonus` 的資料模型結構

## Decisions

### 圖片辨識：multimodal API 呼叫方式

**決定**：分別新增 `callClaudeWithImage()` 與 `callGeminiWithImage()` helper，保持與現有 `callClaude()`/`callGemini()` 並行的設計，共用同一份 prompt 字串。

**理由**：Prompt 內容與文字辨識一致，只有 API payload 結構不同（Claude 用 `image` content block；Gemini 用 `inline_data`）。共用 prompt 避免維護兩份。

**替代方案考慮**：將圖片先送 OCR 轉成文字再走現有流程 → 不採用，因為 OCR 對表格/版面會失真，Vision API 直接辨識更準確。

### 圖片輸入 UI：貼上 + 上傳二合一

**決定**：在 import panel 加入貼上區（`onPaste` listener）與隱藏 `<input type="file">`，兩者都觸發同一個 `handleImageImport(base64, mimeType)` 函式。

**理由**：使用者在電腦截圖後最常用 Ctrl+V 貼上；手機使用者則需要檔案上傳。共用同一個處理函式減少重複邏輯。

### 新戶加碼資料模型：在 Card 新增獨立欄位

**決定**：在 `Card` 介面新增 `newUserBonus?: StoreBonus[]`，型別與 `storeBonus` 相同，但語義上代表「限新戶」的獨立區塊。

**理由**：重用 `StoreBonus` 型別（rate、cap、capPeriod、stores 結構一致）可以共用現有 UI 元件與計算邏輯，只需在 rendering 和計算時合併兩個陣列。

**替代方案考慮**：在 `StoreBonus` 加 `isNewUser: boolean` flag → 不採用，UI 上仍需拆分顯示，且舊資料沒有此欄位會有兼容性問題。

### AI Prompt 分離新戶加碼

**決定**：在 `parseCardFromHtml()` 的 prompt 中新增 `newUserBonusRules` 陣列欄位，說明「prerequisite 含新戶條件者一律放此陣列，不放 storeRules」。`CardImportResult` 同步新增 `newUserBonusRules` 欄位，`parseClaudeResponse()` 新增解析邏輯。

**理由**：讓 AI 在辨識階段就分類，而非在應用層後處理，更符合 prompt-driven 設計原則。

### 計算層整合 newUserBonus

**決定**：在 `rewardCalc.ts` 的 `findStoreBonus()` 中，搜尋範圍從 `card.storeBonus` 擴展為 `[...card.storeBonus, ...(card.newUserBonus ?? [])]`，計算邏輯不變。

**理由**：`newUserBonus` 的加碼計算邏輯（rate、cap、prerequisiteMet）與 `storeBonus` 完全相同，不需要另立計算路徑。

### Inline 編輯：直接 setState，不另開 modal

**決定**：將現有 `StoreBonus` 顯示的 rate/cap 改為 `<input>` 欄位，觸發對應 `updateBonus(idx, patch)` / `updateNewUserBonus(idx, patch)` / `updatePmTier(idx, patch)` helper。

**理由**：modal 增加操作層次，inline 編輯更直觀。現有刪除按鈕已採 inline 模式，保持一致。

## Risks / Trade-offs

- **圖片辨識準確率**：截圖品質差（模糊、低解析度）時辨識可能不準 → 辨識後顯示 missingFields 提示，使用者可補填
- **base64 大小**：高解析度截圖可能超過 API payload 限制 → 在前端讀取圖片後若超過 5MB 顯示警告，引導使用者縮小截圖
- **舊有卡片資料**：既有 Card 物件無 `newUserBonus` 欄位 → TypeScript optional field（`?`）確保向後相容，計算時用 `?? []` 處理
- **CalcPage storeBonusOverrides**：使用 bonus 的陣列 index 做 override key，合併後 index 語義需確認 → CalcPage 需改為對 `storeBonus` 和 `newUserBonus` 分別維護 override state，或保持合併陣列後的統一 index
