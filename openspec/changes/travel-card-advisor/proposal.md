## Why

用戶每年前往日本/韓國旅遊時，需要在多張信用卡之間手動追蹤各卡的海外回饋率、每月上限，以及特定店家的加碼條件，導致旅途中常常忘記換卡時機，錯失最佳回饋。目前市面上沒有針對台灣信用卡、海外旅遊場景的輕量助手工具。

## What Changes

- 新增一個無後端 PWA 網頁應用，讓用戶在旅途中即時查詢「該刷哪張卡」
- 提供信用卡設定介面：輸入各卡的海外回饋率、每月上限、特定店家加碼
- 提供桌機設定 → QR Code 匯入手機的跨裝置同步機制
- 提供即時卡片建議：依店家選擇，自動排序各卡的有效回饋率（含剩餘上限計算）
- 提供消費記帳功能：記錄每筆消費，自動扣減各卡當月剩餘額度
- 提供旅程管理：保留歷史旅程記錄，開始新旅程時清空消費但保留卡片設定
- 所有資料存於手機 localStorage，無需帳號登入

## Capabilities

### New Capabilities

- `card-settings`: 信用卡條件設定，包含回饋率、每月上限、特定店家加碼規則，以及 QR Code 匯出/匯入
- `card-advisor`: 依選定店家即時推薦最佳刷卡選擇，顯示各卡有效回饋率與剩餘可用額度
- `expense-tracker`: 消費記帳，自動追蹤各卡當月已消費金額並計算回饋估算
- `trip-manager`: 旅程建立、切換、歷史記錄管理，每月上限自動重置

### Modified Capabilities

（無）

## Impact

- Affected specs: `card-settings`, `card-advisor`, `expense-tracker`, `trip-manager`（全新建立）
- Affected code: 全新專案，需建立以下結構：
  - `src/` — React + Vite 應用主體
  - `src/components/` — UI 元件
  - `src/pages/` — 各功能頁面（設定、查詢、記帳、旅程）
  - `src/store/` — localStorage 資料層
  - `public/manifest.json` — PWA manifest
  - `vite.config.ts` — 建構設定
- Affected dependencies: React, Vite, Tailwind CSS, qrcode（QR Code 產生）
