## Why

記帳頁面的行動支付體驗有四個問題：行動支付費率疊加後正確但沒有在 UI 顯示（吉鶴卡應顯示 4.0% 而非 1.5%）、付款方式預設為「實體卡」而非行動支付、有條件的 tier（例如前月帳單滿額）無法在記帳時動態勾選、「最佳推薦」badge 插在卡名前導致信用卡名稱對不齊。

## What Changes

- **Rate stacking 顯示修正**：已有正確 `paymentMethodBonus` 的卡片，在選取行動支付後，推薦列表 effectiveRate 應顯示 base + pmBonus 的合計（例如 2.5% + 1.5% = 4.0%）；舊格式卡片需重新辨識以更新資料
- **付款方式預設改為 Apple Pay**：記帳頁 payment method chip 順序改為 Apple Pay → Google Pay → 實體卡，預設選中 Apple Pay
- **條件 tier 動態勾選**：當選中行動支付且某張推薦卡有 `prerequisite` 的 tier 時，在該卡的推薦行底下顯示可勾選的條件列表（例如「✓ 前月帳單滿 30,000 元 (+1%)」），勾選後即時更新 effectiveRate 及回饋估算；此勾選狀態僅影響當筆記帳，不修改卡片設定
- **最佳推薦 badge 移位**：將「🌟 最佳推薦」從卡名同行移至卡片內容區塊上方獨立一行，讓所有卡片名稱左側對齊

## Non-Goals

- 不修改 `rewardCalc.ts` 的計算邏輯（已正確）
- 不新增「自動偵測帳單是否滿額」功能（需連接銀行資料，超出範圍）
- 不修改 Google Pay 的 prerequisite 機制（與 Apple Pay 相同邏輯）

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `expense-tracker`：記帳頁行動支付付款方式預設、條件 tier 動態勾選、最佳推薦 badge 重新定位
- `payment-method-bonus`：prerequisite tier 的 per-expense 勾選機制

## Impact

- Affected specs: `expense-tracker`, `payment-method-bonus`
- Affected code: `src/pages/ExpensePage.tsx`, `src/lib/rewardCalc.ts`（新增 prerequisites override 參數）
