## 1. SettingsPage — AI provider selection 面板收起（api key 面板摺疊狀態管理）

- [x] 1.1 在 `src/pages/SettingsPage.tsx` 的 `SettingsPage` 函式中新增 `apiPanelOpen` state（初始值 `false`），實作 api key 面板摺疊狀態管理
- [x] 1.2 將 AI import settings 區塊 header 改為：當 `apiKey && !apiPanelOpen` 時顯示摘要列（provider 名稱 + 遮罩 key + "修改" 按鈕），否則顯示 "收起" 按鈕
- [x] 1.3 將完整表單（provider 選擇、說明文字、key 輸入/顯示）包在 `(!apiKey || apiPanelOpen)` 條件渲染中
- [x] 1.4 在 `handleSaveKey` 成功儲存後呼叫 `setApiPanelOpen(false)`
- [x] 1.5 "清除" onClick 改為同時呼叫 `setApiKey('')` 和 `setApiPanelOpen(false)`
- [x] 1.6 驗證 AI provider selection：輸入 key → 按"設定" → 面板收起；點"修改" → 展開；點"清除" → 收起

## 2. CalcPage — StoreBonus prerequisite mechanism 與 payment-method-bonus tier 過濾（加碼條件 toggle 篩選邏輯）

- [x] 2.1 在 `src/pages/CalcPage.tsx` paymentMethodBonus tiers map 內（`if (!tier.prerequisite) return null` 後）新增 `if (tier.prerequisiteMet === false) return null`，實作加碼條件 toggle 篩選邏輯
- [x] 2.2 將外層 `tiers.some(t => t.prerequisite)` 改為 `tiers.some(t => t.prerequisite && t.prerequisiteMet !== false)`
- [x] 2.3 在 storeBonus map 內（`if (!b.prerequisite) return null` 後）新增 `if (b.prerequisiteMet === false) return null`，符合 StoreBonus prerequisite mechanism 規格
- [x] 2.4 將外層 `storeBonus.some(b => b.prerequisite)` 改為 `storeBonus.some(b => b.prerequisite && b.prerequisiteMet !== false)`
- [x] 2.5 驗證：`prerequisiteMet: false` 的條件 toggle 不顯示；`prerequisiteMet: undefined` 的仍顯示

## 3. CalcPage — Expense record action button label

- [x] 3.1 在 `src/pages/CalcPage.tsx` 中將 "+記帳" 按鈕文字改為 "+明細"，完成 Expense record action button label 更新
- [x] 3.2 驗證：試算頁推薦卡片的按鈕顯示 "+明細"

## 4. LedgerPage — Bonus status panel in expense entry page：明細頁 storename label 去重

- [x] 4.1 在 `src/pages/LedgerPage.tsx` store bonus rows 區塊，將 `label: \`${b.storeName}加碼\`` 改為 `label: b.storeName`，解決明細頁 storename label 去重問題，符合 Bonus status panel in expense entry page 規格
- [x] 4.2 驗證：storeName 為"日本熱門商店加碼"的 label 顯示為"日本熱門商店加碼"，不出現"加碼加碼"

## 5. LedgerPage — 明細頁行動支付加碼 label 策略（Payment method bonus tier row no-wrap layout）

- [x] 5.1 在 `src/pages/LedgerPage.tsx` paymentMethodBonus tiers 迴圈前，預先計算 `activePmTierCount`，實作明細頁行動支付加碼 label 策略
- [x] 5.2 在迴圈內新增 `pmSeq` 計數器，每次進入有效 tier 時遞增
- [x] 5.3 將 `tierLabel` 生成改為：`activePmTierCount > 1 ? \`行動支付加碼 #${pmSeq}\` : '行動支付加碼'`（不再使用 tier.prerequisite 完整字串）
- [x] 5.4 驗證：單一 tier 顯示"行動支付加碼"；多 tier 顯示"行動支付加碼 #1"、"行動支付加碼 #2"；Payment method bonus tier row no-wrap layout 行為不受影響
