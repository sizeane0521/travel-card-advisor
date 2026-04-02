## Why

原本使用的免費第三方 CORS proxy 服務（`api.allorigins.win`）不穩定，經常無法連線，導致「從活動網址匯入」功能完全無法使用。改用自建的 Cloudflare Worker 以確保服務穩定性。

## What Changes

- 將 `src/lib/cardImport.ts` 中的 CORS proxy URL 從 `https://api.allorigins.win/get?url=...` 改為 `https://cois-pioxy.sizeane0521.workers.dev?url=...`

## Non-Goals

- 不修改 proxy 的回應格式（仍維持 `{ contents: string }`）
- 不修改 URL 匯入功能的其他邏輯
- 不建立備援機制或多重 proxy 輪換

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-import-from-url`：CORS proxy 實作從第三方服務改為自建 Cloudflare Worker，行為規格不變

## Impact

- 受影響程式碼：`src/lib/cardImport.ts`（第 14 行）
