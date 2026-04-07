## Why

AI 辨識信用卡功能將行動支付加碼（Apple Pay / Google Pay）錯誤地放入 `storeBonus[]`，導致行動支付加碼「取代」基本回饋率，而非「疊加」。月上限金額也因此遺失，使用者在設定後看不到行動支付加碼效果。

## What Changes

- `CardImportResult` 介面新增 `paymentMethodBonusTiers` 欄位，用於回傳行動支付加碼的每個 tier（費率 + 月上限 + 前提條件）
- AI Prompt 新增指示：偵測到行動支付關鍵字（Apple Pay、Google Pay、行動支付、感應支付）時，輸出至 `paymentMethodBonusTiers` 而非 `storeRules`
- `parseClaudeResponse()` 解析新的 `paymentMethodBonusTiers` 欄位
- `CardForm.applyImportResult()` 將 `paymentMethodBonusTiers` 自動填入行動支付加碼表單（啟用開關 + 設定 tiers + 預設勾選 Apple Pay / Google Pay）

## Non-Goals

- 不修改 `rewardCalc.ts`（計算邏輯已正確）
- 不修改 `ExpensePage.tsx`（店家搜尋輸入匡已實作，只需重新部署即可顯示）
- 不支援除行動支付以外的其他加碼通路自動分類

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `expense-tracker`: AI 辨識行動支付加碼時，系統 SHALL 將其輸出為 `paymentMethodBonus`（疊加費率）而非 `storeBonus`（取代費率），並保留每個 tier 的月上限與前提條件

## Impact

- Affected code: `src/lib/cardImport.ts`, `src/components/CardForm.tsx`
