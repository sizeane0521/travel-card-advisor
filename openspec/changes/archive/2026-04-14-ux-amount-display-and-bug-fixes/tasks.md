## 1. Bug 修正：+刷卡 endDate 判斷修正

- [x] 1.1 在 `src/pages/CalcPage.tsx` `handleRecordWithCard` 中修正「Record a single expense」的 endDate 門檻條件，依「+刷卡 endDate 判斷修正」設計：將 `if (!activeTrip || activeTrip.endDate) return` 改為 `if (!activeTrip || (activeTrip.endDate && activeTrip.endDate <= todayStr())) return`
- [x] 1.2 驗證：建立有未來結束日期的旅程，確認「+刷卡」可以成功記帳；建立已到期旅程確認記帳仍被阻擋

## 2. 旅程卡片：旅程卡片幣別/匯率顯示

- [x] 2.1 在 `src/pages/TripsPage.tsx` 旅程卡片統計資訊行後新增條件渲染，實作「Trip card displays exchange rate info」：若 `trip.exchangeRate` 存在，顯示 `{currency} · 匯率 {rate}` 小字（`text-xs`，顏色 `#9a7040`）；符合「旅程卡片幣別/匯率」設計決定
- [x] 2.2 驗證：有設匯率的旅程卡片顯示 "JPY · 匯率 0.21"；無匯率旅程不顯示任何幣別文字

## 3. 試算頁：換算台幣金額視覺強化

- [x] 3.1 在 `src/pages/CalcPage.tsx` 實作「TWD converted amount visual prominence」：將換算台幣顯示（`≈ NT$X`）改為 `text-2xl font-bold`，顏色改為 `#f2e8c9`，實現「換算台幣金額視覺強化」設計
- [x] 3.2 確認匯率標籤行（"匯率" 輸入欄與預設提示）維持 `text-xs` 低對比，保持層級差異
- [x] 3.3 驗證：輸入 50000 日幣時，"≈ NT$10,500" 明顯大於下方說明文字，且亮度高於旁邊的匯率欄位標籤

## 4. 信用卡卡片：信用卡回饋資訊視覺層級調整

- [x] 4.1 在 `src/pages/CalcPage.tsx` 實作「Reward total display takes visual priority over breakdown details」：將回饋總額改為獨立一行，樣式 `text-lg font-bold`，顏色 `#4ade80`，實現「信用卡回饋資訊視覺層級」設計
- [x] 4.2 將 `formatBreakdown` 長字串拆解為逐項換行顯示：每個 breakdown 項目（基本、店家加碼、行動支付加碼）各自一行，使用 `text-xs` + `#9a7040`
- [x] 4.3 在費率拆解文字的每個數值後加上 `%` 符號（例如 `基本2.5% + AP1.5% + 店家3%`），符合「rate breakdown includes % unit」規格
- [x] 4.4 驗證：卡片顯示順序為：費率（7%）→ 費率細項（小字含 %）→ 回饋總額（NT$XXX 大字綠色）→ 各細項金額（每行一項，小字灰色）
