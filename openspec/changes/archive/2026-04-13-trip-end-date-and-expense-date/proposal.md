## Why

使用者在建立旅程時無法預先設定結束日期，且在試算頁記帳時費用日期固定為「今天」，導致跨月旅程或補記帳情境下月費用上限的計算錯誤，也無法追蹤每筆消費實際發生的日期。

## What Changes

- 新增旅程表單加入「預計結束日期」欄位（選填）
- 旅程卡片顯示完整日期區間（開始日 ～ 結束日）
- CalcPage 記帳區塊加入「消費日期」選擇器，預設今天，範圍限制在旅程的開始與結束日之間
- 費用資料結構的 `date` 欄位沿用，但改由使用者手動選擇而非固定 `todayStr()`
- 月費用上限計算改用費用的實際 `date` 月份（需確認 `rewardCalc.ts` 已正確使用 `expense.date`）

## Capabilities

### New Capabilities

（無新增 capability）

### Modified Capabilities

- `trip-manager`：新增旅程時支援預填結束日期；旅程卡片顯示完整日期區間
- `expense-tracker`：記帳時可選消費日期，預設今天，限制在旅程日期範圍內

## Impact

- Affected specs: `trip-manager`, `expense-tracker`
- Affected code:
  - `src/pages/TripsPage.tsx` — 新增結束日期欄位與顯示
  - `src/pages/CalcPage.tsx` — 新增消費日期 picker
  - `src/types/index.ts` — 確認 Trip.endDate 型別符合（已有，無需改）
