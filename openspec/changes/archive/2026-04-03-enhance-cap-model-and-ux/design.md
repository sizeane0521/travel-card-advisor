## Context

目前系統的 `MonthlyCap` 使用 discriminated union（`type: 'reward' | 'spend'`），只能同時描述兩種上限之一。但台灣信用卡的海外回饋結構常見複合型態，例如：

> 海外消費 3%，指定通路加碼至 5%（消費上限 NT$30,000/月），每月回饋上限 NT$1,500

這表示同一張卡上，`spendLimit`（消費金額上限）和 `rewardLimit`（回饋金上限）可以同時存在，現有模型無法表達，導致 AI 擷取時只能選一種，另一個上限被丟棄。

此外，AdvisorPage 目前以「回饋率 %」作為最顯眼的數字，但使用者在海外刷卡時真正需要的判斷依據是「這張卡本月還剩多少回饋空間？」。

## Goals / Non-Goals

**Goals:**

- `MonthlyCap` 型別支援 `rewardLimit` 和 `spendLimit` 同時存在（兩者均為 optional）
- AI 提示詞更新，引導模型分辨並輸出兩種上限
- `calcCardAdvice()` 更新，正確處理複合上限邏輯
- localStorage 舊資料自動遷移（不破壞現有使用者的卡片設定）
- AdvisorPage 將「剩餘額度」提升為最顯眼的視覺元素，回饋率改為次要顯示
- CardForm 上限輸入欄改為兩個獨立欄位（各自 optional）

**Non-Goals:**

- 不支援國內消費回饋計算
- 不新增 storeBonus 的複合上限（StoreBonus.cap 保持不變）
- 不改變排序演算法邏輯（仍以 effectiveRate 排序）

## Decisions

### Decision 1: MonthlyCap 型別改為雙欄位可選結構

**選擇：** 將 `MonthlyCap` 由 discriminated union 改為：

```typescript
interface MonthlyCap {
  rewardLimit?: number;  // 每月最多獲得的回饋金（NT$）
  spendLimit?: number;   // 每月加碼消費上限（NT$），超過後改以 baseRate 計算
}
```

**理由：** 兩個 optional 欄位比 discriminated union 更直觀地對應銀行條款；兩者都不填視為無上限（不限制）；不引入額外的 type 字串。

**備選方案：** 保留 discriminated union 並加入 `'both'` 型別 → 更複雜且不易擴展，捨棄。

### Decision 2: 計算邏輯更新（calcCardAdvice）

當 `rewardLimit` 和 `spendLimit` 同時存在時，兩個條件分別獨立檢查：

1. **spendLimit 檢查**：當月消費 ≥ spendLimit → applicableRate 降回 baseRate
2. **rewardLimit 檢查**：當月已得回饋 ≥ rewardLimit → isFull = true，effectiveRate = 0
3. 兩個上限都觸發時，`isFull = true` 優先

`remainingAmount` 的計算：
- 只有 rewardLimit：剩餘 = rewardLimit - monthlyReward
- 只有 spendLimit：剩餘 = spendLimit - monthlySpend（消費空間）
- 兩者都有：取兩個剩餘中「更限制的那個」換算成回饋金

### Decision 3: localStorage 資料遷移

在 `storage.ts` 的 `loadData()` 中加入遷移函式，啟動時一次性執行：

```
old: { type: 'reward', amount: N } → new: { rewardLimit: N }
old: { type: 'spend',  amount: N } → new: { spendLimit: N }
```

遷移後立即寫回 localStorage，確保下次啟動不需重複遷移。

### Decision 4: AdvisorPage 視覺層級調整

**現況：** 回饋率（2xl 粗體）在右側最顯眼；剩餘額度是小字說明。

**調整：**
- 剩餘額度金額（NT$XXX）改為 `text-xl font-bold`，作為右側主要數字
- 回饋率改為剩餘額度下方的次要標籤（`text-sm text-gray-500`）
- 已滿（isFull）的卡片保持 `text-red-500 本月已滿` 不變

排序邏輯不改變（仍以 effectiveRate 降序，isFull 排最後）。

### Decision 5: CardForm 上限輸入欄重構

移除「上限類型」toggle，改為兩個獨立的 optional 輸入欄：
- **回饋金上限（選填）**：對應 `rewardLimit`
- **消費金額上限（選填）**：對應 `spendLimit`

兩欄均空白 = 無上限，符合部分卡片沒有上限的情境。

### Decision 6: AI 提示詞輸出格式

將 `capType` / `capValue` 兩個欄位改為：

```json
{
  "cardName": "...",
  "baseRate": 3.0,
  "rewardCap": 1500,
  "spendCap": 50000,
  "storeRules": [...]
}
```

`rewardCap` 和 `spendCap` 均為可選（找不到填 null）。`CardImportResult` 型別同步更新，`applyImportResult()` 對應更新。

## Risks / Trade-offs

- **遷移風險**：若使用者有非預期的 localStorage 格式，遷移可能靜默失敗。
  緩解：遷移函式加入 `try/catch`，失敗時保留原始資料，不觸發清除。

- **AI 解析率**：銀行頁面的上限描述文字多樣，AI 可能仍將兩種上限混淆。
  緩解：提示詞加入明確範例，說明兩種上限的區別及同時存在的情況。

- **無上限卡片**：若 `MonthlyCap` 兩個欄位都是 undefined，`calcCardAdvice` 必須正確處理（不進行任何上限檢查，直接套用 effectiveRate）。
