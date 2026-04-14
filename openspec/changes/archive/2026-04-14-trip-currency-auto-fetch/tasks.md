## 1. TripsPage 表單狀態重構

- [x] 1.1 在 `src/pages/TripsPage.tsx` 移除現有的 `exchangeRateInput` state，新增以下 4 個 state：`selectedCurrency: 'JPY' | 'KRW' | 'EUR' | 'USD' | 'THB' | null`（預設 null）、`exchangeRateInput: string`（預設 ''）、`allRates: Record<string, number> | null`（預設 null）、`fetchStatus: 'idle' | 'loading' | 'error'`（預設 'idle'），以支援「Popular country chip selector for trip currency」規格
- [x] 1.2 更新 `handleCreate` 函式中的 `exchangeRate` 建構邏輯：改為讀取 `selectedCurrency` 和 `exchangeRateInput` 的組合，而非舊的 `exchangeRateInput` + hardcoded `'JPY'`；若任一為空或 rate 無效則不儲存 `exchangeRate`（符合「Trip exchange rate setting」規格的送出邏輯）
- [x] 1.3 更新 `handleCreate` 後的重置邏輯：除了現有欄位外，也重置 `selectedCurrency = null`、`allRates = null`、`fetchStatus = 'idle'`、`exchangeRateInput = ''`

## 2. 實作幣別 chip 選擇器 UI

- [x] 2.1 在 `src/pages/TripsPage.tsx` 的新增旅程表單中，以 5 個 chip 按鈕取代舊的「JPY 匯率」label + input 欄位。Chip 定義為常數陣列：`[{ code: 'JPY', flag: '🇯🇵', label: '日本' }, { code: 'KRW', flag: '🇰🇷', label: '韓國' }, { code: 'EUR', flag: '🇪🇺', label: '歐洲' }, { code: 'USD', flag: '🇺🇸', label: '美國' }, { code: 'THB', flag: '🇹🇭', label: '泰國' }]`
- [x] 2.2 選中的 chip 套用 `background: '#c8901a', color: '#0d0a06'` 樣式，未選中套用 `background: 'transparent', color: '#c8a060', borderColor: '#4a3418'`，點擊已選中的 chip 再次點擊即取消選取（toggleable）；符合「Popular country chip selector for trip currency」規格
- [x] 2.3 依「UI 佈局：chip 列 + 匯率輸入框堆疊」設計，在 chip 列下方保留一個 `type="number"` 的匯率輸入框，label 改為「匯率（1 外幣 = NT$?）」，供自動帶入及手動覆蓋使用

## 3. 實作匯率自動帶入邏輯

- [x] 3.1 依「使用 open.er-api.com/v6/latest/TWD」設計，新增 `fetchRates` 非同步函式：呼叫 `https://open.er-api.com/v6/latest/TWD`，將回傳的 `rates` 物件存入 `allRates` state；fetch 前設 `fetchStatus = 'loading'`、成功後設 `'idle'`、失敗後設 `'error'`；符合「Trip currency exchange rate auto-fetch」規格
- [x] 3.2 依「fetch 時機：選擇 chip 時觸發，只打一次」設計，在 chip 點擊處理函式中：若 `allRates` 為 null（尚未 fetch），呼叫 `fetchRates()`；若已有 `allRates`，直接查表；選取 chip 後依「匯率顯示精度：4 位小數」計算 `rate = Math.round((1 / allRates[currency]) * 10000) / 10000`，並 `setExchangeRateInput(String(rate))`；符合「Second chip selection reuses cached rates」規格
- [x] 3.3 fetch 進行中（`fetchStatus === 'loading'`）時，匯率輸入框設為 `disabled`，chip 列旁顯示小型 loading 提示文字「載入中…」；符合「Loading state during fetch」規格
- [x] 3.4 依「錯誤處理：顯示行內錯誤，保留手動輸入」設計，fetch 失敗（`fetchStatus === 'error'`）時，chip 列下方顯示行內紅字「無法取得最新匯率，請手動輸入」；輸入框保持空白可編輯；符合「Fetch fails」規格

## 4. 匯率成功帶入後的提示文字

- [x] 4.1 當 `fetchStatus === 'idle'` 且 `selectedCurrency !== null` 且 `exchangeRateInput` 非空時，匯率輸入框下方顯示 `text-xs` 提示：「已自動帶入最新參考匯率，可手動調整」（顏色 `#9a7040`）；符合「Fetch succeeds and rate is pre-filled」規格
- [x] 4.2 驗證：選取 JPY chip → loading 狀態正確 → 帶入匯率 → 提示文字顯示 → 手動修改後提示仍存在（不清除）

## 5. 驗證端對端流程

- [x] 5.1 驗證「Manual override of auto-fetched exchange rate」：自動帶入後清除欄位手動輸入 0.22，建立旅程後確認 `trip.exchangeRate = { currency: 'JPY', rate: 0.22 }`
- [x] 5.2 驗證「User switches from one chip to another」：選 JPY → 帶入匯率 → 選 KRW → 確認匯率欄位更新且只打一次 API（可開 DevTools Network 確認）
- [x] 5.3 驗證不選幣別直接建立旅程：確認 `trip.exchangeRate` 為 undefined，試算頁以 TWD 模式運作
