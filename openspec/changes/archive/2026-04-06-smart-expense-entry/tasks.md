## 1. 移除舊卡片選單、建立即時推薦狀態

- [x] 1.1 在 `src/pages/ExpensePage.tsx` 中，移除 `cardId` useState 與信用卡 `<select>` 下拉選單，改以 `selectedCardId` state 存放選中的卡片 id；實作「自動選中最優卡，狀態為 selectedCardId」：每次 `amount` 或 `store` 改變時，呼叫 `getSortedRecommendations(cards, storeName, tripExpenses)` 重新排序，自動將第一張非 `isFull` 的卡設為 `selectedCardId`
- [x] 1.2 在 `src/pages/ExpensePage.tsx` 中，處理「Auto-selects next best card when top card is full」情境：若目前 `selectedCardId` 對應的卡變成 `isFull`（因為消費記錄更新後重算），自動切換 `selectedCardId` 至下一張非 full 的卡

## 2. 即時推薦卡片 UI（Inline card recommendation during expense entry）

- [x] 2.1 在記帳表單內，實作「即時卡片推薦清單取代下拉選單」（Inline card recommendation during expense entry）：依推薦排序顯示所有卡片，最優卡加框/高亮，顯示有效回饋率與本次估算回饋金額（`Math.floor(twdAmount * rate / 100)`）；`isFull` 的卡排最後並顯示「本月已滿」標籤，不可被選中
- [x] 2.2 實作「進度條顯示」（Top card shows progress bar when cap exists）：最優（第一張）非 full 卡若有 `rewardLimit` 或 `spendLimit`，顯示進度條；寬度 = `(cap - remaining) / cap * 100%`，右側顯示 remaining 文字（NT$XXX 回饋剩餘 / 消費額度剩餘）
- [x] 2.3 實作「Top card shows no progress bar when no cap」：最優卡無 cap 時不顯示進度條，只顯示有效回饋率數字
- [x] 2.4 實作「User overrides auto-selection」：點選任意非最優卡時，`selectedCardId` 切換至該卡，視覺 highlight 跟著切換

## 3. 店家 chip 選擇（Store chip selection in expense form）

- [x] 3.1 在 `src/pages/ExpensePage.tsx` 中，實作「Store chip selection in expense form」：以 chip button 取代店家 `<select>` 下拉：「一般消費」chip 永遠顯示且代表 store = null；其他 chip 來自 `getAllStoreNames(cards)`，預設只顯示前 5 個 chip
- [x] 3.2 實作「店家 chip 展開邏輯」（Expand more chips）：第 6 個以上的店家用「更多 ▼」按鈕折疊；點擊後展開顯示全部，按鈕文字改為「收起 ▲」

## 4. 即時換算預覽（Real-time JPY to TWD conversion preview）

- [x] 4.1 在 `src/pages/ExpensePage.tsx` 金額輸入框正下方，實作「JPY 即時換算顯示」（Real-time JPY to TWD conversion preview）：當 `activeTrip.exchangeRate` 存在且輸入值 > 0 時，顯示 `≈ NT$${Math.floor(amount * rate).toLocaleString()}`；amount 為空或 0 時隱藏此行；無匯率旅程時永遠不顯示

## 5. 筆數摘要（Trip expense count summary）

- [x] 5.1 在 `src/pages/ExpensePage.tsx` 頁面標題列右側，實作「Trip expense count summary」：顯示「本次旅程 N 筆」（N = `activeTrip.expenses.length`），即時反映新增或刪除後的筆數

## 6. 送出邏輯與表單重置（Record a single expense - form reset）

- [x] 6.1 在 `src/pages/ExpensePage.tsx` 的 `handleSubmit()` 中，實作「Record a single expense」送出邏輯：使用 `selectedCardId` 作為記帳的卡片 id（取代原本的 `cardId`）；送出成功後重置 amount 為空字串、store 重置為空（一般消費），`selectedCardId` 保持不變（重新排序後自動選最優卡）
