# 設計決定：回饋邏輯與上限提示優化

## 1. 加碼回饋疊加邏輯釐清

### 問題描述
目前 `src/lib/rewardCalc.ts` 中的 `calcCardAdvice` 函數在處理商店特定加碼（例如唐吉軻德加碼）時，會將商店加碼回饋率直接賦值給 `applicableRate`，從而**取代**了卡片的基本回饋率。
這導致計算結果不正確（例如：基本 2.5% + 商店加碼 3% 應該是 5.5%，但目前只顯示 3%）。

### 設計決定
回饋計算邏輯將統一改為**累加模式**。所有符合條件的加碼（商店加碼、行動支付加碼等）都必須疊加在卡片的基本回饋率之上。

**計算公式：**
`最終有效回饋率 = 基本回饋率 + 商店加碼回饋率 (若符合) + 行動支付加碼回饋率 (若符合)`

### 預期修改邏輯 (參考用)
在 `src/lib/rewardCalc.ts` 的 `calcCardAdvice` 函數中：
- 將原本的賦值 `applicableRate = bonus.rate;` 修改為加法賦值 `applicableRate += bonus.rate;`。

---

## 2. 消費上限視覺化提示 (血條設計)

### 問題描述
使用者反映在選擇信用卡消費或建議 (Advisor) 時，應該提供視覺化的進度條（血條），讓使用者直觀了解各項「加碼回饋」或「每月上限」的剩餘進度。目前系統僅提供文字提示，缺乏視覺化數據。

### 設計決定
擴充回饋計算引擎的資料結構，提供結構化的進度數據供前端 UI 渲染「血條」。

### 資料結構定義 (預期修改)

1.  **新增 `CapProgress` 介面**：
    ```typescript
    export interface CapProgress {
      type: 'reward' | 'spend' | 'store_bonus' | 'payment_method';
      label: string;       // 顯示名稱，例如：「商店加碼」或「月回饋上限」
      current: number;     // 已使用金額 (回饋或消費額)
      total: number;       // 總額度 (上限值)
      percentage: number;  // (已用/總額) * 100，用於前端 CSS 寬度
    }
    ```

2.  **修改 `CardAdvice` 回傳結構**：
    ```typescript
    export interface CardAdvice {
      // ... 原有欄位
      caps: CapProgress[]; // 一張卡可能同時有多個相關的進度條數據
    }
    ```

### 計算邏輯擴充
在 `src/lib/rewardCalc.ts` 的 `calcCardAdvice` 函數中，應針對以下項目生成 `CapProgress` 數據：
- **商店特定加碼 (Store Bonus)**：若當前選擇的商店有設定加碼且有上限 (cap > 0)，計算該加碼的已用進度。
- **行動支付加碼 (Payment Method Bonus)**：若使用了行動支付且該支付方式有設定加碼階層 (tiers)，計算各階層的已用進度。
- **卡片每月總上限 (Monthly Cap)**：
    - 若有設定回饋金額上限 (rewardLimit)。
    - 若有設定消費額度上限 (spendLimit)。

### UI 呈現與互動建議
*   **顯示位置**：在 Advisor 頁面選擇信用卡時，在卡片旁邊或下方即時顯示血條。
*   **顏色警告**：根據 `percentage` 數值顯示不同顏色（例如：< 70% 綠色、70-90% 橘色、> 90% 紅色）。
*   **優先級**：若有多個進度條，優先顯示進度最接近 100% 的項目，提醒使用者該項加碼即將爆表。
