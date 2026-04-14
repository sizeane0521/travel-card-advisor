## 1. Card chip display in expense records

- [x] 1.1 實作「Card chip display in expense records」：在 `src/pages/LedgerPage.tsx` 中，找到消費記錄的卡片名稱顯示（約 line 294-301：`{card?.name ?? '已刪除的卡片'}`），將其改為 chip 樣式：`<span className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: '#c8901a', color: '#c8a060', background: 'transparent' }}>{card?.name ?? '已刪除的卡片'}</span>`；已刪除的卡片樣式改為 `borderColor: '#4a3418', color: '#6a5030'`

## 2. Payment method badge in expense records

- [x] 2.1 實作「Payment method badge in expense records」：在同一消費記錄的卡片 chip 右側，加上付款方式 badge：當 `e.paymentMethod === 'apple_pay'` 時顯示 `Apple Pay` badge，`e.paymentMethod === 'google_pay'` 時顯示 `Google Pay` badge，樣式為 `background: 'rgba(74,174,226,0.15)', color: '#4aade2', border: '1px solid rgba(74,174,226,0.3)'`，`text-xs px-1.5 py-0.5 rounded font-medium`；`physical` 或無 paymentMethod 時不顯示

## 3. Card filter tabs in ledger page

- [x] 3.1 實作「Card filter tabs in ledger page」的 state：在 `src/pages/LedgerPage.tsx` 的 state 宣告區（function component 頂部）加入 `const [filterCardId, setFilterCardId] = useState<string>('all')`；並在 `activeTrip` 變更時（`useEffect` 依賴 `data.activeTripId`）重設 `setFilterCardId('all')`
- [x] 3.2 計算 Tab 資料：在 render 區塊計算 `filterCardOptions`：從 `expenses`（已 reverse 的陣列）中依出現順序收集唯一的 `cardId`，對應 `data.cards` 取出卡片名稱，過濾掉已刪除的卡片（找不到對應卡片就跳過）。結果型別為 `Array<{ cardId: string; name: string }>`
- [x] 3.3 在消費記錄列表上方加入 Tab 列 JSX：`<div className="flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: 'none' }}>` 內放「全部」Tab + `filterCardOptions.map(...)` 的卡片 Tab；active 樣式 `background: '#c8901a', color: '#0d0a06', borderColor: '#c8901a', fontWeight: 600`；inactive 樣式 `background: 'transparent', color: '#c8a060', borderColor: '#4a3418'`；每個 Tab 為 `<button className="shrink-0 px-3 py-1.5 rounded-lg text-xs border transition-all whitespace-nowrap" ...>`
- [x] 3.4 套用篩選：將 `expenses.map(e => ...)` 改為先過濾：`const filteredExpenses = filterCardId === 'all' ? expenses : expenses.filter(e => e.cardId === filterCardId)`，然後用 `filteredExpenses.map(...)` 渲染

## 4. 驗證

- [x] 4.1 Build 確認 TypeScript 無錯誤（`npm run build`）
- [x] 4.2 確認消費記錄中的卡片名稱顯示為金框 chip，付款方式 badge（Apple Pay / Google Pay）正確顯示於 chip 右側，實體卡不顯示 badge
- [x] 4.3 確認 Tab 列正確顯示「全部」＋本次旅程有消費的卡片（無重複），點選卡片 Tab 後只顯示該卡片的消費，點「全部」恢復全部
- [x] 4.4 Tab 列在卡片數量多時可橫向滾動
