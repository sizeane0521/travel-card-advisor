## Why

使用者不需要獨立的「推薦」頁面，且該頁面在改版過程中造成混淆與誤解。所有回饋建議已整合進「記帳」頁面的即時卡片排名中，推薦頁因此成為多餘功能。同時確認記帳頁面的回饋率計算正確顯示三層疊加結果（基本回饋率 + 行動支付加碼 + 商店加碼）。

## What Changes

- 從 `App.tsx` 移除 `advisor` Tab 項目（`TABS` 陣列、條件渲染、import）
- 刪除 `src/pages/AdvisorPage.tsx`
- 預設進入 Tab 從 `'advisor'` 改為 `'expense'`
- `CapProgress` 血條邏輯（原本在 AdvisorPage）已存在於 `rewardCalc.ts` 的回傳值中，無需另行移除

## Non-Goals

- 不修改 `rewardCalc.ts` 的計算邏輯（三層疊加已於上一個 change 修正）
- 不改動 ExpensePage 的計算顯示方式（effectiveRate 已正確顯示合計回饋率）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-advisor`: 需求整體移除，Advisor 頁面不再存在

## Impact

- Affected specs: `card-advisor`（移除）
- Affected code:
  - `src/App.tsx`（移除 advisor Tab、import、預設 tab 改為 expense）
  - `src/pages/AdvisorPage.tsx`（整個檔案刪除）
