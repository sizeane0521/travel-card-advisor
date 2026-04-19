## Context

App 目前所有日期輸入使用原生 `<input type="date">`，分散於 4 個檔案共 5 處。需建立統一的 `DatePicker` 受控元件，桌面與行動端行為一致，外觀符合暗金主題。不引入外部日期選擇器套件。

## Goals / Non-Goals

**Goals:**
- 新建 `src/components/DatePicker.tsx`，提供 Popover 月曆 UI
- 點擊輸入框任意位置觸發月曆，不需精準點擊 icon
- 月曆樣式完全自訂（暗金主題），不依賴 OS 原生 picker
- 支援 `min` / `max` 日期限制，超出範圍的日期呈現 disabled 狀態
- 桌面（滑鼠）與行動（觸控）均可正常操作

**Non-Goals:**
- 不實作鍵盤完整 ARIA 導覽（arrow key 月曆移動）
- 不支援日期範圍選擇（range picker）
- 不支援時間選擇

## Decisions

### DatePicker 為受控元件，介面與原生 input 對齊

Props：
```
interface DatePickerProps {
  value: string        // YYYY-MM-DD 或 ''
  onChange: (value: string) => void
  min?: string         // YYYY-MM-DD
  max?: string         // YYYY-MM-DD
  className?: string
  style?: React.CSSProperties
}
```
與原有 `<input type="date">` 的 `value`/`onChange`/`min`/`max` 對齊，方便逐一替換，呼叫端改動最小。

### Popover 用 absolute 定位，掛載於元件自身容器

月曆 Popover 以 `position: absolute` 相對於觸發 div 定位，不使用 Portal。優點：不需處理 scroll offset，實作簡單；缺點：若容器有 `overflow: hidden` 會被裁切——目前頁面沒有此限制，可接受。

替代方案：React Portal 掛至 body — 需計算 getBoundingClientRect，複雜度高，此 App 不需要。

### 點擊元件外部關閉：useEffect + mousedown listener

在 Popover 開啟時，用 `useEffect` 監聽 `document.mousedown`，若 event.target 不在元件 ref 範圍內則關閉。

### 月曆渲染：純 JS Date 計算，不引入外部套件

用 `new Date(year, month, 1).getDay()` 計算首日星期，渲染 6 行 × 7 列的日期格。顯示月份用 `zh-TW` locale。

### 暗金配色

| 元素 | 樣式 |
|------|------|
| 輸入框背景 | `#141008` |
| 輸入框邊框 | `#4a3418` |
| 輸入框文字 | `#f2e8c9` |
| Popover 背景 | `#1a1208` |
| Popover 邊框 | `#3d2e14` |
| 選中日期 | `background: #d4a017`, 文字 `#0d0a06` |
| 今天（未選中）| `border: 1px solid #d4a017` |
| Disabled 日期 | `color: #3d2e14`，不可點擊 |
| 月份標題 | `#f2e8c9` |
| 星期標頭 | `#9a7040` |
| 上/下月切換按鈕 | `#c8a060` |

## Risks / Trade-offs

- [取捨] 不用 Portal 代表深層 overflow:hidden 容器內會被裁切 → 目前佈局無此問題，未來若有需要再改
- [取捨] 不引入外部套件（如 react-day-picker）→ 自行維護日曆計算邏輯，但依賴最小、樣式完全可控
