## 1. TripDetailPage.tsx 重構

- [x] 1.1 依「使用 useState 管理選取日期」設計決策，在 `TripDetailPage.tsx` 加入 `useState<string>` 管理選取日期，預設值為 `sortedDays[0]`（最新一天），實現「date chip strip shows most recent date selected by default」需求
- [x] 1.2 在總覽摘要卡片下方新增橫向可捲動日期 chip 列，依「橫向捲動使用 overflow-x-auto flex」設計決策實作（`overflow-x-auto flex gap-2`），每個 chip 顯示日（數字）與星期（zh-TW 短格式），實現「trip detail view with daily expense breakdown」中的 date chip strip 需求
- [x] 1.3 依「日期 chip 樣式：選中填滿、未選框線」設計決策實作 chip 視覺：選中用 `background: #d4a017`（金色填滿）+ 深色文字，未選用 `border: 1px solid #d4a017`（金色框線）+ 金色文字
- [x] 1.4 在日期 chip 列下方顯示當日小計列（筆數、消費、回饋），並只渲染 `byDay[selectedDay]` 的交易卡片，實現「selecting a date chip shows only that day's expenses」與「daily subtotals are correct for selected date」需求
- [x] 1.5 確認空旅程時不渲染日期 chip 列，僅顯示「此旅程尚無消費記錄」，實現「empty trip shows placeholder message without date chip strip」需求

## 2. 驗證

- [x] 2.1 在瀏覽器開啟旅程明細頁，確認橫向 chip 列顯示正確日期與星期，預設選取最新一天，點擊切換後只顯示該天交易
- [x] 2.2 確認多天旅程（如 Image #1 的 2026-04-14、2026-04-15）切換正確，當日小計數字與原始資料一致
- [x] 2.3 確認空旅程不顯示 chip 列，只顯示「此旅程尚無消費記錄」
