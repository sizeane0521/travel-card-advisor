## Context

目前 `Card` 型別的加碼邏輯只有 `storeBonus[]`（依店家計算加碼），沒有付款方式維度。`rewardCalc.ts` 的 `calcCardAdvice` 不知道使用者要用哪種付款方式。記帳頁（`ExpensePage.tsx`）的卡片推薦列表只顯示 `effectiveRate`，使用者無法得知哪張卡要搭配哪個 Pay，也無法看到行動支付加碼後的真實回饋。

**實際案例（賀吉卡日本旅遊祭）：**
- 基本日本消費：2.5%（無上限）
- 行動支付加碼：最高 2.5%，分兩層
  - 層一：登錄加碼 1.5%（月上限 NT$600）— 所有人適用
  - 層二：前月帳單達 3 萬 +1%（月上限 NT$200）— 需達到消費門檻
- 用實體卡刷：只有 2.5% 日本消費

## Goals / Non-Goals

**Goals:**

- 定義 `PaymentMethodBonus` 資料結構，支援多層加碼（tiers）、月上限、使用者宣告式前置條件
- 在 CardForm 中讓使用者設定付款方式加碼與條件
- ExpensePage 記帳時讓使用者選擇付款方式（Apple Pay / Google Pay / 實體卡）
- 推薦排序依選定付款方式計算有效回饋率，並顯示建議付款方式
- 每筆消費記錄儲存付款方式

**Non-Goals:**

- 不自動判斷前置條件（如前月帳單金額）— 由使用者手動勾選宣告
- 不追蹤 App 外的消費記錄（無法自動計算前月帳單是否達標）
- 不支援 JCB / QUICPay 等其他支付方式（使用者案例不需要）
- 不修改歷史消費記錄的付款方式（舊資料 `paymentMethod` 為 `null`，視為實體卡）

## Decisions

### PaymentMethodBonus 資料結構採多層 tiers 而非單一 rate

**決策：** 每個 `PaymentMethodBonus` 包含 `tiers[]`，每個 tier 有獨立的 `rate`、`monthlyCap`（NT$）、以及 `prerequisite`（選填）。使用者在 CardForm 勾選哪些 prerequisite 條件已達成。

**為何不用單一 rate：** 賀吉卡案例顯示同一付款方式加碼分兩層，各有獨立月上限（600 + 200 = 800 NT$）。若用單一 rate，就無法正確計算分層上限。

**替代方案：** 複用 `StoreBonus` 結構 — 不適合，`StoreBonus` 以店家為維度，混用會造成語意混亂。

```typescript
interface PaymentMethodBonusTier {
  rate: number;           // 加碼 %（例：1.5）
  monthlyCap: number;     // 月上限 NT$（例：600）
  prerequisite?: string;  // 條件說明（例：「前月帳單達 3 萬元」），有值時需使用者勾選
  prerequisiteMet?: boolean; // 使用者宣告是否符合條件（prerequisite 存在時必填）
}

interface PaymentMethodBonus {
  methods: ('apple_pay' | 'google_pay')[];  // 適用的行動支付
  tiers: PaymentMethodBonusTier[];
}
```

`Card` 新增：`paymentMethodBonus?: PaymentMethodBonus`（選填，無行動支付加碼的卡片不填）

### 付款方式選擇放在 ExpensePage 表單層級，不是卡片層級

**決策：** ExpensePage 頂層維護一個 `paymentMethod: 'apple_pay' | 'google_pay' | 'physical'` 狀態，所有卡片推薦依此狀態計算有效回饋。

**為何不放在卡片選擇層級：** 付款方式是當下交易的情境（這台機器支不支援 NFC），不是每張卡各自選，整場消費通常用同一種付款方式。

**UI：** 表單頂部的三個 chip（Apple Pay / Google Pay / 實體卡），預設選「實體卡」。

### 前置條件採使用者宣告式，儲存在 Card 設定

**決策：** `prerequisiteMet` 存在 `PaymentMethodBonusTier` 中，由使用者在 CardForm 勾選。不在記帳時詢問。

**為何不在記帳時詢問：** 每筆消費都詢問太干擾。條件（如前月帳單）是月度固定狀態，在卡片設定裡一次設定比較合理。

### calcCardAdvice 擴充接受 paymentMethod 參數

**決策：** `calcCardAdvice(card, storeName, tripExpenses, paymentMethod?)` 新增可選 `paymentMethod` 參數。函式計算行動支付有效加碼 = 所有 `prerequisiteMet !== false` 的 tier rate 加總，再各別套用月上限。

**月上限計算：** 每個 tier 的月上限獨立追蹤。需從 `tripExpenses` 的 `paymentMethodReward` 欄位累計（Expense 型別新增此欄位）。

### Expense 新增 paymentMethod 與 paymentMethodReward 欄位

**決策：** 
```typescript
interface Expense {
  // ... 現有欄位
  paymentMethod?: 'apple_pay' | 'google_pay' | 'physical'; // null/undefined = 舊資料，視為 physical
  paymentMethodReward?: number; // NT$，行動支付加碼的那部分回饋（用於月上限追蹤）
}
```

**向下相容：** 讀取舊 Expense 時，`paymentMethod` 為 `undefined` 即視為 `'physical'`，不需 migration。

## Risks / Trade-offs

- **月上限追蹤複雜度增加** → 每個 tier 的月上限需從歷史消費的 `paymentMethodReward` 反推，`calcCardAdvice` 函式會變複雜。緩解：寫獨立的 `calcPaymentMethodBonus(card, paymentMethod, tripExpenses)` helper 函式，讓主函式保持清晰。
- **使用者忘記更新前置條件** → 條件宣告是靜態的（如前月帳單），使用者換月不一定會更新。緩解：CardForm 在 prerequisite 旁顯示提醒文字（「每月初請確認條件是否仍符合」）。
- **Card 資料結構變更需 storage 向下相容** → 舊資料沒有 `paymentMethodBonus` 欄位。緩解：所有存取都用 `card.paymentMethodBonus ?? undefined`，不需強制 migration。
