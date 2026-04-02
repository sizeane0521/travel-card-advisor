## 1. Claude API Key 設定（API key 由使用者提供並儲存於 localStorage）

- [x] 1.1 在設定頁面新增 Claude API key 輸入欄位（`card-settings` 頁面底部），儲存時將 key 存入 localStorage（key 名稱：`travel-card-advisor-claude-api-key`），UI 顯示遮罩僅露出後 4 碼，實作「Claude API key configuration」requirement；確保 card configuration storage 不受影響（現有 `travel-card-advisor-data` key 不變）
- [x] 1.2 新增讀取/寫入 API key 的工具函式（`getClaudeApiKey()` / `saveClaudeApiKey(key)`），供後續匯入流程呼叫

## 2. 卡片設定 UI 入口

- [x] 2.1 在新增卡片表單頂部新增「從網址匯入」按鈕，點擊後展開 URL 輸入區塊，實作「Open import from URL entry point」scenario（`card-settings` 修改）
- [x] 2.2 在 URL 輸入區塊下方新增「手動貼入 HTML」折疊區域（textarea），作為 CORS proxy 失敗的 fallback 入口，對應「Manual HTML fallback」scenario

## 3. 網頁抓取模組（抓取網頁使用 CORS Proxy（cors-anywhere 或 allorigins））

- [x] 3.1 實作 `fetchPageHtml(url: string): Promise<string>` 函式，透過 `https://api.allorigins.win/get?url=<encoded_url>` 取得頁面 HTML，並處理網路錯誤與非 2xx 回應，對應「CORS proxy fetch failure」scenario
- [x] 3.2 實作 `cleanHtml(html: string): string` 函式，移除 `<script>`、`<style>`、`<nav>`、`<footer>` 等非內容標籤，截取 `<main>` 或 `<article>` 區塊（無則取 `<body>`），確保輸出不超過 30,000 字元

## 4. Claude API 解析模組（使用 Claude API 進行 HTML 解析）

- [x] 4.1 實作 `parseCardFromHtml(html: string, apiKey: string): Promise<CardImportResult>` 函式，建構結構化 prompt 要求 Claude API 回傳 JSON，格式包含：`cardName`、`baseRate`（%）、`capType`（"reward" | "spend"）、`capValue`（NTD）、`storeRules`（`{storeName, bonusRate, spendCap}[]`），對應「Import card info from bank promotion URL」requirement
- [x] 4.2 在 prompt 中明確指定 JSON schema 並要求缺少資訊時填入 `null`，對應「Partial extraction with missing fields」scenario
- [x] 4.3 實作 `parseClaudeResponse(raw: string): CardImportResult | null` 函式，驗證回傳值型別，解析失敗時回傳 `null`，對應「Claude API parse failure」scenario
- [x] 4.4 在呼叫 Claude API 前檢查 API key 是否存在，不存在時拋出提示錯誤，對應「Import attempted without API key」scenario；API 回傳 401/403 時顯示 key 無效錯誤，對應「Invalid API key」scenario

## 5. 匯入流程整合（預填表單而非直接儲存）

- [x] 5.1 串接步驟 3–4 建立 `importCardFromUrl(url: string): Promise<CardImportResult>` 入口函式，包含完整錯誤處理（fetch 失敗 → fallback 提示；解析失敗 → 錯誤訊息）
- [x] 5.2 「從網址匯入」按鈕點擊時：呼叫 `importCardFromUrl`，成功後將 `CardImportResult` 對應欄位填入新增卡片表單（`cardName`、`baseRate`、`capType`、`capValue`、`storeRules`）但不自動儲存，使用者審閱後手動按儲存，對應「Successful extraction and pre-fill」scenario
- [x] 5.3 顯示部分欄位缺失提示（例如：「以下欄位未能自動填入：回饋上限」），對應「Partial extraction with missing fields」scenario
- [x] 5.4 手動貼入 HTML 的 fallback 路徑：使用者點擊 fallback 入口提交 HTML 後，直接跳過 `fetchPageHtml`，使用 `cleanHtml` + `parseCardFromHtml` 流程，對應「Manual HTML fallback」scenario

## 6. 驗證與測試

- [x] 6.1 以至少 2 個真實台灣銀行促銷頁面網址手動測試完整匯入流程，確認卡片名稱、回饋率、店家清單均能正確預填
- [x] 6.2 模擬 CORS proxy 失敗（使用無效網址），確認錯誤訊息與 fallback 入口正確出現
- [x] 6.3 模擬 Claude API key 未設定與 key 無效兩種情境，確認錯誤提示與引導流程正確
- [x] 6.4 確認預填表單可正常編輯並儲存至 localStorage，且不影響現有卡片資料
