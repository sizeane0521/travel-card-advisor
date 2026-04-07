## 1. 移除推薦頁面

- [x] 1.1 更新 `src/App.tsx`（Store selection for recommendation / Card recommendation ranking）：移除 `import AdvisorPage` 語句、從 `TABS` 陣列移除 `{ id: 'advisor', ... }` 項目、移除 `{tab === 'advisor' && <AdvisorPage />}` 條件渲染、將 `useState<Tab>('advisor')` 預設值改為 `'expense'`、移除 `Tab` 型別中的 `'advisor'`
- [x] 1.2 刪除 `src/pages/AdvisorPage.tsx`（Cap progress visualization / Remaining cap display / Recommendation based on active trip month）：整個檔案移除，包含 `CapBars` 元件與 `capColor` 函數
