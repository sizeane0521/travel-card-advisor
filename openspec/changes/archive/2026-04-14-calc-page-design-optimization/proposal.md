## Why

試算頁目前在視覺上存在四個設計問題，導致使用者難以區分輸入區與結果區，且部分 UI 元素不可見或佔用額外空間造成排版不整齊。這些問題影響使用流暢度與資訊層次的清晰度。

## What Changes

- **拆分表單與卡片列表**：將「選擇信用卡」區塊從原有的 `.beast-card` 容器中分離，使輸入表單與卡片推薦列表成為兩個獨立視覺區塊
- **修復日期 icon 可見性**：在 `index.css` 為 `input[type="date"]` 的 `::-webkit-calendar-picker-indicator` 加上 `filter: invert(1)` 或等效樣式，讓 icon 在深色背景可見
- **推薦標籤改為絕對定位**：將「推薦」badge 從 flex child（固定 32px 側欄）改為 `position: absolute; top: 0; left: 0` 的角標，使有/無推薦標籤的卡片內容寬度一致、排列對齊
- **移除條件提示 toggle 按鈕**：移除試算結果卡片中顯示的 prerequisite toggle 按鈕（付款方式前提與店家前提），因其已在設定頁預設啟用，無需再顯示

## Non-Goals

- 不變更日期選擇器的互動行為或換用自訂日期元件
- 不變更推薦邏輯或排序規則
- 不變更設定頁的 prerequisite 開關行為

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-advisor`: 卡片推薦結果的視覺呈現方式改變（推薦標籤位置、條件提示移除）

## Impact

- Affected specs: `card-advisor`
- Affected code:
  - `src/pages/CalcPage.tsx`（主要修改）
  - `src/index.css`（日期 icon 樣式）
