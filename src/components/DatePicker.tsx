import { useState, useRef, useEffect } from 'react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  className?: string
  style?: React.CSSProperties
}

interface CalendarDay {
  date: string | null
  disabled: boolean
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildCalendarDays(year: number, month: number, min?: string, max?: string): CalendarDay[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: CalendarDay[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push({ date: null, disabled: true })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const disabled = (!!min && dateStr < min) || (!!max && dateStr > max)
    days.push({ date: dateStr, disabled })
  }

  while (days.length < 42) {
    days.push({ date: null, disabled: true })
  }

  return days
}

export default function DatePicker({ value, onChange, min, max, className, style }: DatePickerProps) {
  const today = todayStr()
  const initialDate = value || today
  const [isOpen, setIsOpen] = useState(false)
  const [calMonth, setCalMonth] = useState({
    year: parseInt(initialDate.slice(0, 4)),
    month: parseInt(initialDate.slice(5, 7)) - 1,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync calendar month when value changes externally
  useEffect(() => {
    if (value) {
      setCalMonth({
        year: parseInt(value.slice(0, 4)),
        month: parseInt(value.slice(5, 7)) - 1,
      })
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  function prevMonth() {
    setCalMonth(prev => {
      const m = prev.month === 0 ? 11 : prev.month - 1
      const y = prev.month === 0 ? prev.year - 1 : prev.year
      return { year: y, month: m }
    })
  }

  function nextMonth() {
    setCalMonth(prev => {
      const m = prev.month === 11 ? 0 : prev.month + 1
      const y = prev.month === 11 ? prev.year + 1 : prev.year
      return { year: y, month: m }
    })
  }

  function selectDate(date: string) {
    onChange(date)
    setIsOpen(false)
  }

  const days = buildCalendarDays(calMonth.year, calMonth.month, min, max)

  const displayValue = value
    ? value.replace(/-/g, '/')
    : ''

  const monthLabel = new Date(calMonth.year, calMonth.month, 1)
    .toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })

  const baseInputClass = 'w-full border rounded-lg px-3 py-2 focus:outline-none'

  return (
    <div ref={containerRef} className="relative" style={style}>
      {/* Trigger input */}
      <div
        onClick={() => setIsOpen(o => !o)}
        className={className ?? baseInputClass}
        style={{
          background: 'var(--color-input-bg)',
          borderColor: isOpen ? 'var(--color-input-focus)' : 'var(--color-input-border)',
          color: displayValue ? 'var(--color-text-base)' : 'var(--color-text-muted)',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(0,185,181,0.2)' : undefined,
        }}
      >
        {displayValue || '選擇日期'}
      </div>

      {/* Popover calendar */}
      {isOpen && (
        <div
          className="absolute left-0 mt-1 rounded-xl p-3 z-50"
          style={{
            background: 'var(--color-calendar-bg)',
            border: '1px solid var(--color-border)',
            minWidth: '260px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {/* Month header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="px-2 py-1 rounded text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ‹
            </button>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="px-2 py-1 rounded text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ›
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[10px] py-1" style={{ color: 'var(--color-text-muted)' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((cell, i) => {
              if (!cell.date) {
                return <div key={i} />
              }
              const isSelected = cell.date === value
              const isToday = cell.date === today

              let cellStyle: React.CSSProperties = { color: 'var(--color-text-base)' }
              if (isSelected) {
                cellStyle = { background: 'var(--color-secondary)', color: '#fff', borderRadius: '50%' }
              } else if (isToday) {
                cellStyle = { color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', borderRadius: '50%' }
              } else if (cell.disabled) {
                cellStyle = { color: 'var(--color-border)' }
              }

              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => !cell.disabled && selectDate(cell.date!)}
                  className="flex items-center justify-center text-xs w-8 h-8 mx-auto transition-colors"
                  style={{
                    ...cellStyle,
                    cursor: cell.disabled ? 'default' : 'pointer',
                  }}
                >
                  {parseInt(cell.date.slice(8))}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
