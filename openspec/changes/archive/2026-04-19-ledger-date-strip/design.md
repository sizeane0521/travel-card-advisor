## Context

刷卡金頁（`LedgerPage.tsx`）的消費記錄區目前以平鋪清單渲染，已有卡片篩選（`filterCardId`）狀態。本次在此基礎上加入日期 chip 導覽，兩個篩選條件並存（AND 關係）。加碼額度狀態區塊不受日期 chip 影響。

## Goals / Non-Goals

**Goals:**
- 在卡片篩選列下方、加碼額度狀態上方加入橫向日期 chip 列（升序，最舊在左）
- 消費清單同時套用日期篩選與卡片篩選（AND）
- 當 active trip 切換時，重設 `selectedDay` 至最新一天

**Non-Goals:**
- 不改動加碼額度狀態區塊（仍依 `filterCardId` 顯示，不受日期影響）
- 不改動卡片篩選 chip 列本身的邏輯與樣式

## Decisions

### 使用 useState 管理選取日期，active trip 切換時重設

新增 `selectedDay` state，初始值為 `sortedDays[0]`（最新日）。在現有的 `useEffect([data.activeTripId])` 中一併重設 `selectedDay`，確保切換旅程後不殘留前一旅程的日期選取狀態。

替代方案：獨立 useEffect 監聽 activeTripId — 分開維護容易遺漏同步，合併更安全。

### 日期 chip 排列順序：升序（最舊在左）

與旅程明細頁保持一致，`[...sortedDays].reverse()` 用於渲染，`selectedDay` 預設仍為 `sortedDays[0]`（最新）。

### 消費清單篩選：日期 AND 卡片雙重條件

篩選邏輯：先過濾 `e.date === selectedDay`，再套用 `filterCardId`（若非 `all`）。順序不影響結果但語意清晰。

### 日期 chip 位置：卡片篩選下方、加碼區上方

日期 chip 列放在卡片篩選 chip 之後、加碼額度狀態之前，讓使用者進入頁面後早早看到日期選擇器，不需要滾過加碼區才能找到。加碼區仍在日期 chip 下方，視覺層次為：全域篩選（卡片）→ 日期選擇 → 加碼狀態 → 消費記錄。

替代方案：放在標題下方最頂端 — 與卡片篩選並排過於擁擠；放在消費記錄標題下方 — 埋太深不易察覺（使用者反饋）。

## Risks / Trade-offs

- [取捨] 卡片篩選不影響日期 chip 的顯示（chip 列永遠顯示整趟旅程所有有記錄的日期，不因卡片篩選縮減）→ 行為一致、實作簡單，避免 chip 數量動態變化造成混亂
- [風險] 旅程只有 1 天時 chip 列僅 1 個 → 可接受，與旅程明細頁行為一致
