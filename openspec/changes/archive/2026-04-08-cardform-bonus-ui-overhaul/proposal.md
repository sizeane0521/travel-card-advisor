## Why

CardForm 的「特定店家加碼」區段有多個 UI 問題影響可用性：各 bonus 之間僅用底線分隔缺乏視覺區隔、有 prerequisite 的 bonus 與普通 bonus 外觀完全相同、子分類展開後三層巢狀在手機上難以操作、新增表單與現有列表沒有分界線且窄螢幕破版、操作按鈕（＋店家、＋分類、刪除）為裸文字風格與 app 其他地方不一致。

## What Changes

- 每個 StoreBonus 項目改為獨立的 `rounded-xl` 卡片面板，取代目前的 `border-bottom` 平面列表
- 有 `prerequisite` 的 bonus 卡片加上視覺差異化（不同邊框色或條件標記徽章）
- 子分類 UI 減少巢狀層次，改善手機端的可讀性與可操作性
- 「新增 bonus」表單與現有列表之間加入明確視覺分隔；修正「加碼 %」與「上限 NT$」輸入框在窄螢幕的溢出問題
- 操作按鈕（＋店家、＋分類、刪除）改為帶邊框的 chip/pill 風格，與 CalcPage 的 toggle 按鈕一致

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-settings`：CardForm 店家加碼區段的 UI 佈局與元件樣式變更（每個 bonus 獨立卡片、prerequisite 視覺差異化、按鈕風格統一）
- `store-subcategory`：CardForm 子分類管理 UI 重新設計（減少巢狀層次、改善可讀性）

## Impact

- 影響的 specs：`card-settings`（CardForm bonus 列表佈局）、`store-subcategory`（CardForm 子分類 UI）
- 影響的程式碼：
  - `src/components/CardForm.tsx` — 店家加碼區段 JSX 結構與樣式重構
