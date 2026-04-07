## Why

記帳頁的店家選擇目前只有固定 chip 按鈕，無法搜尋或輸入自由店名，使用者到了一個不在 bonus 設定裡的店家就無法正確標記，也無法快速找到特定店家。需要搜尋框與 chips 共存，讓操作更直覺。

## What Changes

- 在記帳頁店家區塊新增搜尋框（text input），位於 chips 上方
- 搜尋框輸入關鍵字時，chips 即時篩選為符合關鍵字的店家；清空後恢復全部 chips
- 搜尋框允許輸入任意自由店名（不限於已設定 bonus 的店家）
- 「一般消費」chip 固定顯示，不受關鍵字篩選影響
- 點選任一 chip 會將店名填入搜尋框並選定；直接在搜尋框打字會解除 chip 的高亮選取
- 搜尋框有清除按鈕（×），點擊重設為「一般消費」狀態

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `expense-tracker`: 店家選擇 requirement 改為搜尋框 + 動態篩選 chips 共存設計，取代純 chip 列表

## Impact

- Affected specs: `expense-tracker`（修改）
- Affected code:
  - `src/pages/ExpensePage.tsx` — 店家區塊 UI 重構：新增 `storeQuery` state、搜尋框、chips 篩選邏輯
