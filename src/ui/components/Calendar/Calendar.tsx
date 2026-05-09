import { CalendarDay } from '../../../domain/calendar/CalendarDay'
import { todayString } from '../../../shared/utils'

interface Props {
  year: number
  month: number
  days: CalendarDay[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function Calendar({
  year,
  month,
  days,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const dayMap = new Map(days.map((d) => [d.date, d]))
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const offset = (firstDayOfWeek + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = todayString()

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrevMonth}
          className="text-steel-muted hover:text-steel-primary w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-obs-700 transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-steel-primary">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={onNextMonth}
          className="text-steel-muted hover:text-steel-primary w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-obs-700 transition-colors"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-steel-disabled py-1 font-medium uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const calDay = dayMap.get(dateStr)
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today
          const hasActivity = calDay?.hasActivity ?? false

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`
                relative aspect-square flex items-center justify-center text-xs rounded transition-colors
                ${
                  isSelected
                    ? 'bg-copper text-obs-950 font-semibold'
                    : isToday
                      ? 'ring-1 ring-copper/50 text-copper-bright'
                      : 'text-steel-muted hover:bg-obs-700 hover:text-steel-secondary'
                }
              `}
            >
              {day}
              {hasActivity && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-copper/70" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
