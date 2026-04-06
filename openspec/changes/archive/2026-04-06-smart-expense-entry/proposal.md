## Why

記帳頁目前要求使用者先選好信用卡才能輸入金額，但使用者在輸入前根本不知道哪張卡最划算，導致推薦頁和記帳頁職責分裂、流程不合理。應改為「先輸入金額與店家，App 即時排序並自動選最優卡」。

## What Changes

- 移除記帳表單中的信用卡下拉選單
- 新增輸入驅動的即時卡片推薦清單：輸入金額或選擇店家後，卡片依回饋率即時排序，最優卡自動選中
- 最優卡顯示消費上限剩餘進度條（視覺化）
- 店家選單改為 chip 快速選擇，有加碼的店家優先顯示，超過 5 個以「更多」展開
- 有旅程匯率時，金額輸入框下方即時顯示換算台幣（≈ NT$XXX）
- 頁面標題列右側顯示「本次旅程 N 筆」摘要
- 送出後金額清空、店家重置為一般消費

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `expense-tracker`: 記帳表單從「先選卡」改為「即時推薦選卡」，新增筆數摘要顯示
- `foreign-currency-expense`: 新增即時換算顯示（輸入時即時顯示 ≈ NT$ 換算）

## Impact

- Affected specs: expense-tracker, foreign-currency-expense
- Affected code: `src/pages/ExpensePage.tsx`（主要改動）、`src/lib/rewardCalc.ts`（確認無需修改）
