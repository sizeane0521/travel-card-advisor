## Why

介面中與金額相關的資訊視覺層級不清晰，導致使用者需要花時間找到最重要的數字（換算台幣、回饋總額）；同時旅程卡片缺少幣別/匯率資訊，且「+刷卡」按鈕存在因結束日期判斷錯誤而無法記帳的 bug。

## What Changes

- **旅程卡片**顯示已設定的幣別與匯率（如 `JPY · 0.21`）
- **試算頁換算金額**（`≈ NT$X`）改為大字高亮，與輸入欄有明確視覺層級
- **信用卡卡片中回饋總額**（`NT$XXX`）改為主要資訊，拆解說明降為次要層級
- **Bug 修正**：`handleRecordWithCard` 對 `activeTrip.endDate` 的判斷過於嚴格，導致設有未來結束日期的旅程無法點擊「+刷卡」

## Non-Goals

- 不調整回饋拆解的計算邏輯
- 不新增或移除任何資料欄位
- 不改變旅程 / 消費的資料結構

## Capabilities

### New Capabilities

（none）

### Modified Capabilities

- `trip-manager`：旅程卡片新增幣別/匯率顯示
- `expense-tracker`：修正 +刷卡 bug；試算頁換算金額視覺層級強化
- `card-advisor`：信用卡回饋總額視覺層級強化，拆解說明降格

## Impact

- Affected specs: `trip-manager`, `expense-tracker`, `card-advisor`
- Affected code:
  - `src/pages/TripsPage.tsx`（旅程卡片新增幣別/匯率）
  - `src/pages/CalcPage.tsx`（+刷卡 bug、換算金額、回饋顯示層級）
