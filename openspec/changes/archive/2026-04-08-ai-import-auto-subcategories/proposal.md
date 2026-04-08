## Why

AI import 目前將銀行頁面上同一加碼區塊內的所有店家壓平成一個 `stores[]`，忽略了頁面上的視覺子分組（如「便利商店」、「樂園」、「百貨」）。使用者需要手動用「+分類」按鈕重建這些分組，體驗差且容易遺漏。

## What Changes

- AI import prompt 新增 `subCategories` 欄位，要求 AI 根據頁面視覺區塊自動輸出子分組（label + stores）
- Response parser 新增對 `subCategories` 的解析與映射
- `applyImportResult()` 在填入表單時自動帶入 `subCategories`
- 「+分類」按鈕功能不變，退為事後手動微調工具

## Capabilities

### New Capabilities

（無，此 change 擴展現有能力）

### Modified Capabilities

- `card-import-from-url`：AI prompt 新增 subCategories 提取指示；extraction schema 新增 `subCategories` 欄位；applyImportResult 新增 subCategories 映射
- `store-subcategory`：subCategories 現在可由 AI import 自動填入，不再只能手動新增

## Impact

- Affected code:
  - `src/lib/cardImport.ts` — AI prompt 修改、response parser 更新、applyImportResult 擴展
  - `src/types/index.ts` — 確認 `StoreBonus.subCategories` 型別（預期不需變更）
