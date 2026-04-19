## Why

刷卡金頁「本次旅程消費記錄」目前以平鋪清單顯示所有交易，旅程天數增多後滾動冗長。與旅程明細頁同步採用橫向日期 chip 導覽，讓使用者能快速定位特定日期的消費。

## What Changes

- 在「本次旅程消費記錄」標題下方新增橫向可捲動日期 chip 列，每個 chip 顯示日期（日）與星期
- 點選 chip 後，下方只顯示該日的消費清單（仍套用既有的卡片篩選條件）
- 移除原本所有日期混排的平鋪顯示方式
- 加碼額度狀態、卡片篩選 chip 維持不變

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ledger-card-filter`: 卡片篩選現在在選取日期的範圍內生效（原為全旅程範圍）

## Impact

- Affected specs: `ledger-card-filter`
- Affected code: `src/pages/LedgerPage.tsx`
