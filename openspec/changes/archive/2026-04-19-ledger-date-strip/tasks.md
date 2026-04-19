## 1. LedgerPage.tsx 重構

- [x] 1.1 依「使用 useState 管理選取日期，active trip 切換時重設」設計決策，在 `LedgerPage.tsx` 加入 `useState<string>` 管理 `selectedDay`；在現有 `useEffect([data.activeTripId])` 中一併重設 `selectedDay` 至最新一天（`sortedDays[0]`）
- [x] 1.2 在 `expenses` 陣列下方建立 `byDay` 分組與 `sortedDays` 陣列（降序，與 TripDetailPage 相同邏輯），實現「card filter tabs in ledger page」中消費記錄按日期分組的基礎
- [x] 1.3 新增橫向可捲動日期 chip 列（依「日期 chip 排列順序：升序（最舊在左）」決策，顯示 `[...sortedDays].reverse()`），chip 樣式沿用旅程明細頁規格（選中 `background: #d4a017`，未選 `border: 1px solid #d4a017`），每個 chip 顯示日（數字）與星期（zh-TW 短格式）
- [x] 1.7 依「日期 chip 位置：卡片篩選下方、加碼區上方」設計決策，將日期 chip 列移至卡片篩選 chip 之後、加碼額度狀態之前（使用 `sortedDays.length > 0` 條件控制顯示）
- [x] 1.4 依「消費清單篩選：日期 AND 卡片雙重條件」設計決策，將消費清單改為先過濾 `e.date === selectedDay`，再套用 `filterCardId`（若非 `all`），實現「card filter applies within selected date」與「all tab shows all expenses for selected date」需求
- [x] 1.5 確認加碼額度狀態區塊仍只依 `filterCardId` 決定顯示，不受 `selectedDay` 影響，實現「card filter controls bonus bars independently of date」需求
- [x] 1.6 確認空旅程（`expenses.length === 0`）時不渲染日期 chip 列，只顯示「尚無消費記錄」

## 2. 驗證

- [x] 2.1 在 GitHub Pages 確認日期 chip 列顯示正確日期與星期（升序），預設選取最新一天，點擊切換後只顯示該天交易
- [x] 2.2 確認卡片篩選與日期 chip 同時生效（選聯邦吉鶴卡 + 04/14，只顯示 04/14 的吉鶴卡交易）
- [x] 2.3 確認加碼額度狀態不受日期 chip 影響，切換日期後加碼進度條不變
- [x] 2.4 確認切換旅程後 selectedDay 重設為最新一天
