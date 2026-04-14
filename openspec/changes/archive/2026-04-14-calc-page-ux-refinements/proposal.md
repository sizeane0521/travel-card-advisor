## Why

試算頁在幾個互動細節上不夠直覺：店家區塊視覺上未與其他輸入分離、搜尋時顯示無關按鈕、未輸入金額仍可點擊卡片造成操作混淆、回饋率明細的 AP/GP 縮寫對使用者不夠清晰。

## What Changes

- **店家區塊獨立**：將「店家」section 從現有的金額/匯率/日期 `.beast-card` 容器中分離，獨立成自己的 `.beast-card` 區塊
- **搜尋時隱藏「一般消費」按鈕**：當搜尋框有輸入文字（`storeQuery.length > 0`）時，隱藏「一般消費」按鈕；使用者可透過已存在的 `×` 清除鍵回到一般消費狀態
- **無金額時整張卡片不可互動**：當 `validAmount` 為 `false` 時，卡片整體 `onClick` 不觸發、`+刷卡` 按鈕 disabled、卡片視覺加上 `opacity: 0.4` + `cursor: default`
- **回饋率明細文字改為「行動支付」**：rate breakdown 中的 `AP` / `GP` 前綴統一改為 `行動支付`，不論選擇 Apple Pay 或 Google Pay

## Non-Goals

- 不變更「付款方式」區塊的獨立性（付款方式維持與先前邏輯相同的區塊）
- 不變更搜尋邏輯或回饋率計算邏輯
- 不在「一般消費」按鈕隱藏時改變 `store` 狀態

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-advisor`: 卡片推薦列表的互動行為改變（無金額時不可互動）、回饋率明細文字改變

## Impact

- Affected specs: `card-advisor`
- Affected code:
  - `src/pages/CalcPage.tsx`（主要修改）
