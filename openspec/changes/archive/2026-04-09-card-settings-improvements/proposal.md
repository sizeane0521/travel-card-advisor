## Why

新增卡片時，官網 HTML 辨識有時不完整，需要截圖貼上作為替代辨識方式；同時「新戶加碼」被 AI 歸入「特定店家加碼」而無法獨立顯示與管理；現有加碼區塊的 rate/cap 欄位也無法直接 inline 編輯，彈性過低。

## What Changes

- **新增**：匯入面板支援截圖貼上（Ctrl+V）與圖片檔案上傳，透過 Claude/Gemini Vision API 辨識卡片資訊
- **新增**：`Card` 型別加入 `newUserBonus?: StoreBonus[]` 欄位，將「限新戶」加碼獨立為一個頂層類型
- **新增**：AI 辨識 prompt 加入 `newUserBonusRules` 陣列，讓模型自動將新戶加碼分離
- **修改**：`CardForm` 加碼區塊顯示 inline 可編輯的 rate（%）和 cap（NT$）輸入欄位
- **修改**：獎勵計算邏輯合併 `newUserBonus` 與 `storeBonus` 一起搜尋

## Capabilities

### New Capabilities

- `card-import-from-image`：允許使用者貼上截圖或上傳圖片檔案，透過 AI Vision 自動辨識信用卡回饋資訊，作為 URL 辨識失敗時的替代方案

### Modified Capabilities

- `card-import-from-url`：AI prompt 新增 `newUserBonusRules` 欄位規則，辨識結果同時回傳新戶加碼資料；`parseClaudeResponse()` 新增解析邏輯
- `card-settings`：Card 資料模型新增 `newUserBonus` 欄位；CardForm 新增新戶加碼獨立區塊；現有加碼 rate/cap 改為 inline 可編輯

## Impact

- 受影響的 specs：`card-import-from-url`、`card-settings`
- 受影響的程式碼：
  - `src/lib/cardImport.ts`：新增圖片辨識函式、更新 AI prompt、更新 parseClaudeResponse
  - `src/types/index.ts`：Card 介面新增 `newUserBonus?: StoreBonus[]`
  - `src/components/CardForm.tsx`：圖片上傳 UI、新戶加碼區塊、inline 編輯欄位
  - `src/lib/rewardCalc.ts`：`findStoreBonus()` 合併 `newUserBonus` 搜尋範圍
