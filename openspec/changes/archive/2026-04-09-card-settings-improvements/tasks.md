## 1. 資料模型

- [x] 1.1 在 `src/types/index.ts` 的 `Card` 介面新增 `newUserBonus?: StoreBonus[]` 欄位（新戶加碼資料模型：在 Card 新增獨立欄位）

## 2. AI 辨識層：AI Prompt 分離新戶加碼

- [x] 2.1 在 `src/lib/cardImport.ts` 的 `CardImportResult` 介面新增 `newUserBonusRules` optional 陣列欄位，結構與 `storeRules` 相同但不含 `prerequisite`
- [x] 2.2 更新 `parseCardFromHtml()` 的 prompt 字串：在 JSON schema 加入 `newUserBonusRules` 陣列說明，並說明「prerequisite 為限新戶/限首次/限初次者一律放入 newUserBonusRules，不放 storeRules」；同步更新 prompt 範例（Import card info from bank promotion URL）
- [x] 2.3 更新 `parseClaudeResponse()` 新增解析 `newUserBonusRules` 陣列的邏輯，仿照現有 `storeRules` 解析流程

## 3. 圖片辨識 API 層：multimodal API 呼叫方式

- [x] 3.1 在 `src/lib/cardImport.ts` 新增 `callClaudeWithImage(base64: string, mimeType: string, apiKey: string): Promise<string>`，使用圖片辨識：multimodal API 呼叫方式（Claude image content block + text prompt block），model 同為 `claude-haiku-4-5-20251001`
- [x] 3.2 在 `src/lib/cardImport.ts` 新增 `callGeminiWithImage(base64: string, mimeType: string, apiKey: string): Promise<string>`，使用 Gemini `inline_data` payload
- [x] 3.3 新增公開函式 `importCardFromImage(base64: string, mimeType: string, apiKey: string, provider: ApiProvider): Promise<CardImportResult>`，呼叫對應 provider 的 image helper，並套用同一份 prompt（Import card info from screenshot or image file）

## 4. 計算層整合 newUserBonus

- [x] 4.1 在 `src/lib/rewardCalc.ts` 的 `findStoreBonus()` 函式，將搜尋範圍從 `card.storeBonus` 改為 `[...card.storeBonus, ...(card.newUserBonus ?? [])]`（計算層整合 newUserBonus）
- [x] 4.2 在 `getAllStoreNames()` 同步加入 `card.newUserBonus` 的 stores 搜尋，確保新戶加碼的店家名稱出現在自動完成清單

## 5. CardForm：圖片輸入 UI（貼上 + 上傳二合一）

- [x] 5.1 在 `src/components/CardForm.tsx` 的 import panel（`showImportPanel` 區塊）加入圖片輸入 state：`importImage: { base64: string; mimeType: string; preview: string } | null` 與 `importing` 共用
- [x] 5.2 在 import panel div 加入 `onPaste` handler，偵測 `ClipboardEvent.clipboardData.files` 中的圖片，讀取後轉 base64 並更新 `importImage` state（圖片輸入 UI：貼上 + 上傳二合一）
- [x] 5.3 加入隱藏 `<input type="file" accept="image/*">` 與對應按鈕「選擇圖片檔案」，選取後同樣讀取 base64 並更新 `importImage` state
- [x] 5.4 顯示截圖縮圖預覽（`<img src={importImage.preview}>`）與「開始辨識」按鈕
- [x] 5.5 實作 `handleImageImport()`：若圖片超過 5 MB 顯示警告並返回；否則呼叫 `importCardFromImage()`，成功後呼叫 `applyImportResult()`，失敗後呼叫 `handleImportError()`

## 6. CardForm：新戶加碼獨立區塊（New-user bonus as independent card field）

- [x] 6.1 在 `CardForm` 新增 `newUserBonuses: StoreBonus[]` state 以支援 New-user bonus as independent card field，初始值從 `card?.newUserBonus ?? []`
- [x] 6.2 在 `applyImportResult()` 新增對 `result.newUserBonusRules` 的對映，轉為 `StoreBonus[]`（prerequisite 固定為 "限新戶"，prerequisiteMet 預設 false），更新 `newUserBonuses` state
- [x] 6.3 在 CardForm 表單中，於「特定店家加碼」區塊之前插入「新戶加碼」獨立區塊，使用相同的 card panel 佈局與操作按鈕（＋店家、＋分類、刪除）
- [x] 6.4 在 `handleSubmit()` 中將 `newUserBonuses` 加入 `onSave` 的 card 物件 `newUserBonus` 欄位

## 7. CardForm：Inline 編輯（Inline 編輯：直接 setState，不另開 modal）

- [x] 7.1 新增 `updateBonus(idx: number, patch: Partial<StoreBonus>)` helper，透過 `setBonuses` 更新指定 index 的 bonus
- [x] 7.2 新增 `updateNewUserBonus(idx: number, patch: Partial<StoreBonus>)` helper，透過 `setNewUserBonuses` 更新指定 index
- [x] 7.3 新增 `updatePmTier(idx: number, patch: Partial<PaymentMethodBonusTier>)` helper，透過 `setPmTiers` 更新指定 index
- [x] 7.4 在「特定店家加碼」的每個 StoreBonus card panel，將 rate 和 cap 的顯示改為 `<input type="number">` inline 欄位，onChange 呼叫 `updateBonus()`（Inline editing of bonus rate and cap in CardForm）
- [x] 7.5 在「新戶加碼」的每個 StoreBonus card panel 同步套用 inline 編輯欄位，onChange 呼叫 `updateNewUserBonus()`
- [x] 7.6 在每個 PaymentMethodBonusTier 的顯示中，將 rate 和 monthlyCap 改為 `<input type="number">` inline 欄位，onChange 呼叫 `updatePmTier()`
