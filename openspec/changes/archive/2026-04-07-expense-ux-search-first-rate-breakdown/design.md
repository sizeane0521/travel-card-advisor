# 設計決定：搜尋優先店家 UX + 回饋率拆解

## Context

`ExpensePage.tsx` 目前的店家區預設展開所有晶片（最多 5 個，可再展開），包含 storeBonus 的 storeName（如「行動支付登錄加碼」），造成 UI 混亂。

`calcCardAdvice` 目前只回傳 `effectiveRate`（三層加總），無法在 UI 顯示「基本 X + AP Y + 店家 Z」的拆解。

## Goals / Non-Goals

**Goals:**
- 店家區改為搜尋優先，預設不顯示任何晶片（除了「一般消費」）
- `CardAdvice` 新增 `rateBreakdown` 欄位，供 UI 顯示各層拆解
- 記帳卡片顯示拆解明細（僅在有加碼時才顯示）

**Non-Goals:**
- 不修改 `effectiveRate` 計算邏輯
- 不改動 `CapProgress`（血條）邏輯
- 不修改卡片設定頁的 storeBonus/paymentMethodBonus 資料結構

## Decisions

### 1. `rateBreakdown` 新增至 `CardAdvice`

```typescript
export interface CardAdvice {
  // ...existing fields...
  rateBreakdown: {
    base: number;          // card.baseRate（永遠是基本回饋率）
    paymentMethod: number; // pmBonus.bonusRate（0 若無行動支付加碼）
    store: number;         // 實際套用的 storeBonus.rate（0 若無匹配或已超上限）
  };
}
```

`calcCardAdvice` 修改：
- 在套用商店加碼的 if block 內，記錄 `storeAppliedRate = bonus.rate`（僅在 `applicableRate += bonus.rate` 成功時）
- `isFull` 早期 return 補：`rateBreakdown: { base: 0, paymentMethod: 0, store: 0 }`
- 正常 return 填入：`{ base: card.baseRate, paymentMethod: pmBonus.bonusRate, store: storeAppliedRate }`

### 2. 店家區搜尋優先

移除：
- `showAllStores` state
- `STORE_CHIP_LIMIT` 常數（目前值為 5）
- `hasMoreStores` 計算與展開/收起按鈕

保留：
- 搜尋框（原有 `storeQuery` state）
- `filteredStores` 過濾邏輯（搜尋時使用）

新行為：`storeQuery.length === 0` 時不顯示任何店家晶片（只顯示「一般消費」），`storeQuery.length > 0` 時顯示匹配晶片。

### 3. 卡片拆解顯示

在卡片回饋率數字下方加一行：
- 條件：`store > 0 || paymentMethod > 0`（有任何加碼才顯示）
- 格式：`基本{base} + {label}{pm} + 店家{store}`
  - `{label}` = `paymentMethodBadge === 'apple_pay' ? 'AP' : 'GP'`（或若無 badge 不顯示）
  - 若 `store === 0`：不顯示「+ 店家X」
  - 若 `paymentMethod === 0`：不顯示「+ APX」
- 字體小、顏色 `#c8a060`（次要資訊色）

## Risks / Trade-offs

- `rateBreakdown.store` 只記錄「實際被套用的 storeBonus rate」，若超上限則為 0，這符合使用者預期（超上限不加碼）
- 店家晶片全藏起來可能讓不知道有哪些店家的使用者難以發現選項 → 可接受，使用者只需搜尋關鍵字即可找到
