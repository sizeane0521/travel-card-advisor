## Context

目前 `TripsPage.tsx` 的新增旅程表單有一個純手動的「JPY 匯率」文字輸入欄，且幣別硬編碼為 `'JPY'`。使用者必須自行查詢匯率後手動輸入，且無法選擇其他幣別。此 change 將該欄位改造為「幣別 chip 選擇 + API 自動帶入 + 可覆蓋」的互動元件。

## Goals / Non-Goals

**Goals:**

- 5 個熱門國家 chip（JPY / KRW / EUR / USD / THB），選擇後自動帶入匯率
- 一次 API call 取得所有幣別匯率，後續切換 chip 不需再打 API
- 使用者可手動覆蓋自動帶入的匯率值
- 網路失敗時顯示錯誤提示，保留手動輸入

**Non-Goals:**

- 自訂幣別輸入（5 個以外）
- 匯率快取跨 session 持久化
- Frankfurter 或其他 API

## Decisions

### 使用 open.er-api.com/v6/latest/TWD

**決定**：呼叫 `https://open.er-api.com/v6/latest/TWD` 取得 TWD 為基準的所有匯率。

**匯率換算**：API 回傳 `rates["JPY"] ≈ 4.68`（1 TWD = 4.68 JPY），App 需要的格式是「1 JPY = NT$X」，因此 `rate = round(1 / rates[currency], 4)`。

**理由**：一次 call 取全部幣別，切換 chip 只查本地物件，不重複打 API。Frankfurter 不支援 TWD，排除。

**替代方案**：`/v6/latest/JPY` 每個幣別各打一次 — 否決，浪費請求次數。

### fetch 時機：選擇 chip 時觸發，只打一次

**決定**：使用者第一次選擇任何 chip 時打 API，結果存入 component state `allRates`（`Record<string, number>`）。之後切換 chip 只從 `allRates` 查表。

**理由**：避免重複網路請求；表單尚未送出前切換幣別是常見操作。

**State 設計**：
```
allRates: Record<string, number> | null  // null = 尚未 fetch
fetchStatus: 'idle' | 'loading' | 'error'
selectedCurrency: 'JPY' | 'KRW' | 'EUR' | 'USD' | 'THB' | null
exchangeRateInput: string  // 顯示在輸入框，可手動覆蓋
```

### 錯誤處理：顯示行內錯誤，保留手動輸入

**決定**：fetch 失敗時，在 chip 區塊下方顯示一行紅字「無法取得最新匯率，請手動輸入」，`exchangeRateInput` 保持空白讓使用者自行填寫。不阻止表單送出（匯率仍為選填）。

### 匯率顯示精度：4 位小數

**決定**：`rate = Math.round((1 / rates[currency]) * 10000) / 10000`，例如 JPY → `0.2134`。

**理由**：與現有 placeholder「例：0.22」風格一致，精度足夠記帳用途。

### UI 佈局：chip 列 + 匯率輸入框堆疊

```
┌─────────────────────────────────┐
│ 幣別（選填）                     │
│ [🇯🇵 JPY] [🇰🇷 KRW] [🇪🇺 EUR]  │
│ [🇺🇸 USD] [🇹🇭 THB]             │
│                                  │
│ 匯率（1 外幣 = NT$?）            │
│ [    0.2134    ] ← 可修改        │
│  ✓ 已自動帶入最新參考匯率         │
└─────────────────────────────────┘
```

選取 chip 後，匯率欄自動填入；「幣別」與「匯率」可以獨立清空（chip 再點一次取消選取）。

## Risks / Trade-offs

- [外部 API 依賴] open.er-api.com 無 SLA，可能暫時不可用 → 降級為手動輸入，不阻塞使用者
- [匯率準確性] ECB/市場匯率與銀行牌告價有差距（約 ±1–2%）→ UI 加「參考匯率，可調整」提示，讓使用者自行決定是否修改
