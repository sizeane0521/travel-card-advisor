## Why

編輯卡片頁面存在多個 UI 問題：bankUrl 匯入後未帶入欄位、冗餘的「限新戶」標籤、永遠展開的新增加碼表單讓使用者困惑、行動支付加碼的月上限欄位因 flex-wrap 破版、以及頁面標題未置中。這些問題影響使用者的操作體驗與視覺一致性。

## What Changes

- **bankUrl 自動帶入**：從 URL 匯入卡片後，`importUrl` 自動填入 `bankUrl` 欄位（若欄位原本為空）
- **前往活動按鈕**：`bankUrl` 有值時，欄位下方顯示「前往活動頁面 ↗」連結
- **移除「限新戶」prerequisite**：新增新戶加碼時不再自動附加 `prerequisite: '限新戶'`；AI 匯入的新戶加碼規則也不再寫入此 prerequisite
- **新增加碼表單改為收合式**：「新戶加碼」與「特定店家加碼」兩個區塊的新增表單預設隱藏，點擊「＋ 新增加碼」按鈕才展開，新增完成後自動收合
- **月上限欄位破版修復**：行動支付加碼層級列的 flex 容器移除 `flex-wrap`，確保「%・月上限 NT$」標籤與輸入框同行
- **標題置中**：編輯/新增卡片頁的標題改為 absolute 定位，水平置中於頁面

## Non-Goals

- 不調整其他頁面的 UI
- 不修改卡片資料模型或儲存邏輯
- 不變更行動支付加碼的資料結構

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-settings`：bankUrl 欄位新增自動帶入行為與「前往活動」連結；新增加碼的 UI 互動模式改為收合式
- `payment-method-bonus`：層級列的月上限欄位排版修正

## Impact

- Affected specs: `card-settings`、`payment-method-bonus`
- Affected code: `src/components/CardForm.tsx`
