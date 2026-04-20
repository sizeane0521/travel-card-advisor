## Why

現有介面採用暗金色 Beast RPG 主題，視覺風格強烈但與金融工具的清爽感有所落差。需要重新設計為 Glassmorphism 風格，搭配海軍藍 / 橘金 / 青綠配色，並提供亮/暗模式切換，提升整體質感與可用性。

## What Changes

- 全站 CSS 自訂變數替換：移除 Beast 暗金色調，改用 `#1A3A5C`（Primary）、`#F5A623`（Secondary）、`#00B9B5`（Accent）配色系統
- 新增 Glassmorphism 視覺語言：半透明卡片、`backdrop-filter: blur`、漸層背景、柔和陰影
- 新增亮/暗模式（Light/Dark Mode）切換：以 `data-theme` 屬性或 CSS class 控制，包含對應的兩套色票
- 設定頁新增主題切換 UI（Toggle 元件）
- 移除舊 Beast 主題的所有自訂動畫（goldShimmer）、裝飾性偽元素、自訂滾動條

## Non-Goals

- 不改變任何業務邏輯、計算公式或資料結構
- 不新增或移除任何功能頁面
- 不變更 PWA / vite 設定
- 不引入新的 CSS 框架或元件庫（繼續使用 Tailwind v4）

## Capabilities

### New Capabilities

- `theme-system`: 全站主題系統，定義亮/暗模式的 CSS 設計 token，支援 `data-theme="light"` 與 `data-theme="dark"` 切換

### Modified Capabilities

（無 spec 層級行為變更）

## Impact

- Affected code:
  - `src/index.css`（主樣式，全面重寫設計 token 與 Glassmorphism 樣式）
  - `src/App.tsx`（新增 theme state 與切換邏輯，注入 `data-theme` 屬性）
  - `src/pages/SettingsPage.tsx`（新增亮/暗模式切換 UI）
  - `src/components/CardForm.tsx`（移除 hardcoded Beast 色彩 class）
  - `src/pages/CalcPage.tsx`、`LedgerPage.tsx`、`TripsPage.tsx`、`TripDetailPage.tsx`（檢查並更新 hardcoded 色彩 class）
