## 1. Store bonus card layout 與 prerequisite bonus visual differentiation

- [x] 1.1 修改 `src/components/CardForm.tsx` Store bonus card layout in CardForm：將每個 StoreBonus 項目包裹在獨立的 `rounded-xl` 面板中（`background: '#141008', border: '1px solid #3d2e14'`, `p-3`），移除原本的 `borderBottom` 分隔線，改用 `space-y-2` 間距
- [x] 1.2 修改 `src/components/CardForm.tsx` Prerequisite bonus visual differentiation in CardForm：有 `prerequisite` 的 StoreBonus 卡片加上左邊框 accent（`borderLeft: '3px solid #f59e0b'`），並在 bonus 名稱旁顯示 prerequisite 文字徽章（使用 `text-[10px] px-1.5 py-0.5 rounded` 橘色標籤樣式）

## 2. Store bonus action buttons consistent styling

- [x] 2.1 修改 `src/components/CardForm.tsx` Store bonus action buttons consistent styling：將「＋店家」「＋分類」「刪除」三個按鈕改為 `rounded-lg border px-2 py-1 text-xs` 的 chip 風格；「＋店家」「＋分類」使用 `{ color: '#c8a060', borderColor: '#4a3418' }`，「刪除」使用 `{ color: '#c0392b', borderColor: '#5a1a1a' }`

## 3. StoreBonus sub-category management in CardForm UI 重構

- [x] 3.1 修改 `src/components/CardForm.tsx` StoreBonus sub-category management in CardForm：移除子分類展開區的外層巢狀容器（原 `background: '#0e0c06'` 的 div），改為在 bonus 卡片內直接平鋪子分類群組：每組以 `text-[10px] uppercase tracking-wider` 標籤開頭，下接店家 chips 和 inline 的新增店家輸入框
- [x] 3.2 修改 `src/components/CardForm.tsx`：將「新增分類」表單（label 輸入 + 按鈕）移到子分類列表底部，與子分類群組同層級，不再包裹在額外容器中

## 4. New bonus form visual separation

- [x] 4.1 修改 `src/components/CardForm.tsx` New bonus form visual separation：在現有 bonus 列表與新增表單之間加入分隔元素（如 `border-top: 1px dashed #3d2e14` 或 `mt-3 pt-3`），並為新增表單加上標題標籤「新增加碼」
- [x] 4.2 修改 `src/components/CardForm.tsx`：為「加碼 %」和「上限 NT$」的 `<input>` 加上 `min-w-0` class 防止 flex 子項溢出，縮短 placeholder 文字（「加碼%」「上限$」）

## 5. 驗證

- [x] 5.1 執行 `npm run build` 確認無編譯錯誤
- [x] 5.2 手動測試：確認每個 bonus 為獨立卡片、prerequisite bonus 有橘色 accent、按鈕為 chip 風格、子分類巢狀減少、新增表單分隔清楚、窄螢幕無破版
