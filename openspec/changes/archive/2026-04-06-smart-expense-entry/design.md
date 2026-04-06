## Context

目前 `ExpensePage.tsx` 的表單流程：先選信用卡（`<select>`）→ 輸入金額 → 選店家 → 送出。這個流程強迫使用者在不知道哪張卡最好之前就選卡，違反實際使用情境（人在店門口，只知道要花多少錢、在哪家店）。

`AdvisorPage.tsx` 已有完整的卡片排序邏輯（`getSortedRecommendations`），但與記帳頁完全分離。使用者需要「先去推薦頁查」→「記住最好的卡」→「再去記帳頁選卡」，流程破碎。

## Goals / Non-Goals

**Goals:**
- 記帳表單改為「輸入金額 + 選店家」驅動即時推薦
- 最優卡自動選中，使用者可手動切換其他卡
- 有旅程匯率時，金額輸入框下方即時顯示換算台幣
- 店家選單改為 chip 形式（有加碼的優先）+ 可展開更多
- 頁面顯示本次旅程消費筆數摘要
- 最優推薦卡顯示上限剩餘視覺進度條

**Non-Goals:**
- 不修改 `rewardCalc.ts` 的計算邏輯
- 不修改 `AdvisorPage.tsx`（推薦頁保持獨立）
- 不新增後端或 API 呼叫
- 不加入即時匯率 API（匯率固定於旅程設定）

## Decisions

### 即時卡片推薦清單取代下拉選單

**決定**：移除 `<select>` 卡片選單，改用卡片清單（可點選），直接呼叫現有 `getSortedRecommendations(cards, storeName, tripExpenses)`。

**理由**：`getSortedRecommendations` 已處理排序與上限邏輯，直接重用即可，不需新增計算邏輯。

**替代方案**：保留下拉，在下方加一個提示「建議用 XX 卡」→ 被捨棄，因為使用者仍要手動選，UX 沒有根本改善。

### 自動選中最優卡，狀態為 selectedCardId

**決定**：用 `useState<string>` 的 `selectedCardId` 取代原本的 `cardId` state。每當 `storeName` 或 `amount` 改變，重新計算推薦清單，若 `selectedCardId` 對應的卡變成 `isFull`，自動切換到下一張最優卡。

**理由**：讓「最優卡」永遠是預設，使用者只需確認，不需主動選擇。

### 店家 chip 展開邏輯

**決定**：有加碼的店家（`getAllStoreNames(cards)` 回傳值）顯示為 chip，最多顯示 5 個，剩餘用「更多 ▼」按鈕展開。點選一般消費時清空 store 選擇。

**理由**：旅遊場景中常用店家固定（便利商店、唐吉訶德等），chip 比 dropdown 快。超過 5 個才折疊，避免佔版面。

### JPY 即時換算顯示

**決定**：當 `activeTrip.exchangeRate` 存在且使用者輸入的金額 > 0 時，在輸入框正下方顯示 `≈ NT$XXX`（`Math.floor(amount * rate)`），純顯示，不影響送出邏輯。

**理由**：使用者在日本消費時，看到日幣金額需要立刻知道對應台幣，避免消費超預算。

### 進度條顯示

**決定**：推薦清單中 `isFull === false` 且有 `remainingAmount > 0` 的卡才顯示進度條。進度條寬度 = `(cap - remaining) / cap * 100%`。若無上限（`rewardLimit` 和 `spendLimit` 都是 undefined），不顯示進度條。

**理由**：只有最優卡（第一張）顯示完整進度條，其他卡只顯示文字，避免視覺過於雜亂。

## Risks / Trade-offs

- **cap 計算來源**：進度條需要知道 cap 的最大值（`rewardLimit` 或 `spendLimit`），`calcCardAdvice` 已回傳 `remainingAmount` 但沒有回傳總 cap。需從 `card.monthlyCap` 直接讀取總上限值計算百分比。→ 直接讀 `advice.card.monthlyCap.rewardLimit ?? advice.card.monthlyCap.spendLimit` 即可，不需改 `rewardCalc.ts`。
- **店家 chips 數量**：若使用者設定超過 10 個加碼店家，「更多」區塊很長。→ 展開後以 `flex-wrap` 呈現，不影響功能。
- **selectedCardId 與推薦清單 desync**：若卡片被刪除或達到上限，selectedCardId 對應的卡可能消失。→ 每次 render 時驗證 selectedCardId 仍在推薦清單中，否則自動切換到第一張非滿的卡。
