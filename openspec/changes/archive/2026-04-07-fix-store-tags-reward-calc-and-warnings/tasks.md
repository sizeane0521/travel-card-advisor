## 1. 型別定義更新

- [x] 1.1 在 `src/types/index.ts` 的 `Card` 介面新增選填欄位 `operationWarnings?: { paymentMethod: 'apple_pay' | 'google_pay'; message: string }[]`（設計決策：`operationWarnings` 作為 `Card` 的選填欄位），對應 card-advisor spec「Operation warnings on Card type」

## 2. 計算邏輯修正（rewardCalc.ts）

- [x] 2.1 修改 `getAllStoreNames()` (`src/lib/rewardCalc.ts`)：只從 `bonus.stores` 陣列取名稱，不再加入 `bonus.storeName`（設計決策：店家標籤只取 `stores[]`，不取 `storeName`），對應 expense-tracker spec「Record a single expense」中的 "Promotional bonus labels do not appear as store chips"
- [x] 2.2 修改 `calcCardAdvice()` (`src/lib/rewardCalc.ts`) 中的 store bonus 計算：將二元邏輯改為比例截斷（設計決策：`StoreBonus` 超額截斷改為比例計算）；計算 `remainingCap = max(0, bonus.cap - storeSpend)`、`eligibleAmount = min(amount, remainingCap)`，對應 card-advisor spec「Store bonus proportional cap truncation」
- [x] 2.3 更新 `calcExpenseReward()` (`src/lib/rewardCalc.ts`) 回傳值：新增 `breakdown: { base, store, paymentMethod, storeCapped, storeCapRemaining }` 欄位（設計決策：新增 `RewardBreakdown` 回傳結構於 `calcExpenseReward()`）；`base` = `floor(amount × baseRate / 100)`，`store` = `floor(eligibleAmount × bonus.rate / 100)`，`storeCapped` = `amount > remainingCap && remainingCap < bonus.cap`，`storeCapRemaining` = 截斷時的實際店家加碼回饋金額，對應 card-advisor spec「Reward breakdown structure in calcExpenseReward」

## 3. UI 顯示修正（ExpensePage.tsx）

- [x] 3.1 修改 `estimateReward()` (`src/pages/ExpensePage.tsx`) 改為回傳 `{ total, breakdown }` 結構（呼叫 `calcExpenseReward()` 並傳入 `amount` 和 `store`），對應 expense-tracker spec「Reward NT$ breakdown display in recommendation list」
- [x] 3.2 在推薦卡片列表的每個卡片 row 中，當 `twdAmount > 0` 時，用 `breakdown` 顯示回饋疊加明細：若只有基本回饋則顯示 `NT$X`；若有店家或行動支付加碼則顯示 `NT$X = 基本 NT$X + {storeName}加碼 NT$X + 行動支付加碼 NT$X`，對應 expense-tracker spec「Reward NT$ breakdown display in recommendation list」
- [x] 3.3 在推薦卡片列表的每個卡片 row 下方，當 `breakdown.storeCapped === true` 時，顯示 ⚠️ 警告文字「{storeName}加碼額度本次僅剩 NT${storeCapRemaining}，總額中已包含此部分」，對應 expense-tracker spec「Over-cap truncation warning in recommendation list」
- [x] 3.4 在推薦卡片列表的每個卡片 row 中，讀取 `advice.card.operationWarnings`，若存在符合目前 `paymentMethod` 的條目，在卡片 row 內顯示對應的 `message`（視覺樣式用琥珀/黃色文字），對應 expense-tracker spec「Operation warning display in recommendation list」及 card-advisor spec「Operation warnings on Card type」
