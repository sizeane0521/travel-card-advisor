## 1. 建立 DatePicker 元件

- [x] 1.1 依「DatePicker 為受控元件，介面與原生 input 對齊」設計決策，在 `src/components/DatePicker.tsx` 建立元件骨架：定義 `DatePickerProps`（`value`, `onChange`, `min?`, `max?`, `className?`, `style?`），加入 `useState<boolean>` 管理 `isOpen`，以及 `useState<{year, month}>` 管理月曆當前顯示月份（初始值從 `value` 或今天推算），實現「DatePicker component renders a styled text input that opens a popover calendar」需求
- [x] 1.2 依「點擊元件外部關閉：useEffect + mousedown listener」設計決策，加入 `useRef` 指向元件根 div，並在 `isOpen` 為 true 時 `useEffect` 監聽 `document.mousedown`，若 `event.target` 不在 ref 範圍內則關閉月曆，實現「DatePicker calendar closes when clicking outside」需求
- [x] 1.3 實作輸入框顯示區：整個 div 可點擊（`onClick={() => setIsOpen(true)}`），顯示 `value` 的人類可讀格式（`value` 有值顯示如「2026/04/15」，無值顯示佔位符「選擇日期」），樣式採「暗金配色」設計決策（背景 `#141008`，邊框 `#4a3418`，文字 `#f2e8c9`），實現「clicking anywhere on the input opens the calendar」需求
- [x] 1.4 依「月曆渲染：純 JS Date 計算，不引入外部套件」設計決策，實作 `buildCalendarDays(year, month)` 函式：以 `new Date(year, month, 1).getDay()` 取得首日星期，產生包含 leading/trailing 空格與當月日期的 42 格陣列（6 × 7），回傳每格 `{ date: string | null, disabled: boolean }`（`null` 表示填充格）
- [x] 1.5 依「Popover 用 absolute 定位，掛載於元件自身容器」設計決策，實作 Popover 月曆 UI（`position: absolute`，`z-index: 50`）：標頭顯示年月（`toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })`）+ 上/下月按鈕；星期標頭列（日一二三四五六）；日期格依「暗金配色」渲染選中（金色填滿）、今天（金色框線）、disabled（`#3d2e14` 文字）三種狀態，實現「DatePicker calendar displays a navigable month grid」需求
- [x] 1.6 依「DatePicker enforces min and max date constraints」規格，在 `buildCalendarDays` 中將日期字串與 `min`/`max` 比較，超出範圍的格子設為 `disabled: true`；點擊 disabled 格子時 `return` 不觸發 `onChange`，實現「dates before min are disabled」與「dates after max are disabled」需求

## 2. 替換現有 date input — DatePicker replaces all native date inputs in the application

- [x] 2.1 在 `src/pages/CalcPage.tsx` 將消費日期的 `<input type="date">` 替換為 `<DatePicker>`，傳入 `value={expenseDate}`、`onChange={setExpenseDate}`、`min={activeTrip.startDate}`、`max={todayStr()}`，保留原有 className/style
- [x] 2.2 在 `src/pages/LedgerPage.tsx` 將 inline edit 的 `<input type="date">` 替換為 `<DatePicker>`，傳入 `value={editDate}`、`onChange={setEditDate}`、`min={activeTrip.startDate}`、`max={activeTrip.endDate ?? today}`，保留原有 className/style
- [x] 2.3 在 `src/pages/TripsPage.tsx` 將開始日期 `<input type="date">` 替換為 `<DatePicker value={startDate} onChange={setStartDate} />`；將結束日期替換為 `<DatePicker value={endDate} onChange={setEndDate} min={startDate} />`
- [x] 2.4 在 `src/components/CardForm.tsx` 將 validFrom 和 validTo 的兩個 `<input type="date">` 分別替換為 `<DatePicker>`，保留原有 className，完成「DatePicker replaces all native date inputs in the application」規格中的最後兩個替換點

## 2b. 旅程表單強化（測試期間發現的修正）

- [x] 2b.1 在 `src/store/useStore.tsx` Action type 新增 `UPDATE_TRIP`，Reducer 加入對應 case（保留 expenses、只更新 name/startDate/endDate/exchangeRate）
- [x] 2b.2 在 `src/pages/TripsPage.tsx` 必填欄位 label 加 `*` 紅色標記（旅程名稱、開始日期、幣別、匯率），結束日期維持「選填」
- [x] 2b.3 將幣別由選填改為必填，新增 `currencyError` state，點「建立」時同時驗證名稱/幣別/匯率三個必填欄位，一次顯示所有錯誤（`hasError` 旗標），不再 early return
- [x] 2b.4 在每張旅程卡片的按鈕列新增「編輯」按鈕，點擊後展開 inline edit form（含 DatePicker 日期欄位），儲存時呼叫 `UPDATE_TRIP`；`saveEditTrip` 同樣驗證 editName/editCurrency/editRate

## 3. 驗證

- [x] 3.1 在 GitHub Pages 確認 CalcPage 消費日期點擊整個框可開啟月曆，選擇日期後月曆關閉且值正確更新
- [x] 3.2 確認 LedgerPage inline edit 日期框行為相同，min/max 限制日期正確 disabled
- [x] 3.3 確認 TripsPage 開始/結束日期均使用新 DatePicker，結束日期 min 跟隨開始日期
- [x] 3.4 確認月曆 Popover 在行動端和桌面均可正常顯示與關閉，暗金樣式正確
