## 1. 店家區塊獨立

- [x] 1.1 在 `src/pages/CalcPage.tsx` 中，找到金額/匯率/日期的 `.beast-card` 容器，在「店家」section 開始之前（`{/* store search + chips */}` 的 `<div>` 之前）關閉該容器，並為「店家」section 開啟一個新的獨立 `.beast-card` 容器（`rounded-xl p-4 mb-4`，背景與邊框樣式與其他卡片一致）；店家 section 結尾關閉此新容器後，「付款方式」section 維持在原有容器中（或各自獨立，視目前結構決定）

## 2. 搜尋時隱藏「一般消費」按鈕

- [x] 2.1 在 `src/pages/CalcPage.tsx` 中，找到「一般消費」按鈕（`CalcPage.tsx` 約 370-379 行），在其外層加上條件 `{storeQuery.length === 0 && (...)}` 使其只在搜尋框為空時顯示；搜尋框有文字時隱藏，使用者可透過 `×` 清除鍵回到一般消費狀態

## 3. 無金額時整張卡片不可互動（Reward total display takes visual priority over breakdown details）

- [x] 3.1 實作「Reward total display takes visual priority over breakdown details」的互動防護：在 `src/pages/CalcPage.tsx` 中，找到卡片列表的每個卡片容器 `div`（`onClick={() => !advice.isFull && setSelectedCardId(...)}` 所在位置），將 `onClick` 條件改為 `() => !advice.isFull && validAmount && setSelectedCardId(...)`，並在 `style` 中加入：當 `!validAmount && !advice.isFull` 時套用 `opacity: 0.4, cursor: 'default'`（注意 `isFull` 已有自己的 `opacity: 0.45`，兩者獨立處理）
- [x] 3.2 在同一檔案，找到 `+刷卡` 按鈕的 `disabled` 屬性，改為 `disabled={advice.isFull || !validAmount}`，並確保 disabled 樣式在 `!validAmount` 時也顯示為灰色（可沿用 `isFull` 的 disabled 樣式）

## 4. 回饋率明細文字改為「行動支付」

- [x] 4.1 在 `src/pages/CalcPage.tsx` 的 rate breakdown row 中，找到 `advice.paymentMethodBadge === 'apple_pay' ? 'AP' : 'GP'` 這段 ternary，直接改為固定字串 `'行動支付'`，使無論選擇 Apple Pay 或 Google Pay 都顯示 `行動支付X%`

## 5. 驗證

- [x] 5.1 啟動 dev server，確認試算頁「店家」區塊視覺上與上方金額/匯率/日期為獨立分隔的 `.beast-card`
- [x] 5.2 在搜尋框輸入文字，確認「一般消費」按鈕消失；清除搜尋框後確認按鈕重新出現
- [x] 5.3 未輸入金額時，確認點擊卡片無反應、`+刷卡` 按鈕呈 disabled 且卡片透明度降低；輸入金額後確認卡片可正常選取與點擊
- [x] 5.4 選擇 Apple Pay 或 Google Pay 時，確認回饋率明細第二行顯示 `行動支付X%` 而非 `APX%` 或 `GPX%`
