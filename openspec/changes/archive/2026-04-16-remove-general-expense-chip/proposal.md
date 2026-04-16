## Summary

移除試算頁（CalcPage）搜尋區塊中的「一般消費」按鈕。

## Motivation

「一般消費」按鈕的功能與搜尋欄的清除（`×`）按鈕完全重複——兩者都呼叫 `clearStore()`，將 `store` 和 `storeQuery` 重設為空字串。應用程式的預設狀態（無店家選取）本身即等同一般消費，使用者不需要明確點選這顆按鈕。保留它只會增加視覺雜訊，並讓使用者誤以為需要主動選擇才能記錄一般消費。

## Proposed Solution

刪除 `src/pages/CalcPage.tsx` 中「一般消費」chip 對應的 JSX block（`storeQuery.length === 0` 時渲染的 button，約第 386–398 行）。其餘邏輯不動：搜尋欄的 `×` 按鈕仍負責清除店家選取，無店家時記錄依然以空 `store` 儲存並顯示為「一般消費」。

## Non-Goals

- 不修改 `LedgerPage`、`TripDetailPage` 中 `e.store ?? '一般消費'` 的顯示 fallback
- 不改變記錄邏輯或回饋計算

## Impact

- Affected specs: `frequent-store-chips`（移除對「一般消費」chip 的定位描述）、`expense-tracker`（移除自訂店家 chip 場景中對「一般消費」chip 的反應描述）
- Affected code: `src/pages/CalcPage.tsx`
