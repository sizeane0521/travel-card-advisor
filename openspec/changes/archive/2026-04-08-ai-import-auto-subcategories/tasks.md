## 1. 型別更新

- [x] 1.1 在 `src/lib/cardImport.ts` 的 `CardImportResult` 介面中，為 `storeRules` 每個 entry 新增可選欄位 `subCategories?: { label: string; stores: string[] }[]`（在 storeRules 內新增 subCategories 欄位（而非獨立欄位），理由：subCategories 天然屬於其對應的加碼條件）

## 2. AI Prompt 修改

- [x] 2.1 在 `src/lib/cardImport.ts` 的 `parseCardFromHtml()` 函數 prompt 中，於 `storeRules` schema 描述新增 `subCategories` 欄位說明：「若頁面在此加碼條件下有視覺上的子分組標題（如「便利商店」、「樂園」），請以 `subCategories` 陣列回傳，每個物件含 `label`（子標題文字）與 `stores`（該子分組的店家列表）；若無明顯視覺子分組則省略此欄位」（subCategories 為可選欄位，向後相容）
- [x] 2.2 在同一 prompt 的範例 JSON 中，更新 `storeRules` 範例：將原有 `stores` 陣列拆成「便利商店」（7-ELEVEN, FamilyMart, LAWSON）和「熱門景點」（東京迪士尼, 大阪環球影城）兩個 subCategories，同時保留扁平的 `stores` 包含所有店家（Prompt 新增範例展示 subCategories 結構）

## 3. Response Parser 更新

- [x] 3.1 在 `src/lib/cardImport.ts` 的 `parseClaudeResponse()`（或等效的 response parsing 函數）中，確認 `storeRules` 每個 entry 在 parse 後保留 `subCategories` 欄位（若 AI 有回傳）；若 AI 未回傳 `subCategories` 則保持 undefined（不補空陣列）（import card info from bank promotion URL）

## 4. applyImportResult 對應更新

- [x] 4.1 在 `src/components/CardForm.tsx` 的 `applyImportResult()` 函數中（約 L212-229），將 `subCategories: []` 改為 `subCategories: r.subCategories ?? []`，使 AI 回傳的子分類自動帶入表單狀態（AI import auto-populates subCategories from page visual structure）

## 5. 驗證

- [x] 5.1 用國泰 CUBE 卡或任一有視覺分組的銀行頁面測試 AI import，確認 StoreBonus 的 `subCategories` 正確被填入（stores[] 與 subCategories 中的店家名稱允許重複）
- [x] 5.2 確認消費頁面的「展開分類」UI 正確顯示 import 帶入的子分類（category browser in expense store selector）
- [x] 5.3 用無視覺分組的銀行頁面測試，確認 subCategories 為空陣列且行為與原本一致（no visual sub-groups on page leaves subCategories empty）
