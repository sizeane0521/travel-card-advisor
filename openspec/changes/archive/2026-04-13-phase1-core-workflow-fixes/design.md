## Context

CalcPage 的所有試算狀態（amount、store、paymentMethod、expenseDate、overrides）目前皆為 React local state，頁面 unmount 即消失。LedgerPage 與 TripDetailPage 以 `e.cardId` 直接 fallback，已刪除的卡片會顯示原始 UUID。useStore 只有 `ADD_EXPENSE` / `DELETE_EXPENSE`，無法更新現有紀錄。

## Goals / Non-Goals

**Goals:**
- 修正旅程切換、卡片刪除、店家切換等生命週期邊界的 UI 狀態脫鉤問題
- 讓試算草稿在切換 Tab 後存活（session 範圍內）
- 提供常用店家快速鍵降低重複操作
- 支援單筆匯率覆寫與消費紀錄編輯

**Non-Goals:**
- 不做跨裝置或跨 session 的草稿同步
- 匯率覆寫不保證與銀行精算一致
- 編輯時不回溯原始前置條件 toggle 狀態

## Decisions

### 店家條件重置的觸發點

**決定**：在「確認選擇店家」的動作（點 Chip、點清除按鈕）時觸發重置，而非監聽 `store` state 變更。

**理由**：`store` 和 `storeQuery` 在每次輸入字元時都同步更新。若用 `useEffect([store])` 監聽，使用者打字中途就會清掉已勾選的 prerequisites，UX 極差。只有確認切換店家才代表「脈絡真正改變」。

**替代方案**：監聽 `store` — 已排除，原因如上。

### 試算草稿持久化方案

**決定**：使用 `sessionStorage`，key 為 `calc-draft-${activeTripId}`。

**理由**：
- `sessionStorage` 不跨 session，不會有陳舊資料殘留問題
- 以 tripId 為 key，切換旅程後草稿自動隔離，避免跨旅程幣別混淆
- 不污染 global store（草稿屬於暫態 UI state，不需要持久化至 localStorage）

**替代方案**：全域 store — 會增加 AppData 複雜度，且 draft 不屬於業務資料。

### 常用店家資料範圍

**決定**：只統計當前旅程的 `tripExpenses`，取消費次數前 3–5 名的 store 名稱。

**理由**：使用者指定「只看當前旅程」，新旅程無 Chip 是預期行為（代表尚無消費紀錄）。

### 單筆匯率覆寫的儲存

**決定**：`Expense` 型別新增 `customRate?: number`，記帳時若有覆寫則寫入。

**理由**：日後 LedgerPage 顯示外幣金額與 TWD 時，可從 `customRate` 或 `foreignAmount` 反推匯率，避免資料不透明。若不儲存，只能從 `foreignAmount.amount / expense.amount` 推算，精度可能有誤差。

### 消費編輯的前置條件處理

**決定**：編輯時以卡片預設前置條件重算，不回溯原始 toggle 狀態。

**理由**：原始記帳的 `storeBonusOverrides` / `prereqOverrides` 未存進 Expense。此產品用途為額度追蹤，小誤差可接受，不值得為了精確度大幅增加 Expense 型別複雜度。

## Risks / Trade-offs

- **草稿 sessionStorage 遺留**：使用者重新整理後 draft 消失。→ 接受，這是 session 草稿的預期行為。
- **編輯回饋誤差**：若原始記帳開啟了前置條件，編輯後回饋數字可能略低。→ 已與使用者確認，此誤差可接受。
- **customRate 型別遷移**：舊有 Expense 資料沒有 `customRate` 欄位。→ 使用 optional field，舊資料讀取時為 `undefined`，不影響現有邏輯。
