## Why

建立旅程時，使用者需要手動查詢並輸入匯率，步驟繁瑣且容易出錯。出國目的地不限日本，現有 UI 也寫死 JPY，對其他國家出遊完全不支援。

## What Changes

- 新增旅程表單中的「JPY 匯率」欄位改造為「國家/幣別選擇器 + 自動帶入匯率」元件
- 提供 5 個熱門目的地 chip 按鈕：🇯🇵 日本（JPY）、🇰🇷 韓國（KRW）、🇪🇺 歐洲（EUR）、🇺🇸 美國（USD）、🇹🇭 泰國（THB）
- 選擇 chip 後，向 `open.er-api.com/v6/latest/TWD` 發起一次 GET 請求，自動計算並填入對應匯率（1 外幣 = NT$X）
- 使用者可手動修改自動帶入的匯率值
- Trip 資料結構的 `exchangeRate.currency` 從硬編碼的 `'JPY'` 改為動態選擇的幣別代碼

## Non-Goals

- 不支援「自訂幣別」輸入（5 個熱門 chip 以外的幣別留待未來）
- 不使用 Frankfurter API（不支援 TWD）
- 不做匯率快取或離線備援（網路失敗時顯示錯誤訊息，使用者可手動輸入）
- 不更動 CalcPage 的匯率顯示邏輯（只改建立旅程入口）

## Capabilities

### New Capabilities

- `trip-currency-selector`: 建立旅程時，透過熱門國家 chip 選擇幣別並自動帶入匯率

### Modified Capabilities

- `trip-manager`：新增旅程表單的幣別/匯率欄位 UI 改造

## Impact

- Affected specs: `trip-currency-selector`（new）、`trip-manager`（modified）
- Affected code:
  - `src/pages/TripsPage.tsx`（表單 UI 重構，新增 fetch 邏輯）
