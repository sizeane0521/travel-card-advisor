## Why

「明細」Tab 的命名與功能定位不清晰，使用者難以直覺理解它是「刷卡金額查看」入口，而非完整的帳務明細。旅程頁面只能建立和結束旅程，無法點擊進入查看每日刷卡明細，導致旅程資訊與實際消費脫節。

## What Changes

- **Tab 改名**：「明細」Tab 更名為「刷卡金」，並更換為信用卡圖示。
- **加碼額度狀態置頂**：「刷卡金」Tab 內，「加碼額度狀態」區塊移至消費清單上方，使用者進入頁面即可快速查看回饋進度。
- **試算頁按鈕改名**：「+明細」按鈕改為「+刷卡」，語義更準確。
- **旅程詳情頁**：旅程卡片改為可點擊，進入後顯示旅程起迄日期、總消費統計、按日期分組的消費明細。
- **旅程刪除功能**：旅程頁新增刪除按鈕，允許刪除整個旅程（含旅程內所有消費記錄）。

## Capabilities

### New Capabilities

- `trip-detail-view`：旅程詳情頁，展示旅程總覽統計與按日期分組的每日刷卡明細。

### Modified Capabilities

- `trip-manager`：新增旅程刪除功能（DELETE_TRIP action）、旅程卡片可點擊進入詳情頁。
- `expense-tracker`：「刷卡金」Tab 的加碼額度狀態移至置頂；試算頁記帳按鈕標籤改為「+刷卡」。

## Impact

- 受影響檔案：
  - `src/App.tsx`（Tab label + icon）
  - `src/pages/CalcPage.tsx`（按鈕文字）
  - `src/pages/LedgerPage.tsx`（區塊順序調整）
  - `src/pages/TripsPage.tsx`（可點擊 + 刪除）
  - `src/store/useStore.tsx`（DELETE_TRIP action）
  - `src/pages/TripDetailPage.tsx`（新增）
