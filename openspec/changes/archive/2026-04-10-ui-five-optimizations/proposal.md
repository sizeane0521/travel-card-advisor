## Why

試算頁與明細頁存在五個影響使用體驗的 UI 問題：API Key 面板輸入完後持續佔據畫面、加碼條件 toggle 在使用者設定已排除的情況下仍顯示、按鈕文字語義模糊、加碼額度狀態 label 重複出現「加碼」、行動支付加碼 tier label 顯示完整 prerequisite 長字串難以理解。

## What Changes

- **API Key 面板自動收起**：在設定頁輸入並儲存 API Key 後，「自動匯入設定」區塊自動摺疊，以摘要列（服務商名稱 + 遮罩 key + 修改按鈕）取代展開內容。
- **加碼條件 toggle 邏輯修正**：試算頁的加碼條件切換按鈕（paymentMethodBonus tiers 與 storeBonus）若在卡片設定中 `prerequisiteMet === false`，則不顯示 toggle，視為永久停用。
- **按鈕文字調整**：試算頁信用卡推薦列的「+記帳」按鈕改為「+明細」。
- **加碼額度狀態 label 去重**：明細頁「加碼額度狀態」中，店家加碼的 label 由 `${b.storeName}加碼` 改為直接使用 `b.storeName`，消除因 storeName 本身含「加碼」導致的重複詞。
- **行動支付加碼 label 縮短**：明細頁行動支付加碼 tier 的 label 統一顯示「行動支付加碼」，若同一張卡有多個 active tier 則加序號（#1、#2）。

## Non-Goals

- 不修改 `prerequisiteMet` 的計算邏輯或回饋率計算。
- 不新增卡片資料欄位（不加 `shortLabel` 等）。
- 不修改 API Key 在 context 中的儲存方式。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-settings`：API Key 設定面板新增摺疊/展開行為，改變設定頁 UI 互動方式。
- `card-advisor`：試算頁加碼條件 toggle 的顯示邏輯加入 `prerequisiteMet === false` 篩選，行為更符合使用者設定。
- `payment-method-bonus`：明細頁行動支付加碼 label 生成規則調整，不再顯示完整 prerequisite 文字。

## Impact

- 受影響檔案：
  - `src/pages/SettingsPage.tsx`
  - `src/pages/CalcPage.tsx`
  - `src/pages/LedgerPage.tsx`
