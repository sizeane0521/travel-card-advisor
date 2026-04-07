## Why

使用者在記帳時無法區分「刷實體卡」與「用行動支付（Apple Pay / Google Pay）」，但部分信用卡在行動支付時有額外加碼（如賀吉卡 Google/Apple Pay 最高 +2.5%），且加碼有條件（前月帳單門檻）與月上限，導致推薦的有效回饋率不準確，使用者也不知道該拿哪個 Pay 出來。

## What Changes

- 新增 `PaymentMethodBonus` 資料結構：支援多層加碼、月上限，以及使用者宣告式的前置條件（prerequisite）
- `Card` 型別新增 `paymentMethodBonus` 欄位
- 卡片設定（CardForm）新增付款方式加碼設定區塊，含條件勾選
- 記帳頁（ExpensePage）新增「付款方式」選擇（Apple Pay / Google Pay / 實體卡）
- 推薦排序邏輯納入付款方式加碼，顯示各卡的有效回饋率與建議付款方式
- 每筆消費記錄儲存所選付款方式

## Capabilities

### New Capabilities

- `payment-method-bonus`: 付款方式加碼資料模型、條件宣告、計算邏輯，以及 UI 整合（卡片設定 + 記帳頁推薦）

### Modified Capabilities

- `card-settings`: Card 型別新增 `paymentMethodBonus[]` 欄位；CardForm 新增付款方式加碼設定與條件勾選 UI
- `expense-tracker`: Expense 型別新增 `paymentMethod` 欄位；記帳頁新增付款方式選擇；推薦排序納入行動支付加碼計算

## Impact

- Affected specs: `payment-method-bonus`（新）、`card-settings`（修改）、`expense-tracker`（修改）
- Affected code:
  - `src/types/index.ts` — 新增 `PaymentMethodBonus` 介面，`Card` 與 `Expense` 型別擴充
  - `src/lib/rewardCalc.ts` — `calcCardAdvice` / `getSortedRecommendations` 納入付款方式加碼邏輯
  - `src/components/CardForm.tsx` — 新增付款方式加碼設定 UI
  - `src/pages/ExpensePage.tsx` — 新增付款方式選擇，推薦卡片顯示建議付款方式
  - `src/store/useStore.tsx` — 如需更新 dispatch 型別
  - `src/store/storage.ts` — 儲存新欄位的向下相容處理
