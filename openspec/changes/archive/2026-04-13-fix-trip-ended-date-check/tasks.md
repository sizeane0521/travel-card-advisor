## 1. 修正旅程結束判斷條件（End a trip）

- [x] 1.1 修正 End a trip 判斷邏輯：在 `src/pages/TripsPage.tsx` 確認 `todayStr()` helper 存在，並將 `const isEnded = !!trip.endDate` 改為 `const isEnded = !!trip.endDate && trip.endDate <= todayStr()`（Future end date does not lock the trip；Past end date locks the trip）
- [x] 1.2 在 `src/pages/CalcPage.tsx` 將 `if (activeTrip.endDate)` 改為 `if (activeTrip.endDate && activeTrip.endDate <= todayStr())`，確保計畫結束日為未來時不顯示鎖定畫面（Both active and ended badges not shown simultaneously；Ended trip cannot receive new expenses）
