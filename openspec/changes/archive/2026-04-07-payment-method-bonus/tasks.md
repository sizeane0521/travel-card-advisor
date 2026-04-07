## 1. 資料模型擴充

- [x] 1.1 在 `src/types/index.ts` 新增 `PaymentMethodBonusTier` 介面：`{ rate: number; monthlyCap: number; prerequisite?: string; prerequisiteMet?: boolean }`，實作 PaymentMethodBonus data model（設計決策：PaymentMethodBonus 資料結構採多層 tiers 而非單一 rate，各 tier 有獨立月上限）
- [x] 1.2 在 `src/types/index.ts` 新增 `PaymentMethodBonus` 介面：`{ methods: ('apple_pay' | 'google_pay')[]; tiers: PaymentMethodBonusTier[] }`
- [x] 1.3 在 `src/types/index.ts` 的 `Card` 介面新增選填欄位 `paymentMethodBonus?: PaymentMethodBonus`
- [x] 1.4 在 `src/types/index.ts` 的 `Expense` 介面新增 `paymentMethod?: 'apple_pay' | 'google_pay' | 'physical'` 與 `paymentMethodReward?: number`，實作 Expense 新增 paymentMethod 與 paymentMethodReward 欄位

## 2. 計算邏輯

- [x] 2.1 在 `src/lib/rewardCalc.ts` 新增 `calcPaymentMethodBonus(card, paymentMethod, tripExpenses, monthStr?)` helper 函式：依序計算每個符合條件 tier（prerequisiteMet !== false）的可用額度，回傳 `{ bonusRate: number; bonusReward: number }` 並各別套用月上限（從 `tripExpenses` 的 `paymentMethodReward` 累計），實作 payment method bonus monthly cap tracking
- [x] 2.2 修改 `src/lib/rewardCalc.ts` 的 `calcCardAdvice` 函式，新增選填參數 `paymentMethod?: 'apple_pay' | 'google_pay' | 'physical'`，當 paymentMethod 為 apple_pay 或 google_pay 且卡片的 `paymentMethodBonus.methods` 包含該方式時，呼叫 `calcPaymentMethodBonus` 並將 `bonusRate` 加入 `effectiveRate`，實作 calcCardAdvice 擴充接受 paymentMethod 參數
- [x] 2.3 修改 `src/lib/rewardCalc.ts` 的 `getSortedRecommendations` 函式，傳遞 `paymentMethod` 參數至 `calcCardAdvice`，確保排序依付款方式後的有效回饋率計算，實作 effective rate calculation with payment method bonus
- [x] 2.4 修改 `src/lib/rewardCalc.ts` 的 `calcExpenseReward`，加入 `paymentMethod` 參數，回傳值需包含行動支付加碼部分（`paymentMethodReward`），以分離計算並供 Expense 儲存使用

## 3. 卡片設定 UI

- [x] 3.1 在 `src/components/CardForm.tsx` 新增「行動支付加碼」區塊的展開/收合 toggle，預設關閉，實作 payment method bonus configuration in card form
- [x] 3.2 在 `src/components/CardForm.tsx` 展開後顯示 Apple Pay / Google Pay 勾選框（至少選一），綁定至 `paymentMethodBonus.methods`
- [x] 3.3 在 `src/components/CardForm.tsx` 新增 tier 列表 UI：每個 tier 含加碼 % 輸入、月上限 NT$ 輸入、可選的前置條件文字輸入，以及當前置條件文字非空時顯示的 prerequisiteMet 勾選框
- [x] 3.4 在 `src/components/CardForm.tsx` 每個 prerequisiteMet 勾選框旁顯示提示文字「每月初請確認條件是否仍符合」，實作前置條件採使用者宣告式，儲存在 Card 設定
- [x] 3.5 在 `src/components/CardForm.tsx` 新增「新增 tier」與「刪除 tier」按鈕，並在儲存時將 `paymentMethodBonus` 正確序列化（無 tier 或 toggle 關閉時設為 undefined）

## 4. 記帳頁 UI

- [x] 4.1 在 `src/pages/ExpensePage.tsx` 新增 `paymentMethod` state（預設 `'physical'`），在卡片推薦列表上方顯示三個 chip 按鈕（Apple Pay / Google Pay / 實體卡），點選後更新 state，實作付款方式選擇放在 ExpensePage 表單層級，不是卡片層級（所有卡片共用同一個付款方式情境）
- [x] 4.2 將 `paymentMethod` state 傳入 `getSortedRecommendations` 呼叫，使推薦排序即時反映付款方式加碼，實作 payment method selection during expense entry
- [x] 4.3 在 `src/pages/ExpensePage.tsx` 的卡片推薦列表中，當卡片有 `paymentMethodBonus` 且所選付款方式匹配且有剩餘月額度時，在卡片行顯示付款方式 badge（例：「Apple Pay」小標籤），實作 inline card recommendation during expense entry 修改
- [x] 4.4 在 `src/pages/ExpensePage.tsx` 的 `handleSubmit` 中，記錄消費時將 `paymentMethod` 與 `paymentMethodReward` 寫入 `Expense` 物件

## 5. 向下相容

- [x] 5.1 確認 `src/store/storage.ts` 讀取 `Expense` 時，`paymentMethod` 缺失視為 `'physical'`，`paymentMethodReward` 缺失視為 `0`，不需強制 migration
- [x] 5.2 確認 `src/store/storage.ts` 讀取 `Card` 時，`paymentMethodBonus` 缺失視為 undefined，既有卡片資料不受影響
