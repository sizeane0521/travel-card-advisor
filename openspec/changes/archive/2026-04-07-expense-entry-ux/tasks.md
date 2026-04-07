## 1. rewardCalc: Payment method bonus rate calculation with prerequisiteOverrides

- [x] 1.1 在 `src/lib/rewardCalc.ts` 的 `calcPaymentMethodBonus()` 函式簽名加入選用參數 `prerequisiteOverrides?: Record<number, boolean>`；在遍歷 tiers 時，若 `prerequisiteOverrides[tierIdx]` 有值則用它取代 `tier.prerequisiteMet`，否則沿用原值 — 滿足「Payment method bonus rate calculation」需求中 override 不改變卡片資料的要求
- [x] 1.2 將 `prerequisiteOverrides` 透傳至 `calcCardAdvice()`、`calcExpenseReward()`、`getSortedRecommendations()`，各自加入對應的選用參數，保持向下相容（無傳入時行為不變）

## 2. ExpensePage: Payment method selection during expense entry — 預設與順序

- [x] 2.1 將 `src/pages/ExpensePage.tsx` 的 `useState('physical')` 改為 `useState('apple_pay')`；將付款方式 chip 陣列順序改為 `[{ value: 'apple_pay', label: 'Apple Pay' }, { value: 'google_pay', label: 'Google Pay' }, { value: 'physical', label: '實體卡' }]` — 滿足「Payment method selection during expense entry」中預設 Apple Pay 及 chip 順序的情境

## 3. ExpensePage: Prerequisite tier selection during expense entry — 動態勾選 UI

- [x] 3.1 在 `src/pages/ExpensePage.tsx` 新增 local state `prereqOverrides: Record<string, Record<number, boolean>>`（key 為 cardId），用於追蹤每張卡當筆記帳的 prerequisite tier 勾選狀態；記帳送出後一併 reset 為 `{}`
- [x] 3.2 在推薦列表每張卡的行內，當 `paymentMethod !== 'physical'` 且該卡有任一 `tier.prerequisite != null` 時，渲染 prerequisite chip 區塊 — 滿足「Prerequisite tier selection during expense entry」需求；每個有 prerequisite 的 tier 顯示一個 chip 按鈕，內容為 `{tier.prerequisite} (+{tier.rate}%)`，已勾選時高亮；點擊時切換 `prereqOverrides[card.id][tierIdx]`
- [x] 3.3 在計算 recommendations（`getSortedRecommendations`）與 `estimateReward` 時，將 `prereqOverrides[advice.card.id]` 作為 `prerequisiteOverrides` 傳入，使 effectiveRate 及回饋估算即時反映勾選狀態
- [x] 3.4 在 `handleSubmit` 中計算 `calcExpenseReward` 時，同樣傳入 `prereqOverrides[selectedCard.id]`，確保記錄的 `estimatedReward` 與 `paymentMethodReward` 反映實際選取的 tiers

## 4. ExpensePage: Inline card recommendation during expense entry — 最佳推薦 badge 移位

- [x] 4.1 在 `src/pages/ExpensePage.tsx` 推薦列表的卡片行內，將「🌟 最佳推薦」span 從卡名同側的 flex row 移至卡片內容區塊最上方的獨立 `<div>`（`mb-1 text-xs`），讓所有卡片的 `advice.card.name` 左側對齊 — 滿足「Inline card recommendation during expense entry」需求中 badge 不錯位卡名的情境
