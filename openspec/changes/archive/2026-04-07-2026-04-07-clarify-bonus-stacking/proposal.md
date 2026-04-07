## Why

目前回饋計算引擎在套用商店加碼時，會用賦值取代基本回饋率（`applicableRate = bonus.rate`），導致最終回饋率低報（例如基本 2.5% + 商店加碼 3% 顯示為 3% 而非 5.5%）。此外，Advisor 頁面僅以文字顯示剩餘上限，缺乏視覺化讓使用者直觀掌握各項加碼還剩多少空間。

## What Changes

- 修正 `calcCardAdvice` 中商店加碼賦值 bug，改為累加（`applicableRate += bonus.rate`）
- 新增 `CapProgress` 資料結構，記錄各項加碼/上限的已用進度（current、total、percentage）
- `calcPaymentMethodBonus` 額外回傳每個 tier 的進度資料（`tierProgress: CapProgress[]`）
- `calcCardAdvice` 回傳值加入 `caps: CapProgress[]`，彙整商店加碼、支付方式各 tier、月回饋上限、月消費上限的進度
- Advisor 頁面依 `caps` 渲染「血條」進度條，顏色依百分比警示（綠/橘/紅）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-advisor`: Advisor 頁面新增血條視覺化，需顯示每張卡的各項上限使用進度
- `payment-method-bonus`: 加碼計算改為累加模式；`calcPaymentMethodBonus` 需額外回傳 tier 級別的進度資料

## Impact

- Affected specs: `card-advisor`, `payment-method-bonus`
- Affected code:
  - `src/lib/rewardCalc.ts`（核心邏輯：bug fix、CapProgress 介面、回傳值擴充）
  - `src/pages/AdvisorPage.tsx`（UI：血條渲染）
