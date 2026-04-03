## Why

目前的 `MonthlyCap` 資料模型過於簡化，無法表達台灣銀行信用卡常見的「主回饋上限 + 特定通路附加上限」複合結構，導致擷取結果不準確，且 Advisor 頁面的顯示重點（回饋率）與使用者海外刷卡時的實際決策依據（剩餘可用額度）不符。

## What Changes

- **BREAKING** 擴展 `MonthlyCap` 型別，支援主 cap 與多個附加 cap（storeBonus 層級各自獨立上限）
- 更新 `rewardCalc.ts` 的計算邏輯，正確處理複合上限結構
- 調整 `cardImport.ts` 的 AI 提示詞，引導模型解析複雜上限結構並輸出新格式
- 更新 `AdvisorPage.tsx`，將「剩餘可用額度」顯示順序提前，比回饋率更突出
- 更新 `CardForm.tsx` 以對應新的資料結構

## Non-Goals

- 不支援非海外消費場景（國內刷卡回饋計算）
- 不新增卡片；僅調整現有卡片資料模型與顯示邏輯
- 不修改 CORS proxy 或 AI 供應商切換邏輯

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-advisor`: 剩餘額度的顯示邏輯與排序依據改變，需更新 Advisor 推薦排序規則
- `card-import-from-url`: AI 提示詞輸出格式改變，需更新擷取結果的欄位定義

## Impact

- Affected specs: `card-advisor`, `card-import-from-url`
- Affected code:
  - `src/types/index.ts` — MonthlyCap 型別擴展
  - `src/lib/rewardCalc.ts` — 複合上限計算邏輯
  - `src/lib/cardImport.ts` — AI 提示詞與解析邏輯
  - `src/pages/AdvisorPage.tsx` — 剩餘額度顯示順序
  - `src/components/CardForm.tsx` — 表單對應新資料結構
