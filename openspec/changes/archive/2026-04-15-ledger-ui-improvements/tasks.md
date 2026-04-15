## 1. Card filter tabs in ledger page — 擴展連動加碼血條

- [x] 1.1 實作 Card filter tabs in ledger page 的血條連動：在 `LedgerPage.tsx` 的加碼血條生成邏輯（第 113 行 `for (const card of data.cards)`）加入 `filterCardId` 過濾：當 `filterCardId !== 'all'` 時，只對 `card.id === filterCardId` 的卡片生成 `BonusRow`；選取「全部」時保持原有行為不變
- [x] 1.2 確認篩選 tab 切換後加碼血條即時更新，且切回「全部」後所有卡片血條全部恢復顯示

## 2. Expense reward breakdown shown as pipe-separated small text

- [x] 2.1 實作 Expense reward breakdown shown as pipe-separated small text：將 `LedgerPage.tsx` 第 365–373 行的回饋顯示區塊拆解為：上方顯示回饋總金額（現行綠色 `text-xs`），多元件時在總金額下方加一條 1px 分隔線（`background: #3d2e14`），再用小字 `text-xs`、顏色 `#9a7040` 顯示 `基本 NT$X | 加碼 NT$Y` 格式，分隔符號為 ` | `
- [x] 2.2 驗證僅有基本回饋（無 store 也無 paymentMethod bonus）時，不顯示分隔線與拆解行（符合 "Base-only reward omits breakdown line" scenario）
- [x] 2.3 驗證同時有 store bonus 與 paymentMethod bonus 時，三個元件全部出現並以兩個 ` | ` 分隔（符合 "Three-component reward uses two separators" scenario）
