## 1. State 擴充

- [x] 1.1 在 `src/pages/ExpensePage.tsx` 新增 `storeQuery` state（預設空字串），用於追蹤搜尋框輸入值；現有 `store` state 繼續作為「已確定選取的店家名稱或 null」，兩者分離

## 2. 搜尋框 UI

- [x] 2.1 在 `src/pages/ExpensePage.tsx` 的店家區塊頂部新增 `<input>` 搜尋框：placeholder 為「搜尋店家…」，value 綁定 `storeQuery`，onChange 同步更新 `storeQuery` 並將 `store` 設為輸入的文字（實現 Store chip selection in expense form 自由輸入行為）
- [x] 2.2 在搜尋框右側新增清除按鈕（×）：點擊時將 `storeQuery` 清空、`store` 設為 `''`（一般消費），並高亮「一般消費」chip

## 3. Chips 篩選邏輯

- [x] 3.1 在 `src/pages/ExpensePage.tsx` 計算 `filteredStores`：當 `storeQuery` 非空時，從 `storeNames` 篩選出包含 `storeQuery`（case-insensitive）的店名；`storeQuery` 為空時等同現有 `visibleStores` 邏輯（最多 5 筆 + 展開）
- [x] 3.2 當 `storeQuery` 非空時，隱藏「更多 ▼ / 收起 ▲」按鈕（`hasMoreStores` 邏輯只在 `storeQuery` 為空時生效）

## 4. Chip 互動同步

- [x] 4.1 修改各 store chip 的 `onClick`：除了設定 `store`，也同步將 `storeQuery` 設為該 chip 的店名，讓搜尋框顯示已選店家（實現 Tapping chip fills search input 場景）
- [x] 4.2 修改「一般消費」chip 的 `onClick`：同時清空 `storeQuery` 並將 `store` 設為 `''`（實現 Tapping 一般消費 chip clears search 場景）
- [x] 4.3 chip 的 selected 高亮樣式條件改為 `store === n && storeQuery === n`（chip 選取態）；當 `storeQuery` 存在但不等於任何 chip 時，所有 chip 均無高亮，只有「一般消費」在 `store === ''` 時高亮
