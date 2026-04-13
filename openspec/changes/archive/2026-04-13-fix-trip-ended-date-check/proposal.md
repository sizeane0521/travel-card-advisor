## Problem

建立旅程時若設定了未來的結束日期（例如 2026-04-17），系統立即將該旅程視為「已結束」，導致試算頁（CalcPage）顯示鎖定畫面，使用者無法新增任何消費。旅程卡片同時出現「◆ 進行中」與「已結束」兩個矛盾徽章。

## Root Cause

`TripsPage`（line 155）與 `CalcPage`（line 153）均以 `!!trip.endDate` / `if (activeTrip.endDate)` 判斷旅程是否結束，但 `endDate` 有兩種不同的語意：

1. **計畫結束日**：建立旅程時填入的未來日期，代表行程預定結束時間，旅程仍在進行中
2. **實際結束日**：使用者點擊「結束旅程」按鈕時設定的今天日期，代表旅程確實已關閉

兩種情況都儲存在同一個 `Trip.endDate` 欄位，而目前的判斷邏輯無法區分兩者。

## Proposed Solution

將「已結束」的判斷條件從 `!!endDate` 改為 `endDate !== null && endDate <= today`：

- `TripsPage`：`const isEnded = !!trip.endDate && trip.endDate <= todayStr()`
- `CalcPage`：`if (activeTrip.endDate && activeTrip.endDate <= todayStr())`

這樣，`endDate` 為未來日期的旅程視為「進行中」，`endDate` 為今天或之前才視為「已結束」。

## Non-Goals

- 不改變 `Trip.endDate` 的型別或儲存格式
- 不區分「計畫結束日」與「實際結束日」為兩個欄位（過於複雜，一個條件修改已夠）

## Success Criteria

- 建立旅程時填入未來結束日期，旅程卡片只顯示「◆ 進行中」，不顯示「已結束」
- 填入未來結束日期的旅程，試算頁可正常新增消費
- 點擊「結束旅程」後（設為今天），旅程顯示「已結束」且試算頁鎖定
- 結束日期已過（例如昨天）的旅程自動視為「已結束」

## Impact

- Affected specs: `trip-manager`（修改旅程結束判斷邏輯）
- Affected code:
  - `src/pages/TripsPage.tsx`（line 155 `isEnded` 條件）
  - `src/pages/CalcPage.tsx`（line 153 `if (activeTrip.endDate)` 條件）
