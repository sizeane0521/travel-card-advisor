## Why

目前的店家搜尋標籤混入了信用卡的促銷條件名稱（如「新戶加碼」），卡片推薦結果缺少回饋疊加明細、超額截斷的數學邏輯有誤（只有全有全無，無法按比例截斷），且缺乏操作防呆警告，導致使用者無法信任系統計算結果。

## What Changes

- **店家標籤**：`getAllStoreNames()` 改為只從 `StoreBonus.stores[]` 抓取真實實體店名，不再加入 `StoreBonus.storeName`（促銷活動標籤）
- **回饋明細顯示**：推薦卡片 UI 改為顯示回饋組成，例如「NT$152 = 基本 NT$52 + 永旺加碼 NT$100」
- **超額截斷計算**：`StoreBonus` 超過消費上限時，改為按剩餘額度部分計入，而非全有全無
- **超額截斷警告**：當消費將導致某項加碼截斷時，在卡片下方顯示 ⚠️ 警告
- **操作防呆警告**：`Card` 型別新增 `operationWarnings` 欄位，依付款方式顯示特定操作提示（例如 Apple Pay + 吉鶴卡的 QUICPay 警告）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-advisor`：修改回饋計算邏輯（超額截斷從二元改為比例截斷）、新增疊加明細回傳結構、新增 `operationWarnings` 型別欄位
- `expense-tracker`：修改店家標籤來源邏輯（只顯示 `stores[]` 的真實店名）

## Impact

- Affected code:
  - `src/types/index.ts`（新增 `operationWarnings` 欄位至 `Card` 型別）
  - `src/lib/rewardCalc.ts`（修正 `getAllStoreNames()`、修正 `calcCardAdvice()` 超額截斷邏輯、新增回饋明細回傳）
  - `src/pages/ExpensePage.tsx`（UI 顯示回饋疊加明細、超額警告、操作防呆警告）
