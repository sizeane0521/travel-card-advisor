## 1. Frequent store chips shown when search is empty — 移除一般消費 chip

- [x] 1.1 實作 Frequent store chips shown when search is empty 的調整：刪除 `src/pages/CalcPage.tsx` 中「一般消費」button 的整個 JSX block（`storeQuery.length === 0` 條件下的 button element，約第 386–398 行）

## 2. Custom store input confirmation chip — 更新無店家時的預設狀態

- [x] 2.1 確認移除後「Custom store input confirmation chip」行為正確：當輸入清空時，晶片列只剩頻繁店家晶片（或為空），不再有「一般消費」chip 需要復原；若 `clearStore` 呼叫仍由 `×` 按鈕觸發，邏輯不需修改
