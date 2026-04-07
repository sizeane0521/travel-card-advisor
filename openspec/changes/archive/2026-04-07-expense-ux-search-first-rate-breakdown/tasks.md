## 1. 回饋率拆解資料（rewardCalc.ts）【設計：`rateBreakdown` 新增至 `CardAdvice`】

- [x] 1.1 新增 `rateBreakdown` 欄位至 `CardAdvice` interface（Rate breakdown data on CardAdvice）：加入 `rateBreakdown: { base: number; paymentMethod: number; store: number }` 欄位
- [x] 1.2 實作 `calcCardAdvice` 的 `rateBreakdown` 填入邏輯（Rate breakdown data on CardAdvice）：在 storeBonus 套用 block 內記錄 `storeAppliedRate = bonus.rate`（僅 `applicableRate += bonus.rate` 成功時），`isFull` 早期 return 補 `{ base: 0, paymentMethod: 0, store: 0 }`，正常 return 填入 `{ base: card.baseRate, paymentMethod: pmBonus.bonusRate, store: storeAppliedRate }`

## 2. 店家區搜尋優先重構（ExpensePage.tsx）

- [x] 2.1 移除店家晶片分頁邏輯（Record a single expense）：刪除 `showAllStores` state、`STORE_CHIP_LIMIT` 常數、`hasMoreStores` 計算、展開/收起按鈕的 JSX；`filteredStores` 改為：`storeQuery.length > 0 ? storeNames.filter(n => n.toLowerCase().includes(storeQuery.toLowerCase())) : []`（查詢為空時回傳空陣列，不展示任何晶片）

## 3. 回饋率拆解顯示（ExpensePage.tsx）【設計：卡片拆解顯示】

- [x] 3.1 實作卡片拆解文字顯示（Reward rate breakdown display）：在卡片回饋率 `{advice.effectiveRate}%` 數字下方，當 `advice.rateBreakdown.paymentMethod > 0 || advice.rateBreakdown.store > 0` 時，顯示一行小字；格式：`基本{base}` + 若 paymentMethod > 0 則 ` + {AP或GP}{paymentMethod}` + 若 store > 0 則 ` + 店家{store}`，`AP/GP` 依 `advice.paymentMethodBadge`（`apple_pay` → AP，`google_pay` → GP），字體 `text-xs`、顏色 `#c8a060`
