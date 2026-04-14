## Problem

試算頁存在兩個邏輯錯誤：

1. **推薦排序依回饋率而非實際回饋金額**：當某張卡的行動支付加碼已接近上限時，雖然理論回饋率仍較高，但實際估算回饋金額卻低於其他卡片，系統仍錯誤地將其標為「推薦」。例如聯邦吉鶴卡 4%（但行動支付加碼僅剩 NT$451）實際回饋 NT$15,361，低於國泰 Cube 3% 的 NT$17,892，卻仍排在第一。

2. **行動支付加碼已達上限時沒有視覺提示**：detail row 顯示 `行動支付加碼 451`，但不標示這是受 monthly cap 截斷的金額，使用者無從得知加碼已用完。

## Root Cause

1. `getSortedRecommendations`（`rewardCalc.ts:355-359`）排序依據是 `effectiveRate`（理論回饋率%），沒有考慮 monthly cap 截斷後的實際回饋金額。
2. `calcExpenseReward` 回傳的 `RewardBreakdown` 型別沒有 `paymentMethodCapped` 欄位，CalcPage 無法判斷行動支付加碼是否被截斷。

## Proposed Solution

1. **排序改為依實際 estimatedReward**：在 CalcPage 有 `validAmount` 時，於 recommendations 全部計算完 `estimatedReward` 後，以 `estimatedReward` 降序重新排序（無 `validAmount` 時維持原本的 `effectiveRate` 排序）。改動僅在 `CalcPage.tsx`，不改 `getSortedRecommendations` 的邏輯。

2. **在 breakdown 新增 `paymentMethodCapped`**：在 `rewardCalc.ts` 的 `RewardBreakdown` interface 加入 `paymentMethodCapped: boolean`，在 `calcExpenseReward` 中判斷（`pmBonus.bonusReward < floor(twdAmount * pmBonus.bonusRate / 100)` 為 true 即已被 cap），並在 CalcPage 的 detail row 中，若 `paymentMethodCapped` 為 true，顯示 `行動支付加碼 {N}（已達上限）`。

## Non-Goals

- 不改變無金額時的排序行為（維持 effectiveRate 排序）
- 不改變 store bonus capped 的現有顯示邏輯（已有 `storeCapped` 欄位與 warning）
- 不修改 `getSortedRecommendations` 的函式簽名

## Success Criteria

- 輸入金額後，實際估算回饋最高的卡片排在最上方並標為「推薦」
- 行動支付加碼被 monthly cap 截斷時，detail row 顯示 `行動支付加碼 N（已達上限）`
- 無金額時排序行為不變

## Impact

- Affected code:
  - `src/lib/rewardCalc.ts`（`RewardBreakdown` interface + `calcExpenseReward`）
  - `src/pages/CalcPage.tsx`（排序邏輯 + detail row 顯示）
