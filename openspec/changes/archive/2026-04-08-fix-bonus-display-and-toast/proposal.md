## Problem

明細頁「加碼額度狀態」面板有三個錯誤，試算頁記帳後缺少回饋提示：

1. **進度條數值錯誤**：顯示消費總額（如 NT$16,800）對比回饋金上限（NT$600），單位不一致。應顯示已累計的加碼回饋金額。
2. **新戶進度條不應出現**：使用者未勾選「新戶」，但「新戶日本實體消費加碼」的進度條仍出現。`StoreBonus` 缺乏 prerequisite 機制。
3. **行動支付進度條缺失**：交易包含行動支付加碼，但面板只遍歷 `storeBonus`，完全未顯示 `paymentMethodBonus` 的進度。
4. **試算頁記帳無 toast**：按「+記帳」後沒有任何回饋提示，使用者不知道本筆回饋明細。且 `prereqOverrides` 被重置，導致下一筆計算遺失行動支付條件。

## Root Cause

- `StoreBonus.cap` 在型別註解與計算邏輯中被當成「消費上限（spend cap）」處理，但實際是「回饋金上限（reward cap）」。`calcCardAdvice` 和 `calcExpenseReward` 累計 `e.amount` 與 `bonus.cap` 比較，單位錯誤。
- `StoreBonus` 沒有 `prerequisite` / `prerequisiteMet` 欄位，所有 storeBonus 條目無條件顯示與計算。
- `LedgerPage` 的 bonus panel 只遍歷 `card.storeBonus`，未納入 `card.paymentMethodBonus.tiers`。
- `CalcPage.handleRecordWithCard` 記帳後僅重置表單，無 toast 機制；且 `setPrereqOverrides({})` 清除了行動支付條件狀態。

## Proposed Solution

1. **Reward cap 修正**：將 `StoreBonus.cap` 重新詮釋為回饋金上限。`calcCardAdvice` 改為累計 `rewardBreakdown.store` 回饋金額（非消費額），`calcExpenseReward` 改為 `storeBonusReward = min(amount * rate / 100, remainingRewardCap)`。LedgerPage 進度條對應修改。
2. **StoreBonus prerequisite 機制**：新增 `prerequisite?: string` 和 `prerequisiteMet?: boolean` 欄位。計算與顯示時跳過 `prerequisite` 存在但 `prerequisiteMet !== true` 的 bonus。CalcPage 加入 toggle UI，CardForm 加入設定 UI，cardImport AI prompt 加入欄位。
3. **行動支付進度條**：LedgerPage bonus panel 新增遍歷 `paymentMethodBonus.tiers`，累計當月 `paymentMethodReward` 對比 `tier.monthlyCap`，跳過未啟用的 prerequisite tier。
4. **記帳 toast**：CalcPage 記帳後顯示頂部 toast（3 秒自動消失），內容為回饋明細。移除 `setPrereqOverrides({})` 以保留行動支付條件狀態。

## Success Criteria

- 明細頁加碼額度進度條顯示「已累計回饋金 / 回饋金上限」（如 NT$280 / NT$600），不再顯示消費總額
- 有 `prerequisite` 的 storeBonus（如「新戶」），若 `prerequisiteMet !== true` 則不顯示進度條且不計入回饋
- 明細頁顯示行動支付加碼的進度條（含月回饋上限與已使用量）
- 試算頁按「+記帳」後出現 toast 提示，顯示本筆回饋明細，3 秒後自動消失
- 連續記帳時行動支付 prerequisite 條件不被重置
- `npm run build` 無錯誤

## Impact

- 影響的 specs：`card-advisor`（store bonus cap 計算邏輯變更）、`payment-method-bonus`（LedgerPage 新增顯示）、`expense-tracker`（記帳 toast）
- 影響的程式碼：
  - `src/types/index.ts` — StoreBonus 新增 prerequisite 欄位、cap 註解更新
  - `src/lib/rewardCalc.ts` — calcCardAdvice / calcExpenseReward cap 邏輯改為 reward cap + prerequisite 過濾
  - `src/pages/LedgerPage.tsx` — 進度條累計改用回饋金額、prerequisite 過濾、新增行動支付 bar
  - `src/pages/CalcPage.tsx` — 記帳 toast、保留 prereqOverrides、storeBonus prerequisite toggle
  - `src/lib/cardImport.ts` — AI prompt 新增 prerequisite 欄位
  - `src/components/CardForm.tsx` — storeBonus prerequisite 設定 UI
