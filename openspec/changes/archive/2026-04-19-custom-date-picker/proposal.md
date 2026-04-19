## Why

所有日期輸入目前使用原生 `<input type="date">`，在行動端只有點擊日曆 icon 才能觸發選擇器，且各平台（iOS 轉盤、Android 日曆、桌面對話框）外觀不一，與 App 暗金設計風格完全不符。需要統一的自訂 DatePicker 元件，提供一致的視覺體驗與互動行為。

## What Changes

- 新增共用元件 `DatePicker`（Popover 月曆，暗金主題），接受 `value`、`onChange`、`min`、`max` props
- 點擊輸入框任意位置即彈出月曆，點擊日期後自動關閉並更新值
- 點擊元件外部關閉月曆
- 以 `DatePicker` 取代以下 5 處 `<input type="date">`：`CalcPage`、`LedgerPage`（inline edit）、`TripsPage`（開始/結束日期）、`CardForm`（validFrom/validTo）
- `TripsPage` 新增旅程表單驗證：必填欄位（名稱、幣別、匯率）標示 `*`，點「建立」時同時驗證所有必填欄位並顯示錯誤
- 幣別由選填改為必填
- 旅程卡片新增「編輯」按鈕，展開 inline edit form 可修改名稱、日期、匯率
- `store/useStore.tsx` 新增 `UPDATE_TRIP` action

## Capabilities

### New Capabilities

- `date-picker`: 自訂 Popover 月曆選擇器元件，支援 min/max 日期限制，符合 App 暗金設計風格

### Modified Capabilities

(none)

## Impact

- Affected specs: `date-picker`（新）
- Affected code:
  - `src/components/DatePicker.tsx`（新建）
  - `src/pages/CalcPage.tsx`
  - `src/pages/LedgerPage.tsx`
  - `src/pages/TripsPage.tsx`
  - `src/components/CardForm.tsx`
  - `src/store/useStore.tsx`
