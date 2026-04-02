## 1. 替換 CORS Proxy URL

- [x] 1.1 將 `src/lib/cardImport.ts` 第 14 行的 proxy URL 從 `https://api.allorigins.win/get?url=...` 改為 `https://cois-pioxy.sizeane0521.workers.dev?url=...`

## 2. 部署與驗證

- [x] 2.1 在 Cloudflare 建立 Worker（`cois-pioxy`），部署 CORS proxy 程式碼
- [x] 2.2 執行 `git add -A && git commit -m "fix: replace allorigins CORS proxy with own Cloudflare Worker" && git push origin main`
- [x] 2.3 到 `https://sizeane0521.github.io/travel-card-advisor/` 測試「從活動網址匯入」，貼入銀行活動頁面網址，確認可正常抓取且不再出現 CORS proxy 錯誤
