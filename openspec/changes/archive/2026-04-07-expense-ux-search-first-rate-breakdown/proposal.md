## Summary

改善記帳頁面的兩個 UX 問題：（1）店家選擇區預設顯示太多晶片、且 storeBonus 名稱也出現在其中造成混淆；（2）卡片只顯示合計回饋率，看不出各層加碼（基本 + 行動支付 + 店家）如何疊加。

## Motivation

使用者在記帳時無法直覺地判斷「這次刷幾%、分別從哪裡來」。具體問題：
1. 店家搜尋框預設展開所有晶片（包含「行動支付登錄加碼」等活動名稱），造成視覺混亂
2. 卡片僅顯示合計 7.0%，使用者無法確認是否如預期：基本 2.5 + Apple Pay 1.5 + 店家 3.0

## Proposed Solution

**店家區（搜尋優先）**：移除預設晶片展開邏輯。預設只顯示搜尋框 + 「一般消費」固定晶片，使用者輸入文字後才出現匹配的店家晶片。

**回饋率拆解顯示**：
- 在 `CardAdvice` 加入 `rateBreakdown: { base, paymentMethod, store }` 欄位
- 在 `calcCardAdvice` 中填入各分量（base = card.baseRate、paymentMethod = pmBonus.bonusRate、store = storeBonus rate 實際套用值）
- 記帳頁卡片的回饋率數字下方，加一行小字拆解：`基本2.5 + AP1.5 + 店家3.0`

## Non-Goals

- 不修改計算邏輯（`calcCardAdvice` 計算結果不變，只新增回傳資料）
- 不修改 `CapProgress` 血條邏輯（維持現有行為）
- 不改動設定頁、旅程頁

## Impact

- Affected specs: `expense-tracker`（店家搜尋 UX 改變）、`payment-method-bonus`（rateBreakdown 新增欄位）
- Affected code:
  - `src/lib/rewardCalc.ts`（新增 `rateBreakdown` 欄位至 `CardAdvice`）
  - `src/pages/ExpensePage.tsx`（店家區重構、卡片拆解顯示）
