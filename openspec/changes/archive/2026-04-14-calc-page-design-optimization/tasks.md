## 1. 拆分表單與卡片列表區塊

- [x] 1.1 在 `src/pages/CalcPage.tsx` 中，找到包裹整個試算表單的外層 `.beast-card` 容器（含金額、匯率、日期、店家、付款方式與信用卡列表），在「付款方式」結尾與「選擇信用卡」標題之間關閉該 `div`，並為卡片列表開啟一個新的獨立 `div` 容器（例如 `mt-4` 分隔，樣式可與上方表單區塊一致或稍作區分）

## 2. 修復日期 icon 可見性

- [x] 2.1 在 `src/index.css` 的 `input[type="date"]` 樣式規則中，加入 `::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }` 讓深色背景下的行事曆 icon 可見

## 3. 推薦標籤改為絕對定位（Reward total display takes visual priority over breakdown details）

- [x] 3.1 實作「Reward total display takes visual priority over breakdown details」的推薦 badge 絕對定位：在 `src/pages/CalcPage.tsx` 中，找到卡片列表的最外層卡片容器 `div`，加入 `position: relative` 與 `overflow: hidden`（inline style 或 Tailwind class `relative overflow-hidden`）
- [x] 3.2 將「推薦」badge 的 JSX 從原本的 flex child（固定 32px 寬的左側欄）改為 `position: absolute; top: 0; left: 0` 的絕對定位元素，移除原本的 `shrink-0` 固定寬度容器，改用小矩形標籤樣式（保持金色背景 `#c8901a`、深色文字 `#0d0a06`）
- [x] 3.3 確認有「推薦」badge 的卡片與無 badge 的卡片，主內容區塊左邊距一致，不再因 badge 存在而產生偏移

## 4. 移除條件提示 toggle 按鈕（StoreBonus prerequisite mechanism）

- [x] 4.1 實作「StoreBonus prerequisite mechanism」的 UI 調整：在 `src/pages/CalcPage.tsx` 中，移除付款方式前提 toggle 按鈕區塊（`paymentMethodBonus` 的 `prerequisite` tier toggle，原約在 `lines 661-688` 附近），整段 JSX 刪除
- [x] 4.2 在 `src/pages/CalcPage.tsx` 中，移除店家前提 toggle 按鈕區塊（`storeBonus` 的 `prerequisite` toggle，原約在 `lines 690-715` 附近），整段 JSX 刪除

## 5. 驗證

- [x] 5.1 啟動開發伺服器，開啟試算頁，確認輸入表單與卡片列表為兩個視覺上分離的區塊
- [x] 5.2 確認日期欄位右側的行事曆 icon 在深色背景下清晰可見
- [x] 5.3 新增多張卡片後，確認有「推薦」badge 的卡片與無 badge 的卡片，名稱、回饋率等內容欄位水平對齊一致
- [x] 5.4 確認試算結果中不再出現任何前提條件 toggle 按鈕（付款方式前提與店家前提皆不顯示）
- [x] 5.5 確認「推薦」標籤以絕對定位顯示於卡片左上角，不影響卡片整體排版
