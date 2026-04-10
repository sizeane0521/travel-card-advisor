## 1. App.tsx — 刷卡金 Tab identity and layout：Tab 改名與 icon 更換

- [x] 1.1 在 `src/App.tsx` 中新增 `CreditCardIcon` 函式元件：SVG 矩形外框（rect rx=2, x=2 y=5 w=20 h=14）+ 橫線（y=10）+ 短線（x1=6 x2=10 y=15），stroke="currentColor" strokeWidth="1.5" fill="none"，尺寸 22×22
- [x] 1.2 將 TABS 陣列中 id='ledger' 的 label 從 `'明細'` 改為 `'刷卡金'`，icon 從 `<ScrollIcon />` 改為 `<CreditCardIcon />`，完成 Tab 改名與 icon 更換
- [x] 1.3 驗證：底部 Tab Bar 第二項顯示「刷卡金」+ 信用卡 icon（刷卡金 Tab identity and layout ✓）

## 2. CalcPage — Record a single expense：按鈕文字改為「+刷卡」

- [x] 2.1 在 `src/pages/CalcPage.tsx` 第 455 行附近，將按鈕文字 `+明細` 改為 `+刷卡`，符合 Record a single expense 規格
- [x] 2.2 驗證：試算頁推薦卡片的按鈕顯示「+刷卡」

## 3. LedgerPage — 刷卡金 Tab identity and layout：加碼額度狀態移至置頂

- [x] 3.1 在 `src/pages/LedgerPage.tsx` 中實作加碼額度狀態移至置頂：將加碼額度狀態自執行函數（`{(() => { ... })()}`，目前約第 89-198 行）從消費清單 `<div>` 後方，移到 `<h2>本次旅程消費記錄</h2>` 之前（刷卡金 Tab identity and layout）
- [x] 3.2 驗證：進入刷卡金 Tab 時，加碼額度狀態可見於消費清單上方

## 4. useStore — Delete a trip：DELETE_TRIP 清除 activeTripId

- [x] 4.1 在 `src/store/useStore.tsx` 的 Action union type 新增 `| { type: 'DELETE_TRIP'; tripId: string }`，實作 Delete a trip 的 DELETE_TRIP 清除 activeTripId 設計決策
- [x] 4.2 在 reducer 的 switch 新增 case：`case 'DELETE_TRIP': return { ...state, trips: state.trips.filter(t => t.id !== action.tripId), activeTripId: state.activeTripId === action.tripId ? null : state.activeTripId }`
- [x] 4.3 驗證：DELETE_TRIP action 正確過濾旅程並在需要時清除 activeTripId

## 5. TripsPage — Trip card navigates to detail view + Delete a trip + Trip card shows chevron indicator

- [x] 5.1 在 `src/pages/TripsPage.tsx` 新增 import：`import TripDetailPage from './TripDetailPage'` 與 `import type { Trip, Card } from '../types'`（若尚未 import）
- [x] 5.2 新增 `selectedTrip: Trip | null` state（初始值 `null`），實作 TripDetailPage 以 state 條件渲染，不引入 router 設計決策
- [x] 5.3 在函式頂部（return 之前）加上：`if (selectedTrip !== null) return <TripDetailPage trip={selectedTrip} cards={data.cards} onBack={() => setSelectedTrip(null)} />`
- [x] 5.4 將旅程卡片外層 `<div>` 加上 `onClick={() => setSelectedTrip(trip)}`，並在右上角加 `<span className="text-[#9a7040] text-base ml-2">›</span>`，符合 Trip card navigates to detail view 與 Trip card shows chevron indicator 規格
- [x] 5.5 新增 Delete a trip 的 `handleDelete` 函式：`function handleDelete(tripId: string) { if (!confirm('確定要刪除此旅程嗎？旅程內所有消費記錄將一併刪除。')) return; dispatch({ type: 'DELETE_TRIP', tripId }) }`
- [x] 5.6 在旅程卡片底部按鈕列新增：`<button onClick={e => { e.stopPropagation(); handleDelete(trip.id) }} className="text-xs px-3 py-1 rounded border transition-colors" style={{ borderColor: '#5a1a1a', color: '#c0392b' }}>刪除</button>`
- [x] 5.7 驗證：點擊旅程卡片進入詳情頁；刪除按鈕顯示確認框後刪除旅程

## 6. TripDetailPage（新建）— Trip detail view with daily expense breakdown

- [x] 6.1 建立 `src/pages/TripDetailPage.tsx`，定義 props：`{ trip: Trip; cards: Card[]; onBack: () => void }`，實作 Trip detail view with daily expense breakdown；TripDetailPage 的每日分組在元件內計算
- [x] 6.2 實作 Header 列：左側返回按鈕（`onClick={onBack}`），右側或中央旅程名稱，名稱下方起迄日期（`{trip.startDate}{trip.endDate ? ` — ${trip.endDate}` : ''}`）
- [x] 6.3 實作統計摘要列：總消費（`trip.expenses.reduce((s,e) => s+e.amount, 0)`）、總回饋（`estimatedReward` 加總）、總筆數
- [x] 6.4 實作每日分組（TripDetailPage 的每日分組在元件內計算）：`const byDay: Record<string, Expense[]> = {}; for (const e of [...trip.expenses].reverse()) { if (!byDay[e.date]) byDay[e.date] = []; byDay[e.date].push(e) }; const sortedDays = Object.keys(byDay).sort().reverse()`
- [x] 6.5 實作日期標題列：顯示日期（YYYY-MM-DD）+ 星期（`new Date(date + 'T00:00:00').toLocaleDateString('zh-TW', { weekday: 'short' })`）+ 筆數 + 當日消費小計 + 當日回饋小計
- [x] 6.6 實作每筆消費卡片：金額（有 foreignAmount 顯示 `¥X,XXX (NT$X,XXX)`，否則 `NT$X,XXX`）、店家（null 顯示「一般消費」）、卡片名稱（cards.find(c => c.id === e.cardId)?.name）、回饋率 badge（`rewardBreakdown.effectiveRate`）、回饋金額
- [x] 6.7 實作空狀態：`trip.expenses.length === 0` 時顯示「此旅程尚無消費記錄」
- [x] 6.8 驗證：詳情頁顯示旅程起迄日期、日期分組（最新日期在上）、每筆消費資訊、返回按鈕正常
