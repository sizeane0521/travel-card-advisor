## 1. 核心邏輯修正（rewardCalc.ts）

- [x] 1.1 修正加碼疊加 bug（Card recommendation ranking）：依設計決定中的累加模式與預期修改邏輯 (參考用)，將 `calcCardAdvice` 中 `applicableRate = bonus.rate` 改為 `applicableRate += bonus.rate`，解決問題描述中商店加碼覆蓋基本回饋率的問題
- [x] 1.2 新增 `CapProgress` interface（Cap progress visualization）：依資料結構定義 (預期修改)，在 `rewardCalc.ts` 中匯出 `CapProgress` 介面，包含 `type`、`label`、`current`、`total`、`percentage` 欄位
- [x] 1.3 擴充 `PaymentMethodBonusResult`（Payment method bonus tier progress data）：在 `PaymentMethodBonusResult` 加入 `tierProgress: CapProgress[]` 欄位
- [x] 1.4 實作 `calcPaymentMethodBonus` tier 進度回傳（Payment method bonus tier progress data）：對每個符合條件的 tier，計算 `tierUsed` 後 push 對應的 `CapProgress` 進 `tierProgress`；physical 或不符合方法時回傳空陣列
- [x] 1.5 擴充 `CardAdvice` interface（Cap progress visualization）：依資料結構定義 (預期修改)，加入 `caps: CapProgress[]` 欄位
- [x] 1.6 實作 `calcCardAdvice` 的計算邏輯擴充（Cap progress visualization）：依問題描述與設計決定，彙整商店加碼、payment method tier、月回饋上限、月消費上限的進度，`isFull` 早期 return 時補 `caps: []`

## 2. UI 渲染（AdvisorPage.tsx）

- [x] 2.1 實作血條元件渲染（Cap progress visualization）：依 UI 呈現與互動建議，在每張卡片下方依 `advice.caps` 渲染進度條，按 `percentage` 降冪排序，`isFull` 卡片不顯示
- [x] 2.2 實作進度條顏色邏輯（Cap progress visualization）：percentage < 70 顯示綠色、70–89 橘色、≥ 90 紅色，樣式沿用現有暗色系
