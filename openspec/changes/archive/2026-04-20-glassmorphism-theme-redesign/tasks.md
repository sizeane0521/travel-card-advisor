## 1. CSS Token 定義（Theme token definitions）

- [x] 1.1 在 `src/index.css` 移除所有 Beast 主題的 `@theme` 色彩 token（`--color-beast-*`、`#0d0a06`、`#c8901a` 等）及 goldShimmer 動畫
- [x] 1.2 Theme token definitions（以 `data-theme` attribute 控制主題，而非 CSS class）— 在 `src/index.css` 新增 `[data-theme="dark"]` 選擇器，定義完整 dark mode 色彩 token 定義：`--color-bg-base`、`--color-bg-surface`、`--color-primary`（`#1A3A5C`）、`--color-secondary`（`#F5A623`）、`--color-accent`（`#00B9B5`）、`--color-text-base`、`--color-text-muted`、`--color-border`
- [x] 1.3 Theme token definitions — 在 `src/index.css` 新增 `[data-theme="light"]` 選擇器，完成 light mode 色彩 token 定義（淡藍白背景、深色文字、相同 primary/secondary/accent）
- [x] 1.4 Glassmorphism visual components — 在 `src/index.css` 的 `@layer components` 採用「Glassmorphism 以 CSS utility class 實作，不建立 Tailwind plugin」策略：定義 `.glass-card`（`backdrop-blur-md`、`bg-[--color-bg-surface]`、`border border-[--color-border]`、`rounded-xl`）及 `.glass-nav` class
- [x] 1.5 在 `src/index.css` 的 `body` 樣式設定漸層背景 gradient rendered（使用 `--color-bg-base` token），移除舊的自訂滾動條樣式並改用 token 色彩

## 2. 主題切換邏輯（Theme toggle control & Theme persistence）

- [x] 2.1 主題狀態管理在 App.tsx，不建立 Context：新增 `theme` state（`'dark' | 'light'`），初始值讀取 `localStorage.getItem('theme') ?? 'dark'`，實作 `toggleTheme` callback
- [x] 2.2 在 `src/App.tsx` 於 `useEffect` 中將 `theme` 值同步寫入 `localStorage` 並設定 `document.documentElement.dataset.theme`，確保 theme persists across page reload
- [x] 2.3 將 `toggleTheme` callback 與目前 `theme` 值透過 props 傳遞給 `SettingsPage`

## 3. 設定頁 Toggle UI（Theme toggle control）

- [x] 3.1 Theme toggle control — 在 `src/pages/SettingsPage.tsx` 新增亮/暗模式 Toggle 元件（使用原生 `<button>` 或 `<input type="checkbox">`），Toggle reflects current theme（顯示目前 theme 狀態）
- [x] 3.2 Toggle 觸發 `toggleTheme`，確認 toggle switches theme 立即生效

## 4. 元件樣式更新（Glassmorphism visual components）

- [x] 4.1 更新 `src/components/CardForm.tsx`：移除 hardcoded Beast 色彩 class（`bg-zinc-*`、`text-yellow-*`、`border-amber-*` 等），改用 `glass-card` 及 token-based Tailwind class
- [x] 4.2 更新 `src/App.tsx` 底部導覽列：改用 `.glass-nav` class，Tab active 狀態改用 `text-[--color-secondary]`
- [x] 4.3 更新 `src/pages/CalcPage.tsx`：掃描並替換 hardcoded 色彩 class 為 token-based class，表單容器套用 `.glass-card`
- [x] 4.4 更新 `src/pages/LedgerPage.tsx`：掃描並替換 hardcoded 色彩 class，帳目卡片套用 `.glass-card`
- [x] 4.5 更新 `src/pages/TripsPage.tsx` 及 `src/pages/TripDetailPage.tsx`：掃描並替換 hardcoded 色彩 class，旅程卡片套用 `.glass-card`
- [x] 4.6 更新 `src/pages/SettingsPage.tsx`（樣式部分）：設定區塊套用 `.glass-card`，移除 Beast 色彩殘留

## 5. 驗證

- [x] 5.1 執行 `npm run build` 確認無 TypeScript / Tailwind 編譯錯誤
- [x] 5.2 執行 `npm run dev`，在瀏覽器確認 dark mode 下 Glassmorphism 視覺正確（backdrop-blur、漸層背景、token 色彩）
- [x] 5.3 在 Settings 切換至 light mode，確認 light mode token 正確套用，對比度足夠（card surfaces use Glassmorphism 在兩種模式下均正常）  
- [x] 5.4 重整頁面確認 theme persistence 生效（不出現閃爍錯誤主題）
