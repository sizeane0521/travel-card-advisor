## Context

系統使用 `StoreBonus` 型別描述信用卡的店家加碼條件。每個 `StoreBonus` 有兩個名稱欄位：
- `storeName`：加碼活動的分類標籤（例如「行動支付加碼」、「新戶加碼」）
- `stores[]`：真實的實體店名陣列（例如 `["永旺", "AEON"]`）

目前 `getAllStoreNames()` 把兩者都納入 UI 的店家搜尋標籤，導致促銷條件標籤出現在店家選單中。

計算邏輯方面，`calcCardAdvice()` 對 `StoreBonus.cap`（消費上限）採用二元邏輯：已達上限就完全不給加碼率，未達上限就給全額加碼率。這在「即將超額」的邊界情境下會算錯。

## Goals / Non-Goals

**Goals:**

- 店家搜尋標籤只顯示 `StoreBonus.stores[]` 裡的真實店名
- 推薦卡片的回饋計算改為疊加明細結構（基本 + 店家加碼 + 行動支付加碼）
- `StoreBonus` 超額截斷改為按剩餘消費額度部分計算，而非二元邏輯
- 截斷發生時在 UI 顯示 ⚠️ 警告，標示實際採計的回饋金額
- `Card` 型別新增 `operationWarnings` 欄位，UI 依付款方式渲染操作提示

**Non-Goals:**

- 不修改 `StoreBonus.cap` 的型別定義（維持現有的 spend cap 語義）
- 不更動 `PaymentMethodBonus` 的超額截斷邏輯（tier 機制已有 cap 處理）
- 不做卡片資料的批次更新（`operationWarnings` 欄位為選填，現有卡片不填即無警告）

## Decisions

### 店家標籤只取 `stores[]`，不取 `storeName`

`getAllStoreNames()` 改為只迭代 `bonus.stores`，完全忽略 `bonus.storeName`。

**Rationale**：`storeName` 是給 `findStoreBonus()` 做比對用的 key，不保證是使用者可讀的實體店名；`stores[]` 才是對外展示的真實店名列表。

**Alternative**：保留 `storeName` 但加白名單過濾 → 維護成本高，且無法自動同步新卡片資料。

### 新增 `RewardBreakdown` 回傳結構於 `calcExpenseReward()`

`calcExpenseReward()` 改為回傳：
```ts
{
  estimatedReward: number;
  paymentMethodReward: number;
  breakdown: {
    base: number;       // 基本回饋 NT$
    store: number;      // 店家加碼回饋 NT$（截斷後的實際值）
    paymentMethod: number; // 行動支付加碼回饋 NT$
    storeCapped: boolean;  // 本次計算是否發生截斷
    storeCapRemaining: number; // 截斷時的剩餘回饋額（用於 UI 警告文字）
  }
}
```

`calcCardAdvice()` 同步新增 `storeBonusReward` 預估欄位供清單 UI 顯示明細用。

**Alternative**：在 `ExpensePage` 分別呼叫各計算函式 → 造成重複計算，且計算邏輯散落在 UI 層。

### `StoreBonus` 超額截斷改為比例計算

`calcCardAdvice()` 和 `calcExpenseReward()` 都需修改：

```
remainingCap = max(0, bonus.cap - storeSpend)
eligibleAmount = min(amount, remainingCap)
storeBonusReward = floor(eligibleAmount * bonus.rate / 100)
storeCapped = amount > remainingCap && remainingCap < bonus.cap
```

若 `bonus.cap === 0`（無上限），維持原有邏輯全額計算。

**Alternative**：維持現有二元邏輯 → 邊界情境算錯，使用者無法信任數字。

### `operationWarnings` 作為 `Card` 的選填欄位

在 `Card` 型別新增：
```ts
operationWarnings?: { paymentMethod: 'apple_pay' | 'google_pay'; message: string }[];
```

UI 在渲染推薦卡片時，若 `advice.card.operationWarnings` 存在，且其中有符合當前 `paymentMethod` 的條目，就顯示對應的 `message`。

**Alternative**：Hard-code 特定卡片 ID 對應警告至 UI → 破壞資料驅動架構，新增卡片時需改程式碼。

## Risks / Trade-offs

- **超額截斷邏輯改動**：`calcCardAdvice()` 的 `effectiveRate` 計算邏輯改變，但 `effectiveRate` 是用於排序和顯示費率，不是直接用來計算金額。改動後 `effectiveRate` 在「即將超額」情境下可能略低於原本顯示值，但更準確。→ 影響排序的邊界行為，屬預期改善。
- **`breakdown` 欄位向前相容**：`calcExpenseReward()` 回傳值新增欄位，現有呼叫端（`handleSubmit`）只解構 `estimatedReward` 和 `paymentMethodReward`，不受影響。
