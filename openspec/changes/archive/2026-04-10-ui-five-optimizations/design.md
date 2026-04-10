## Context

試算頁（CalcPage）與明細頁（LedgerPage）存在五個 UI 可用性問題，均為邏輯或文字層面的小範圍調整，不涉及新資料結構或跨服務變更。設定頁（SettingsPage）的 API Key 面板在儲存後不收起，佔用畫面。試算頁的加碼條件 toggle 未讀取卡片設定的 `prerequisiteMet` 值，導致已被使用者禁用的條件仍顯示。明細頁的 label 生成邏輯未考慮 storeName 本身可能含「加碼」，以及 prerequisite 文字過長問題。

## Goals / Non-Goals

**Goals:**

- API Key 儲存後面板自動收起，保留「修改」入口
- 試算頁 toggle 尊重卡片設定的 `prerequisiteMet === false`
- 按鈕文字「+記帳」→「+明細」
- 明細頁 storeName label 不重複「加碼」
- 明細頁行動支付加碼 label 固定為「行動支付加碼」（多 tier 加序號）

**Non-Goals:**

- 不更動回饋率計算邏輯
- 不修改卡片資料 schema
- 不處理 `prerequisiteMet === undefined` 的顯示邏輯（維持現狀：顯示 toggle 讓使用者自行決定）

## Decisions

### API Key 面板摺疊狀態管理

在 `SettingsPage` 新增 `apiPanelOpen: boolean` state，初始值為 `false`。

**摺疊條件（`apiKey` 已設定 且 `!apiPanelOpen`）**：顯示一行摘要 `{provider} · ●●●●{last4} [修改]`。
**展開條件（`!apiKey` 或 `apiPanelOpen`）**：顯示完整表單。
按下「設定」成功後呼叫 `setApiPanelOpen(false)`。點「清除」後同樣 `setApiPanelOpen(false)` 以確保回到收合摘要。

替代方案：直接用 `apiKey` 是否存在控制顯示（不加 state）。否決原因：使用者設定後若想再次查看或修改 provider，需要入口；純靠 `apiKey` 控制無法保留「展開中」狀態。

### 加碼條件 toggle 篩選邏輯

在 `CalcPage` 的兩個 prerequisite 區塊（paymentMethodBonus tiers、storeBonus）中，`map` 內新增：

```
if (tier.prerequisiteMet === false) return null
```

並對應修改外層 `some()` 判斷，使其同樣排除 `prerequisiteMet === false` 的 tier，避免渲染空的 wrapper `<div>`。

替代方案：在 `getSortedRecommendations` 計算時就過濾掉禁用 tier。否決原因：計算層應維持資料完整性，顯示層負責篩選為更清楚的職責分離。

### 明細頁 storeName label 去重

將 `label: \`${b.storeName}加碼\`` 改為 `label: b.storeName`。

理由：storeName 在卡片資料中本身就是描述性名稱（如「日本熱門商店加碼」），不需要再加後綴。若 storeName 不含「加碼」的情況，去掉後綴仍語義清晰。

### 明細頁行動支付加碼 label 策略

在迴圈外預先計算 `activePmTierCount`（`monthlyCap > 0` 且 prerequisite 已滿足的 tier 數量），迴圈內用 `pmSeq` 序號追蹤，產生：

- `activePmTierCount === 1`：`'行動支付加碼'`
- `activePmTierCount > 1`：`'行動支付加碼 #${pmSeq}'`

## Risks / Trade-offs

- **storeName label 去重**：若未來卡片資料中有 storeName 不含「加碼」的情況，label 可讀性仍正確（如「日本實體商店」也是可理解的 label）。風險低。
- **API Key 摺疊 state**：切換 provider 時呼叫 `setApiKey('')` 會讓面板維持當前 `apiPanelOpen` 狀態。由於切換 provider 通常代表使用者想繼續操作，不需要特別重設，行為合理。
