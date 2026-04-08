## Context

目前 `cardImport.ts` 的 AI prompt 要求輸出 `storeRules[]`，每個 rule 包含 `stores: string[]`（所有店家壓平成一個列表）。銀行頁面上通常將同一加碼條件下的店家以視覺區塊分組（如「便利商店」、「樂園」、「百貨」），這些分組資訊目前被忽略。

`StoreBonus.subCategories` 型別已在 `src/types/index.ts` 定義，`CardForm` 的「+分類」UI 也已存在，但目前兩者都只能靠手動輸入填入。

## Goals / Non-Goals

**Goals:**
- AI prompt 新增 `subCategories` 欄位，讓 AI 根據頁面視覺分組輸出子分類結構
- Response parser 解析新欄位並映射到 `CardImportResult`
- `applyImportResult()` 將 subCategories 帶入表單狀態

**Non-Goals:**
- 不修改 `subCategories` 的資料模型（型別已定義）
- 不修改 subCategories 在消費頁面的瀏覽 UI 行為
- 不修改店家名稱的 match 邏輯（仍基於 stores[] 字串）
- 不實作 subCategories 的自動標準化（子分類 label 沿用銀行用語）

## Decisions

### 在 storeRules 內新增 subCategories 欄位（而非獨立欄位）

`subCategories` 作為 `storeRules` 每個 entry 的可選欄位，而非頂層獨立欄位。

理由：subCategories 是某個 storeRule（加碼條件）的內部結構，兩者在銀行頁面上天然綁定——某個加碼百分比適用的店家，才需要被分組。若獨立成頂層欄位，需額外建立對應關係，增加複雜度。

schema 範例：
```json
{
  "storeRules": [
    {
      "categoryName": "日本熱門商店加碼",
      "stores": ["7-ELEVEN", "FamilyMart", "LAWSON", "東京迪士尼", "大阪環球影城"],
      "bonusRate": 3,
      "spendCap": 20000,
      "capPeriod": "period",
      "subCategories": [
        { "label": "便利商店", "stores": ["7-ELEVEN", "FamilyMart", "LAWSON"] },
        { "label": "樂園", "stores": ["東京迪士尼", "大阪環球影城"] }
      ]
    }
  ]
}
```

### subCategories 為可選欄位，向後相容

Prompt 指示 AI：若銀行頁面無明顯視覺子分組，則省略 `subCategories` 欄位（不輸出空陣列）。Parser 對 subCategories 缺失時不報錯，`applyImportResult()` 對應空值時保持空陣列。

理由：不是所有銀行頁面都有子分組，強制輸出空陣列會造成 response 雜訊，並引發 AI 幻覺風險。

### stores[] 與 subCategories 中的店家名稱允許重複

`storeRules.stores[]`（扁平列表）與 `subCategories[].stores[]` 可以包含相同的店家名稱。扁平列表用於 match 邏輯，subCategories 用於 UI 分組。

理由：match 邏輯依賴 `stores[]`，不動它可保持向後相容。UI 分組是附加資訊，不應影響計算邏輯。

### Prompt 新增範例展示 subCategories 結構

在現有 prompt 範例中新增一個含 `subCategories` 的 storeRule 示範，讓 AI 理解輸出格式。

理由：Claude / Gemini 對有範例的格式遵循率明顯更高，特別是嵌套結構。

## Risks / Trade-offs

- **AI 幻覺子分組**：AI 可能捏造頁面上不存在的子分組 label。→ 緩解：Prompt 明確指示「只根據頁面實際視覺分組輸出，若無則省略」；使用者仍可事後用 +分類 按鈕修正。
- **子分類店家與扁平列表不一致**：AI 可能在 subCategories 中漏掉某些店家。→ 可接受：扁平列表 stores[] 的正確性由現有 prompt 保障，subCategories 是增益資訊，缺失不影響計算。
