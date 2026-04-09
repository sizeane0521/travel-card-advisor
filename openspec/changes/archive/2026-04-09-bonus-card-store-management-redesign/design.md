## Context

目前 `CardForm.tsx` 的 `renderBonusList()` 函式在每個 StoreBonus card panel header 放置 `+店家`、`+分類`、`刪除` 三顆按鈕（約 150px），壓縮了左側內容區（手機上剩餘約 150px），導致 rate/cap inline 編輯行換行。subCategories 群組標題在 collapsed 狀態完全不顯示，使用者無法感知分類結構。

## Goals / Non-Goals

**Goals:**
- Bonus card header 只留 `+分類` 和 `刪除`，釋放水平空間
- Rate/cap inline 編輯行在 375px 螢幕上不換行
- Collapsed 狀態顯示分類群組（label + chips）
- 每個群組有獨立 `[編輯]` 按鈕，點後 inline 展開店家管理
- `+分類` 點後在清單底部展開 inline 新增表單

**Non-Goals:**
- 不改資料模型（`StoreBonus.stores[]` 與 `subCategories[]` 維持現有結構）
- 不改 CalcPage / LedgerPage 的加碼顯示邏輯
- 不改 rewardCalc.ts 的計算邏輯

## Decisions

### 移除 `+店家`：flat stores 改由預設群組管理

**決定**：沒有 subCategories 的 StoreBonus，顯示為一個「適用店家」預設群組，其 `[編輯]` 展開後管理的是 `b.stores[]`。有 subCategories 的 StoreBonus，每個 subCategory 各自有 `[編輯]`，管理 `sub.stores[]`。

**理由**：讓「店家永遠屬於一個群組」的語意一致，移除 flat/subCat 兩套 UI 路徑。

**替代方案**：保留 `+店家` 管理 flat stores，subCategories 另外管理 → 兩套 UI 讓使用者困惑（已排除）。

### Rate/Cap Row：固定寬度，不使用 flex-wrap

**決定**：rate/cap 那一行改為 `flex items-center gap-1`（不加 `flex-wrap`），rate input 寬度 44px，cap input 寬度 68px，縮短中間標籤為 `%  NT$`（兩個短標籤各自緊貼 input）。period badge 縮為 `每月` / `期間` 2 字。

在 375px 螢幕：
```
header 簡化後 content 區可用寬 ≈ 180px
44 + 12("% ") + 8("·") + 68 + 12("NT$") + 30(badge) = 174px ✓
```

**替代方案**：把 rate/cap 改成兩行 grid → card 更高，不採用。

### Per-group 編輯狀態：inline 展開，不用 modal

**決定**：展開狀態用 `expandedGroupKey: string | null` state 追蹤（key = `${bonusIdx}-${subIdx}` 或 `${bonusIdx}-default`），同一時間只能展開一個 group。展開時顯示：
- 分類名稱 input（預設群組不可改名）
- 「[輸入店家名稱] [加入]」row
- 現有 store chips（各有 × 刪除）
- 「刪除此分類」按鈕（預設群組不顯示）

**理由**：與現有 card-based UI 一致，不需要額外 overlay 層。

### `+分類` 行為：展開 inline 新分類表單

**決定**：點 `+分類` 時，set `addingSubCatForBonusIdx: number | null` = 該 bonus index，在群組列表底部 append 一個展開的 inline 表單（分類名稱 input + 店家新增），輸入完點「新增分類」後 create 並 collapse。

**替代方案**：直接 push 一個空 subCategory 進 state，讓使用者在 edit 模式下填名稱 → 可行，但會在 collapsed view 多出一個空群組，視覺上不乾淨（排除）。

## Risks / Trade-offs

- **flat stores 語意變更**：`b.stores[]` 目前同時做「matching」和「顯示」，新設計中 flat stores 在 display 層被包進「適用店家」預設群組，但 matching 邏輯不變。確保 `renderBonusList()` 不影響 `stores[]` 的資料本身。
- **expandedGroupKey 跨 bonus index**：新增/刪除 bonus 後 index 位移可能導致 wrong group 展開 → 用 `${bonusIdx}-${subIdx}` composite key，在 removeBonus / removeSubCategory 時 reset expandedGroupKey。
