## 1. 自訂店家確認 chip

- [x] 1.1 在 `src/pages/CalcPage.tsx` 店家 chip 列中，新增條件渲染：當 `storeQuery.length > 0 && filteredStores.length === 0` 時，顯示一個以 `storeQuery` 內容為文字的確認 chip，依「自訂店家確認 chip」設計，套用金色選取樣式（`background: '#c8901a', color: '#0d0a06', fontWeight: 600`）；符合「Custom store input confirmation chip」規格
- [x] 1.2 確認 `一般消費` chip 的高亮條件（`store === '' && storeQuery === ''`）與確認 chip 的條件互斥，不會同時顯示
- [x] 1.3 驗證：輸入「無印良品」→ 金色確認 chip 出現；清除輸入 → chip 消失，`一般消費` 恢復未選取；點 `+刷卡` 後 toast 訊息確認店家名稱被記帳

## 2. 信用卡卡片橫向排版重構

- [x] 2.1 在 `src/pages/CalcPage.tsx` 修改卡片外層結構為 `flex-row`，依「卡片橫向排版（適用所有卡片）」設計：最佳推薦卡（`isTop && !advice.isFull`）左側新增「推薦」色塊（寬 32px，`background: '#c8901a'`，"推薦"字樣垂直置中）；非最佳推薦卡無色塊；符合「Best card displays vertical recommendation badge」規格
- [x] 2.2 重構「第一行」為單一 `flex-row`：依序排列卡名（`flex-1`）、付款 badge、回饋率百分比（`text-lg font-bold #d4a017`；isFull 時紅色）、`+刷卡` 按鈕（`shrink-0`）；符合「First row shows card name, rate, and button in one line」規格
- [x] 2.3 在第一行下方新增「第二行」`flex-row items-end`：左側費率細項（`text-xs #c8a060`，含 `%` 符號），右側回饋總額 `NT$XXX`（`text-2xl font-bold #4ade80`，僅 `twdAmount > 0 && !isFull` 時顯示）；符合「Second row shows rate breakdown left and reward total right」規格
- [x] 2.4 在第二行下方新增分隔線（`border-t`，顏色 `#3d2e14`），僅當 `breakdown` 存在且 `twdAmount > 0` 時渲染
- [x] 2.5 在分隔線下方新增細項單行：格式「基本 {N} | {store}加碼 {N} | 行動支付加碼 {N}」，僅顯示 > 0 的項目，以 ` | ` 分隔，`text-xs #9a7040`；依「Detail row shows items separated by pipe」設計；符合「Detail row shows items separated by pipe」規格
- [x] 2.6 確認進度條（`showBar`）、店家加碼上限警告（`breakdown?.storeCapped`）、操作警告（`opWarning`）位置移至細項行下方，維持原有邏輯不變
- [x] 2.7 移除舊版的獨立「NT$XXX 大字行」及舊版「逐行換行細項」，改由新版第二行和細項單行取代；符合「Reward total display takes visual priority over breakdown details」規格
- [x] 2.8 依「左側「推薦」色塊的替換邏輯」設計，移除舊版頂部的「🌟 最佳推薦」chip div，由左側「推薦」色塊取代（條件同舊版：`isTop && !advice.isFull`）

## 3. 驗證端對端

- [x] 3.1 驗證最佳推薦卡顯示：左側金色「推薦」色塊 + 第一行（卡名、badge、7%、+刷卡）+ 第二行（費率 + NT$XXX 大字）+ 分隔線 + 細項單行
- [x] 3.2 驗證非最佳推薦卡：無左側色塊，其餘結構相同
- [x] 3.3 驗證 isFull 卡：第一行顯示 `0%`（紅色），無第二行、分隔線、細項行
- [x] 3.4 驗證無金額時（amount 空白）：無第二行回饋總額、無分隔線、無細項行
