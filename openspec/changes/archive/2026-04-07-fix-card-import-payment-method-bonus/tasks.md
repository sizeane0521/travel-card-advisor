## 1. Update CardImportResult Interface and Parser

- [x] 1.1 Add `paymentMethodBonusTiers` field to the `CardImportResult` interface in `src/lib/cardImport.ts` with shape `{ rate: number; monthlyCap: number; prerequisite?: string }[]`
- [x] 1.2 Update `parseClaudeResponse()` in `src/lib/cardImport.ts` to parse `paymentMethodBonusTiers` from the AI JSON response and include it in the returned `CardImportResult`

## 2. Update AI Prompt to Recognize Payment Method Bonuses

- [x] 2.1 Add `paymentMethodBonusTiers` to the JSON schema section of the AI prompt in `parseCardFromHtml()`, instructing the AI to output 行動支付 / Apple Pay / Google Pay / 感應支付 bonuses here (rate, monthlyCap, prerequisite) instead of in `storeRules` — satisfies "AI card import recognizes payment method bonuses"
- [x] 2.2 Update the prompt example to remove `行動支付登錄加碼` from `storeRules` and add it to `paymentMethodBonusTiers` with `monthlyCap: 600`
- [x] 2.3 Add a note in the prompt: entries whose `categoryName` contains 行動支付, Apple Pay, Google Pay, or 感應支付 SHALL NOT appear in `storeRules`

## 3. Apply Imported Tiers to Card Form

- [x] 3.1 Update `applyImportResult()` in `src/components/CardForm.tsx` to check `result.paymentMethodBonusTiers`; if non-empty, call `setPmBonusEnabled(true)`, `setPmMethods(['apple_pay', 'google_pay'])`, and `setPmTiers()` with the mapped tiers — satisfies "payment method bonus does not appear in storeBonus" and "import card with no payment method bonus" scenarios
