## Context

CalcPage.tsx 是目前最複雜的頁面，所有改動集中在兩個區塊：店家輸入區的 chip 列，以及信用卡推薦列表的每張卡片。

## Goals / Non-Goals

**Goals:**

- 自訂店家輸入時，chip 列提供明確的「這個名稱將被記帳」確認
- 信用卡卡片一眼可見：卡名、回饋率、+刷卡按鈕
- 回饋金額（NT$XXX）為視覺焦點，費率細項為次要

**Non-Goals:**

- 不改動回饋計算邏輯
- 不影響 CalcPage 以外的頁面

## Decisions

### 自訂店家確認 chip

**決定**：在店家 chip 列中，當 `storeQuery` 非空且不符合任何 `filteredStores`（即搜尋結果為空）時，顯示一個動態 chip，內容為 `storeQuery` 的文字，樣式與已選中的加碼店家 chip 相同（金色背景）。

判斷條件：
```
storeQuery.length > 0 && filteredStores.length === 0 && storeQuery !== ''
```
（注意：`一般消費` chip 已在 `store === '' && storeQuery === ''` 時高亮，此條件互斥）

此 chip **不可點擊**（或點擊後清除輸入）——它只是顯示確認用，不是新的選項。

**替代方案**：在輸入框下方加文字提示 → 否決，視覺太弱、佔空間。

### 卡片橫向排版（適用所有卡片）

**完整結構**：

```
外層 flex-row 容器
├── 左側推薦色塊（僅最佳推薦，isFull=false 且 isTop=true）
│   └── 黃色背景，寬度固定 32px，高度 100%，「推薦」文字垂直
└── 右側主內容區（flex-col，flex-1）
    ├── 第一行 flex-row（items-center, gap-2）
    │   ├── 卡名（font-medium，flex-1）
    │   ├── 付款 badge（Apple Pay / Google Pay，僅 paymentMethod !== 'physical'）
    │   ├── 回饋率 text-lg font-bold #d4a017（如 isFull 則顯示 0%，#c0392b）
    │   └── +刷卡 按鈕（shrink-0）
    ├── 第二行 flex-row（items-end）
    │   ├── 費率細項（flex-1，text-xs #c8a060，基本X% + APX% + 店家X%）
    │   └── 回饋總額 NT$XXX（text-2xl font-bold #4ade80，僅 twdAmount>0 且 !isFull）
    ├── 分隔線（mt-2 mb-2，僅 breakdown 存在時）
    ├── 細項一行（text-xs #9a7040）
    │   └── 格式：「基本 1,250 | {店家}加碼 600 | 行動支付加碼 600」
    │   └── 只顯示 > 0 的項目，以 「 | 」 分隔
    ├── 加碼額度進度條（僅 isTop，同舊版）
    ├── 店家加碼上限警告（storeCapped 時）
    └── 操作警告（opWarning 時）
```

**回饋總額字級**：從 `text-lg` 升為 `text-2xl`，讓它在第二行絕對主導視覺。

**費率細項格式不變**：仍用 `%` 後綴（上一版已加）。

**細項行格式**：從逐行變為「同一行 | 分隔」，更省空間。

**替代方案**：繼續直向堆疊 → 否決，使用者需要逐行找重要數字。

### 左側「推薦」色塊的替換邏輯

**舊版**：`isTop && !advice.isFull` 時在卡片頂部顯示 `🌟 最佳推薦` chip。
**新版**：改為左側 32px 寬色塊，相同條件。其他卡片（isTop=false 或 isFull=true）左側無色塊，主內容直接靠左對齊（等效 padding-left 保持視覺一致）。

## Risks / Trade-offs

- [細項行長度] 「基本 1,250 | 日本熱門商店加碼 600 | 行動支付加碼 600」在小螢幕可能換行 → 可接受，仍比舊版多行更緊湊
- [回饋總額 text-2xl] 若無金額（twdAmount=0）時不顯示，不佔空間
