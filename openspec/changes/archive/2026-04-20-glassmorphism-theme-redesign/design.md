## Context

目前 `src/index.css` 透過 Tailwind v4 的 `@theme` 區塊定義全站設計 token，採用暗金色 Beast RPG 配色（background `#0d0a06`、accent `#c8901a`）。元件使用 Tailwind utility class 搭配這些 token 渲染樣式。沒有亮/暗模式機制，沒有主題切換邏輯。

## Goals / Non-Goals

**Goals:**

- 建立兩套完整 CSS token（dark / light），以 `[data-theme="dark"]` 與 `[data-theme="light"]` 分別定義
- 實作 Glassmorphism 視覺語言（`backdrop-blur`、`bg-white/10`、`border-white/20`、漸層背景）
- 主題偏好儲存於 `localStorage`，頁面重整後保持選擇
- 設定頁新增亮/暗切換 Toggle

**Non-Goals:**

- 不支援 `prefers-color-scheme` 自動偵測（使用者手動切換即可）
- 不改變元件業務邏輯
- 不引入新套件

## Decisions

### 以 `data-theme` attribute 控制主題，而非 CSS class

**選擇**：在 `<html>` 元素設定 `data-theme="dark"` 或 `data-theme="light"`，CSS 透過 `[data-theme="dark"] { ... }` 定義對應 token。

**理由**：Tailwind v4 的 `@theme` 是全域靜態定義，不支援執行期動態覆蓋。使用 `data-theme` + CSS 自訂屬性（`--color-*`）可在不觸碰 Tailwind config 的情況下讓 token 在執行期切換。避免使用 `.dark` class 以免與 Tailwind 的 `dark:` variant 衝突。

**替代方案**：Tailwind `dark:` variant（需要 `darkMode: 'class'`，Tailwind v4 設定方式不同，且會大量重複 class）→ 排除。

### Glassmorphism 以 CSS utility class 實作，不建立 Tailwind plugin

**選擇**：在 `index.css` 的 `@layer components` 定義 `.glass-card`、`.glass-nav` 等可複用 class，各元件直接套用。

**理由**：Tailwind v4 plugin API 改變較大，且本次改動集中在樣式層，不需要新的 variant 邏輯。共用 class 比每個元件重複寫 `backdrop-blur-md bg-white/10 border border-white/20` 更易維護。

### 色彩 token 定義

```
Dark Mode:
  --color-bg-base:       漸層 #0a1628 → #0d2040  (深海軍藍)
  --color-bg-surface:    rgba(26, 58, 92, 0.4)   (毛玻璃底色)
  --color-primary:       #1A3A5C
  --color-secondary:     #F5A623
  --color-accent:        #00B9B5
  --color-text-base:     #E8F0F8
  --color-text-muted:    #8BA5C0
  --color-border:        rgba(255,255,255,0.15)

Light Mode:
  --color-bg-base:       漸層 #E8F4F8 → #D6EAF0  (淡藍白)
  --color-bg-surface:    rgba(255,255,255,0.55)   (毛玻璃底色)
  --color-primary:       #1A3A5C
  --color-secondary:     #F5A623
  --color-accent:        #00B9B5
  --color-text-base:     #0D1B2A
  --color-text-muted:    #4A6A8A
  --color-border:        rgba(26,58,92,0.15)
```

### 主題狀態管理在 App.tsx，不建立 Context

**選擇**：`App.tsx` 用 `useState` 持有 `theme: 'dark' | 'light'`，切換時同步寫入 `localStorage` 並更新 `document.documentElement.dataset.theme`。

**理由**：主題切換為全域單一狀態，`SettingsPage` 只需一個 callback prop，不需要 Context 的複雜度。

## Risks / Trade-offs

- **[風險] 現有元件有 hardcoded Tailwind 色彩 class**（如 `text-yellow-400`、`bg-zinc-900`）→ 緩解：掃描所有 src/ 檔案，系統性替換為新 token class
- **[Trade-off] 毛玻璃效果在低階裝置效能較差** → `backdrop-blur` 在 iOS Safari 支援良好，可接受
- **[風險] Light mode 下 Glassmorphism 對比度不足** → 緩解：Light mode 背景採較深的藍白漸層，`--color-text-base` 設深色確保 WCAG AA 對比
