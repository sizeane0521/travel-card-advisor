## REMOVED Requirements

### Requirement: Store selection for recommendation
**Reason**: The Advisor page is being removed entirely. Store-based filtering is already available in the ExpensePage inline card recommendation list.
**Migration**: Users should use the ExpensePage store chip selector to filter recommendations by store.

### Requirement: Card recommendation ranking
**Reason**: The Advisor page is being removed entirely. Card ranking by effective rate is already present in the ExpensePage inline card list.
**Migration**: Use the ExpensePage inline card recommendation list, which ranks cards by effective rate including store bonus and payment method bonus.

### Requirement: Remaining cap display
**Reason**: The Advisor page is being removed entirely. Remaining cap information is displayed in the ExpensePage inline card list.
**Migration**: Remaining cap is shown per card in the ExpensePage card selector.

### Requirement: Recommendation based on active trip month
**Reason**: The Advisor page is being removed entirely. Trip-month-based cap calculation continues to function in the ExpensePage.
**Migration**: No action required — ExpensePage continues to use active trip month for calculations.

### Requirement: Cap progress visualization
**Reason**: The Advisor page is being removed entirely. The CapProgress data structure and blood bar rendering are no longer needed on the Advisor page.
**Migration**: None — the ExpensePage does not render blood bars (the CapProgress data remains in rewardCalc.ts but the AdvisorPage UI that consumed it is removed).
