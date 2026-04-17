## Context

旅程明細頁（`TripDetailPage.tsx`）目前使用 `sortedDays` 陣列將所有日期垂直堆疊渲染，每日之下緊接該日的交易卡片清單。本次變更範圍單一，僅修改此一元件的渲染結構，不涉及資料模型或其他頁面。

## Goals / Non-Goals

**Goals:**
- 新增橫向可捲動日期 chip 列，讓使用者以點擊方式切換查看日期
- 只顯示當前選取日期的交易清單與當日小計
- 延續現有暗金色視覺風格（`#d4a017`、`#1a1208`、`#9a7040`）

**Non-Goals:**
- 不改變資料結構（`Trip`、`Expense` 型別維持不變）
- 不改變總覽摘要卡片（仍顯示整趟旅程合計）
- 不新增動畫或過場效果

## Decisions

### 使用 useState 管理選取日期

以 `useState<string>` 儲存目前選取的日期字串，預設值為 `sortedDays[0]`（最新一天）。無需引入額外狀態管理，Component 內部自給自足。

替代方案：URL query param — 過度複雜，此頁面不需要深連結。

### 日期 chip 樣式：選中填滿、未選框線

選中的 chip 使用 `background: #d4a017`（金色填滿）、文字用深色；未選用 `border: 1px solid #d4a017`、文字用金色。與現有 badge 風格一致，無需引入新 CSS class。

### 橫向捲動使用 overflow-x-auto flex

日期 chip 列用 `overflow-x-auto flex gap-2 pb-1` 實現橫向捲動，不引入額外套件。

## Risks / Trade-offs

- [風險] 旅程只有 1 天時，日期列僅 1 個 chip，視覺略顯冗餘 → 可接受，保持 UI 一致性，不做特殊處理
- [取捨] 無法一次縱覽所有日期的交易 → 符合本次目標，使用者可透過切換 chip 逐日查看
