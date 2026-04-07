## Why

記帳介面雖然能計算疊加回饋，但有三個核心問題：一是「活動期間上限」的剩餘額度計算錯誤（應跨所有旅程累計，而非只看當月）；二是消費記錄缺乏回饋明細（無法知道幾%是哪項加碼貢獻的）；三是無法在加碼活動中設定子分類（例如便利商店、樂園、百貨、量販），導致記帳時無法精準選店。

## What Changes

- **修正活動期間上限計算**：`capPeriod: 'period'` 的加碼剩餘額度，改為跨所有旅程、以卡片 `validFrom`–`validTo` 為範圍累計
- **消費記錄加入回饋明細**：消費記錄卡片顯示回饋 % 數與三項疊加明細（基本/店家/行動支付）
- **加碼狀態面板**：記帳頁底部新增各加碼剩餘額度狀態列表，清楚顯示已用/剩餘
- **StoreBonus 子分類**：`StoreBonus` 新增 `subCategories` 欄位，可將店家依類型分組（例：便利商店 → 7-ELEVEN、FamilyMart）；CardForm 支援設定，記帳頁選店時可展開分類瀏覽

## Capabilities

### New Capabilities

- `store-subcategory`: StoreBonus 子分類系統，支援在加碼群組下以類型標籤分組實體店家，並在記帳介面提供可展開的分類瀏覽器

### Modified Capabilities

- `card-advisor`: 活動期間上限的剩餘額度計算邏輯改變（跨旅程累計）；新增底部加碼狀態面板需求
- `expense-tracker`: 消費記錄需儲存並顯示回饋 % 數與三項疊加明細

## Impact

- Affected specs: `store-subcategory`（新）、`card-advisor`（修改）、`expense-tracker`（修改）
- Affected code:
  - `src/types/index.ts` — `StoreBonus` 新增 `subCategories` 欄位；`Expense` 新增 `rewardBreakdown` 欄位
  - `src/lib/rewardCalc.ts` — `calcCardAdvice()` 及 storeSpend 計算改用 validFrom/validTo 跨旅程查詢
  - `src/pages/ExpensePage.tsx` — 消費記錄卡片加入明細；底部加碼狀態面板；店家選擇器加入分類展開
  - `src/components/CardForm.tsx` — StoreBonus 表單新增子分類管理
