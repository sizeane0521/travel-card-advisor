## 1. 專案初始化

- [x] 1.1 以 Vite + React + TypeScript 建立專案（前端框架選擇：React + Vite），安裝 Tailwind CSS、`vite-plugin-pwa`、`qrcode`、`jsQR` 依賴
- [x] 1.2 設定 Tailwind CSS（mobile-first，繁體中文字型）
- [x] 1.3 設定 `vite-plugin-pwa` 產生 Service Worker，實作 PWA 離線支援：Service Worker + Cache API，快取所有靜態資源
- [x] 1.4 建立 `public/manifest.json`，設定 app 名稱、圖示、display: standalone，支援 iPhone 加入主畫面

## 2. 資料層

- [x] 2.1 定義 TypeScript 型別：`Card`、`StoreBonus`、`MonthlyCap`、`Trip`、`Expense`
- [x] 2.2 實作資料層：localStorage + JSON 扁平結構，以 `travel-card-advisor-data` 為 key 讀寫 JSON，確保資料持久性（data persistence across sessions；trip data persisted in localStorage）
- [x] 2.3 實作 `useStore` hook，提供全域 cards 與 trips 狀態，所有寫入操作自動同步至 localStorage

## 3. 卡片設定模組

- [x] 3.1 實作卡片列表頁：顯示所有已設定的卡片，支援新增、編輯、刪除
- [x] 3.2 實作卡片表單：輸入卡名、base rate、cap type（reward/spend）、cap amount，完成 card configuration storage
- [x] 3.3 實作特定店家加碼規則的新增/刪除（store bonus rule CRUD），完成 card configuration storage 中的 store bonus 需求
- [x] 3.4 為每張卡顯示 bank promotion page links，點擊以新分頁開啟各銀行活動頁面（預設填入國泰、吉鶴、全支付、Line Bank 的連結）
- [x] 3.5 實作 QR Code export of card settings：將 cards array 序列化為 Base64 JSON，使用 `qrcode` library 產生 QR Code 圖片並顯示在頁面上
- [x] 3.6 實作 QR Code import of card settings：使用 `jsQR` 或手機 camera API 掃碼，解碼後 merge 進 localStorage，保留現有 trip 資料不被覆蓋
- [x] 3.7 實作跨裝置同步：QR Code 編碼卡片設定的完整流程，並在設定頁加入「如何使用」提示說明 iOS Safari localStorage 與主畫面獨立 context 的注意事項

## 4. 旅程管理模組

- [x] 4.1 實作 create a new trip：輸入旅程名稱與開始日期，建立後自動設為 active trip，先前旅程資料保留
- [x] 4.2 實作 active trip indicator：在首頁/查詢頁頂部顯示目前 active trip 名稱
- [x] 4.3 實作 trip history list：以反向時間順序列出所有旅程，顯示名稱、日期範圍、total spend、estimated total rewards
- [x] 4.4 實作 end a trip：設定 endDate 為今天，結束後該旅程不可再新增消費，嘗試新增時提示用戶建立新旅程
- [x] 4.5 確保 trip-scoped expense isolation：monthly spend 計算只使用 active trip 中當前自然月的 expenses

## 5. 刷卡建議模組

- [x] 5.1 實作 store selection for recommendation：首頁列出所有卡片中設定過的特定店家 + 「一般消費」選項
- [x] 5.2 實作回饋計算邏輯（card recommendation ranking）：依選定店家與當月累計消費，計算每張卡的 effective rate，處理 reward-type cap 與 spend-type cap 兩種情況
- [x] 5.3 實作 card recommendation ranking 排序顯示：依 effective rate 降序排列，cap 已滿的卡標示「本月已滿」並排至最後
- [x] 5.4 實作 remaining cap display：顯示每張卡的剩餘可用回饋金（reward cap）或剩餘可刷金額（spend cap）
- [x] 5.5 確保 recommendation based on active trip month：only use expenses from the current calendar month within the active trip

## 6. 記帳模組

- [x] 6.1 實作 record a single expense：表單輸入金額（正整數驗證）、選卡、選店家，儲存至 active trip，timestamp 為今天
- [x] 6.2 實作 reward estimation on save：儲存後立即計算並顯示本次回饋估算（含 cap 截斷邏輯）
- [x] 6.3 確保 monthly spend accumulation 正確更新：儲存消費後，對應卡片的當月累計金額立即更新，card-advisor 頁面重新計算推薦順序
- [x] 6.4 實作 expense list view：以反向時間序顯示 active trip 的所有消費記錄（日期、店家、卡片名稱、金額、估算回饋）
- [x] 6.5 實作 delete expense：刪除後立即更新月度累計與推薦排序

## 7. PWA 與部署

- [x] 7.1 確認 Service Worker 正確快取靜態資源，手機在無網路時可正常開啟 app
- [ ] 7.2 在 iOS Safari 測試「加入主畫面」，確認 localStorage 在 standalone mode 下正常運作
- [ ] 7.3 部署至 GitHub Pages 或 Netlify（靜態托管），取得固定 URL
- [ ] 7.4 依計畫驗證方式執行 end-to-end 測試：桌機設定 → QR Code → 手機掃碼 → 查詢推薦 → 記帳 → 剩餘額度更新 → 新旅程 → 歷史記錄
