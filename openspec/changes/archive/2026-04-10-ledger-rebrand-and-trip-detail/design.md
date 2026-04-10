## Context

目前 App 有四個 Tab：試算、明細、旅程、設定。「明細」Tab 對應 `LedgerPage`，顯示目前進行中旅程的消費清單與加碼額度狀態，後者目前置於清單下方需要捲動才能看到。旅程 Tab 的卡片只顯示基本資訊與操作按鈕（設為當前、結束），沒有詳情入口，也沒有刪除功能。store 有 `DELETE_CARD` 但沒有 `DELETE_TRIP`。

## Goals / Non-Goals

**Goals:**
- 重命名「明細」Tab 為「刷卡金」並更換 icon
- 加碼額度狀態移至刷卡金 Tab 頂部
- 試算頁按鈕改名「+刷卡」
- 旅程卡片可點擊，進入每日消費詳情頁
- 旅程可刪除

**Non-Goals:**
- 不修改任何回饋計算邏輯
- 不支援旅程編輯（修改名稱/日期）
- 不支援消費記錄在詳情頁直接刪除（僅查看）
- 不新增路由 library，維持 state-based 頁面切換

## Decisions

### TripDetailPage 以 state 條件渲染，不引入 router

`TripsPage` 新增 `selectedTrip: Trip | null` state。當非 null 時，`return <TripDetailPage trip={selectedTrip} cards={data.cards} onBack={() => setSelectedTrip(null)} />`。這與現有 `SettingsPage` 使用 `if (editingCard) return <CardForm ... />` 的模式一致，不引入新依賴。

替代方案：react-router。否決原因：專案目前無 router，單頁 SPA 加入 router 只為一個詳情頁代價過高。

### TripDetailPage 的每日分組在元件內計算

在 `TripDetailPage` 元件 render 時：
```typescript
const byDay: Record<string, Expense[]> = {}
for (const e of [...trip.expenses].reverse()) {
  if (!byDay[e.date]) byDay[e.date] = []
  byDay[e.date].push(e)
}
const sortedDays = Object.keys(byDay).sort().reverse()
```
每日按日期降冪排列，同日內消費維持記錄順序（最新在前）。

### DELETE_TRIP 清除 activeTripId

若刪除的旅程正是當前 active trip，`activeTripId` 設為 `null`，讓刷卡金 Tab 顯示空白提示狀態，引導使用者建立新旅程。

### 加碼額度狀態移至置頂

`LedgerPage` 中，將加碼額度狀態的自執行函數（IIFE）從消費清單 `<div>` 後方，移到 `<h2>本次旅程消費記錄</h2>` 前方。不改變計算邏輯。

### Tab 改名與 icon 更換

`App.tsx` 中的 TABS 陣列，將 `label: '明細'` 改為 `label: '刷卡金'`，`icon: <ScrollIcon />` 改為 `icon: <CreditCardIcon />`。新增 `CreditCardIcon` 函式元件，與現有 icon 使用相同的 SVG 風格（stroke、strokeWidth: 1.5、fill: none）。

信用卡 icon 設計：矩形外框（rx=2）+ 橫條磁條線 + 短線模擬卡號區，識別度高且簡潔。

## Risks / Trade-offs

- **旅程刪除無法恢復**：使用 `confirm()` 對話框作為唯一保護。風險低，與刪除卡片的現有模式一致。
- **TripDetailPage 僅查看**：使用者在詳情頁無法刪除單筆消費，若需要刪除需返回刷卡金 Tab。此為刻意設計，避免詳情頁功能過重。
