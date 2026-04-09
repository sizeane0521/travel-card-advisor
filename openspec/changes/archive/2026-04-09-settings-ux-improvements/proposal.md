## Why

設定頁的區塊順序違反使用者的操作心流（API Key 在最底部，但它是使用所有功能的前提），且卡片列表以純文字呈現，缺乏視覺辨識度。CardForm 在編輯多個 section 時沒有視覺提示告知使用者目前在操作哪個區塊。

## What Changes

- **設定頁區塊順序調整**：將「自動匯入設定（API Key）」移至頁面最上方，「信用卡列表」居中，「跨裝置同步」移至最下方
- **卡片列表改為 CSS 漸層卡面**：設定頁的每張卡片改為視覺信用卡卡面（h-40），包含根據卡片名稱 hash 產生的漸層背景、左下角卡片名稱、右上角基礎回饋率、右下角活動截止日（若有）；編輯/刪除/銀行連結移至卡面下方操作列
- **CardForm section focus 高亮**：CardForm 各 section panel（基本資訊、新戶加碼、特定店家加碼、行動支付加碼）在其內部任何 input 取得 focus 時，panel 外框由深棕 `#4a3418` 變為金色 `#c8901a`，並加上淡光暈 `box-shadow: 0 0 0 2px rgba(200,144,26,0.15)`

## Non-Goals

- 不從銀行官網抓取真實信用卡圖片（已討論並排除，hotlink 風險及複雜度過高）
- 不修改卡片資料模型或儲存邏輯
- 不變更 CardForm 的表單欄位或驗證邏輯

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-settings`：設定頁區塊順序、卡片列表視覺呈現、CardForm section focus 樣式

## Impact

- Affected specs: `card-settings`
- Affected code: `src/pages/SettingsPage.tsx`、`src/components/CardForm.tsx`
