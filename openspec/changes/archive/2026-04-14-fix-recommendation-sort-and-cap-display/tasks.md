## 1. 新增 paymentMethodCapped 到 RewardBreakdown

- [x] 1.1 在 `src/lib/rewardCalc.ts` 的 `RewardBreakdown` interface（約 line 30-36）加入 `paymentMethodCapped: boolean` 欄位，並加上 JSDoc 說明：`true if payment method bonus was truncated by monthly cap`
- [x] 1.2 在 `calcExpenseReward` 的回傳值（約 line 329-339）計算 `paymentMethodCapped`：判斷式為 `pmBonus.bonusRate > 0 && pmBonus.bonusReward < Math.floor(amount * pmBonus.bonusRate / 100)`，將結果加入 breakdown 回傳
- [x] 1.3 更新同函式中 `advice.isFull` 的 early return（約 line 288），在 breakdown 中加入 `paymentMethodCapped: false`

## 2. 有金額時依 estimatedReward 重新排序

- [x] 2.1 在 `src/pages/CalcPage.tsx` 中，於 `recommendations` 計算完成後（約 line 146-148），新增一個 `sortedRecommendations` 變數：當 `validAmount` 為 true 時，先對 recommendations 中每張非 isFull 的卡片呼叫 `calcExpenseReward` 計算 estimatedReward，然後以 estimatedReward 降序排列（isFull 的卡片維持沉底）；`validAmount` 為 false 時，直接使用原本的 `recommendations`
- [x] 2.2 將原本 JSX 中所有使用 `recommendations` 的地方改為使用 `sortedRecommendations`（包含 `.map()`、`bestCardId` 計算、`effectiveSelectedCardId` 計算）

## 3. detail row 顯示「已達上限」

- [x] 3.1 在 `src/pages/CalcPage.tsx` 的 detail parts 組裝邏輯（`detailParts` 陣列，約 line 541-555）中，找到 `行動支付加碼` 那一項的 push，改為：`breakdown.paymentMethodCapped ? \`行動支付加碼 ${breakdown.paymentMethod.toLocaleString()}（已達上限）\` : \`行動支付加碼 ${breakdown.paymentMethod.toLocaleString()}\``

## 4. 驗證

- [x] 4.1 Build 確認 TypeScript 無錯誤（`npm run build`）
- [x] 4.2 在有多張卡片、其中一張行動支付加碼已近上限的情境下，輸入大金額，確認實際回饋最高的卡片排在最上方並標為「推薦」
- [x] 4.3 確認行動支付加碼被 monthly cap 截斷時，detail row 顯示 `行動支付加碼 N（已達上限）`
- [x] 4.4 確認未輸入金額時，推薦排序仍依 effectiveRate%（不受影響）
