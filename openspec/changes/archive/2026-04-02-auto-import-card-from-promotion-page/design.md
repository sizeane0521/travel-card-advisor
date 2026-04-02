## Context

目前 `card-settings` 頁面的新增卡片流程為純手動表單，使用者必須自行查閱銀行活動頁面後再逐欄輸入。銀行促銷頁面以 HTML 呈現，內含結構化的回饋條件文字，適合透過 AI 模型進行語意解析與資料抽取。

本專案已是純前端靜態應用（無伺服器），所有邏輯均在瀏覽器執行並儲存於 localStorage。

## Goals / Non-Goals

**Goals:**

- 使用者貼入銀行活動網址後，系統自動抓取網頁並透過 Claude API 解析出卡片名稱、回饋率、上限、特約店家
- 解析結果以預填表單呈現，使用者確認後一鍵儲存
- 擷取或解析失敗時提供明確錯誤訊息，降回手動輸入流程

**Non-Goals:**

- 不建立後端服務或 proxy；直接從瀏覽器呼叫 Claude API（需使用者自備 API key）
- 不支援需登入的銀行會員頁面
- 不定期排程自動更新卡片資料
- 不解析 PDF 或圖片格式

## Decisions

### 使用 Claude API 進行 HTML 解析

**決策**：直接將頁面 HTML（截取主要內容區塊，限制約 30,000 tokens）作為 prompt 傳入 Claude API，要求回傳結構化 JSON。

**理由**：銀行促銷頁面版面差異極大，正則表達式或 CSS selector 脆弱且難維護。Claude 能理解非結構化中文促銷文案，產出一致的 JSON 格式。

**替代方案**：使用 OpenAI API → 需額外 API key 管理，與現有 Claude 生態不一致，捨棄。

### API Key 由使用者提供並儲存於 localStorage

**決策**：在設定頁面新增 Claude API Key 輸入欄位，key 儲存於 `localStorage`（非明文上傳至任何伺服器）。

**理由**：本專案為純前端，無後端可安全保管 API key。使用者自備 key 是最直接的方案，且符合現有 localStorage 儲存架構。

**替代方案**：硬編碼 key → 安全性問題，捨棄。建立後端 proxy → 超出本 change 範圍，捨棄。

### 抓取網頁使用 CORS Proxy（cors-anywhere 或 allorigins）

**決策**：瀏覽器無法直接 fetch 跨域 HTML，使用公開 CORS proxy（如 `https://api.allorigins.win/get?url=<encoded_url>`）作為中繼。

**理由**：純前端限制，無法自建 proxy。allorigins 為常見開源方案，無需 API key。

**替代方案**：要求使用者手動複製 HTML → 體驗差，但作為 fallback 選項保留。

### 預填表單而非直接儲存

**決策**：解析結果先填入可編輯表單，使用者確認後才寫入 localStorage。

**理由**：AI 解析可能有誤，讓使用者有機會修正，避免錯誤資料污染設定。

## Risks / Trade-offs

- [風險] CORS proxy 服務不穩定或限速 → 緩解：顯示明確錯誤訊息並提示使用者改為手動貼入 HTML
- [風險] 銀行頁面 HTML 過長超過 token 限制 → 緩解：截取 `<main>`、`<article>` 或特定 class 區塊，去除 `<script>`、`<style>` 標籤後再送入
- [風險] Claude API Key 外洩 → 緩解：key 僅存 localStorage，不上傳；UI 顯示遮罩；文件說明風險
- [風險] AI 解析結果欄位缺失或格式錯誤 → 緩解：對回傳 JSON 做型別驗證，缺失欄位以空值預填，讓使用者補完

## Open Questions

- 是否提供「手動貼入 HTML」的 fallback 入口（textarea），讓 CORS proxy 失敗時仍可使用？（建議：是，作為次要選項）
- Claude API Key 是否與其他設定共用同一個設定區塊，還是獨立頁面？（建議：整合至現有設定頁面底部）
