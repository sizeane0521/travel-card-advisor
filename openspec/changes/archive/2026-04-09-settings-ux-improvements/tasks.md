## 1. 設定頁區塊順序調整

- [x] 1.1 在 `src/pages/SettingsPage.tsx` 中調整 JSX 結構：將「自動匯入設定（API Key）」div 移至 `<div className="p-4 max-w-lg mx-auto">` 的第一個子元素，「信用卡列表」居中，「跨裝置同步」移至最後，實作「Settings page section order」需求

## 2. 信用卡卡面視覺化

- [x] 2.1 在 `src/pages/SettingsPage.tsx` 新增 `hashCardColor(name: string)` helper 函式：將卡片名稱轉為數字 hash，映射至預設的 6–8 組漸層色組合（例如深藍/靛、深紫/酒紅、深綠/墨綠等），回傳 CSS `linear-gradient` 字串，實作「Visual credit card face in settings list」的漸層背景需求
- [x] 2.2 將 `data.cards.map(card => ...)` 中的卡片 render 替換為視覺卡面結構（`h-40 rounded-xl relative overflow-hidden`）：漸層背景、右上角回饋率 badge（半透明）、左下角卡片名稱大字（`text-xl font-bold`，`text-shadow`）、右下角 `validTo` 日期（格式 `YYYY/MM/DD`，無 validTo 則不顯示）、左上角到期 badge（沿用現有 isExpired/isExpiringSoon 邏輯），實作「Visual credit card face in settings list」的卡面結構需求
- [x] 2.3 卡面下方加入操作列（flex row）：銀行連結（`bankUrl` 有值時顯示，`target="_blank"`）、「編輯」按鈕、「刪除」按鈕，保留現有的 `setEditingCard` 與 `handleDelete` 邏輯，實作「Action row below card face」場景

## 3. CardForm Section Focus 高亮

- [x] 3.1 在 `src/components/CardForm.tsx` 所有 section panel（基本資訊、新戶加碼、特定店家加碼、行動支付加碼）的外層 div 加上 CSS focus-within 樣式：使用 inline `style` 加入 `transition: 'border-color 0.15s, box-shadow 0.15s'`，並透過 React `onFocus`/`onBlur` state 或直接使用 Tailwind `focus-within:` variant 切換 border color 至 `#c8901a` 與 box-shadow `0 0 0 2px rgba(200,144,26,0.15)`，實作「CardForm section active focus state」需求
