## Why

旅程明細頁目前將所有日期的交易卡片垂直堆疊顯示，旅程天數一多就需要大量滾動，難以快速定位特定日期的消費紀錄。需要改為以日期為單位的分頁導覽模式，讓使用者能快速切換查看每天的交易。

## What Changes

- 在旅程明細頁頂部新增「橫向可捲動日期 chip 列」，每個 chip 顯示日期（日）與星期
- 點選 chip 後，下方只顯示該日的消費清單與當日小計
- 移除原本所有日期垂直堆疊的顯示方式
- 全程總覽摘要卡片（總消費、總回饋、總筆數）維持不動

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `trip-detail-view`: 日明細顯示方式從「全部展開垂直清單」改為「橫向日期 chip 選擇 + 單日清單」

## Impact

- Affected specs: `trip-detail-view`
- Affected code: `src/pages/TripDetailPage.tsx`
