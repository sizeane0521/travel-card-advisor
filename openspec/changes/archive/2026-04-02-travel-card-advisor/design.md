## Context

這是一個全新的獨立 PWA 專案，無現有程式碼基礎。用戶使用 iPhone Safari，主要在旅途中以手機查詢刷卡建議與記帳，出發前以桌機設定各卡條件。兩個裝置各自有獨立的 localStorage，因此需要一次性的跨裝置資料匯入機制。

## Goals / Non-Goals

**Goals:**
- 打造可離線使用的 PWA，手機加入主畫面後體驗如同 App
- 實作桌機設定 → QR Code → 手機匯入的一次性同步流程
- 即時計算各卡的有效回饋率（考量剩餘上限）並排序推薦
- 追蹤各卡當月累計消費，自動提示何時應換卡
- 保留多次旅程的歷史消費記錄

**Non-Goals:**
- 不做後端或雲端同步（每次旅程只需一次手機匯入）
- 不自動爬取銀行活動頁面（用戶手動輸入，每年更新 1-2 次）
- 不做多用戶或帳號系統
- 不做貨幣換算（以刷卡 NT$ 金額為主）
- 不做 Android 推送通知

## Decisions

### 前端框架選擇：React + Vite

選用 React + Vite 而非 Vue 或純 Vanilla JS。

**理由**：React 生態系完整，Vite 建構速度快，搭配 TypeScript 可確保資料結構安全性。此專案的狀態管理需求（4 個模組各自有狀態但相互依賴）適合 React 的 Context + useReducer 模式。

**替代方案**：Vue 3 同樣可行但團隊熟悉度考量；Vanilla JS 維護成本高於框架帶來的收益。

### 資料層：localStorage + JSON 扁平結構

所有資料序列化為 JSON 存入單一 localStorage key（`travel-card-advisor-data`）。

**理由**：無後端、無帳號的設計前提下，localStorage 是唯一合理選擇。扁平結構（cards array + trips array）易於序列化，也方便 QR Code 編碼傳輸卡片設定。

**資料結構**：
```json
{
  "cards": [
    {
      "id": "cube",
      "name": "國泰 Cube",
      "bankUrl": "https://...",
      "baseRate": 3.0,
      "monthlyCap": { "type": "reward", "amount": 3000 },
      "storeBonus": [
        { "storeName": "唐吉軻德", "rate": 5.0, "cap": 1000 }
      ]
    }
  ],
  "trips": [
    {
      "id": "2026-06-japan",
      "name": "2026 六月 日本",
      "startDate": "2026-06-01",
      "endDate": null,
      "expenses": [
        { "id": "exp-1", "amount": 1200, "cardId": "cube", "store": "唐吉軻德", "date": "2026-06-03" }
      ]
    }
  ]
}
```

### 跨裝置同步：QR Code 編碼卡片設定

桌機設定完成後，將 `cards` array 序列化為 JSON → Base64 → QR Code。手機掃碼後解碼並 merge 進本地資料，消費記錄不受影響。

**理由**：卡片設定資料量小（4 張卡 + 少量店家規則），Base64 編碼後約 400-800 字元，在 QR Code 容量範圍內。無需伺服器，無需帳號。

**替代方案**：分享連結（URL 參數）— 但長度限制和 URL 可被看到的隱私問題。選擇 QR Code 更直覺。

### 回饋計算邏輯

有效回饋率的計算需考量兩種上限類型：
1. **回饋金上限**（monthlyCap.type = "reward"）：當月累計回饋金 ≥ 上限時，該卡標記為「本月已滿」
2. **消費金額上限**（monthlyCap.type = "spend"）：當月累計消費 ≥ 上限時，超出部分以基本回饋率計算

特定店家的 `cap` 為該店家的消費金額上限（而非回饋金上限）。

計算公式：`有效回饋率 = min(適用率, 剩餘可用回饋金 / 消費金額)`

### PWA 離線支援：Service Worker + Cache API

使用 Vite PWA plugin（`vite-plugin-pwa`）自動生成 Service Worker，快取所有靜態資源。

**理由**：旅途中可能沒有網路（地下街、偏遠地區），PWA 離線能力是必要條件。

## Risks / Trade-offs

- **localStorage 清除風險** → 提示用戶避免使用無痕模式，並在設定頁提供「重新生成 QR Code」功能讓用戶隨時可重新匯入卡片設定到新手機
- **QR Code 容量** → 若用戶設定超過 10 張卡 + 大量店家規則，QR Code 可能過大。緩解：目前設計只有 4 張卡，若未來擴充可切換為分享連結
- **每月上限重置邏輯** → 以消費日期的月份判斷是否在同一計算周期，而非旅程開始日。若信用卡帳單截止日不是月底，計算可能略有誤差（可接受，因為是估算工具）
- **iPhone Safari PWA 限制** → iOS 的 PWA 不支援推送通知，localStorage 在「加入主畫面」後為獨立 context，與 Safari 瀏覽器的 localStorage 不共用。需要在引導流程中提示用戶「請在 Safari 中先設定，再加入主畫面」

## Open Questions

- 每月上限的計算起點：自然月（1日-月底）或帳單週期？建議先以自然月實作，未來可讓用戶自訂帳單截止日
