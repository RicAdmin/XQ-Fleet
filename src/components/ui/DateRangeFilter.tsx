import { CalendarDays, ChevronDown } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

type DateRangeFilterProps = {
  from?: string
  to?: string
  onFromChange: (value: string | undefined) => void
  onToChange: (value: string | undefined) => void
  /** Apply both ends at once (presets). Prefer this when available. */
  onRangeChange?: (from: string | undefined, to: string | undefined) => void
  className?: string
}

type DateRangeQuickPresetsProps = {
  from?: string
  to?: string
  onRangeChange: (from: string | undefined, to: string | undefined) => void
  className?: string
}

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function rangeToday(): [string, string] {
  const now = startOfDay(new Date())
  return [toYmd(now), toYmd(endOfDay(now))]
}

/** Week starts Monday (en-MY / business ops default). */
function rangeThisWeek(): [string, string] {
  const now = startOfDay(new Date())
  const day = now.getDay() // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [toYmd(monday), toYmd(sunday)]
}

function rangeThisMonth(): [string, string] {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return [toYmd(from), toYmd(to)]
}

function formatShort(ymd?: string): string | null {
  if (!ymd) return null
  const d = new Date(`${ymd}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

function detectPreset(from?: string, to?: string): 'today' | 'week' | 'month' | null {
  if (!from || !to) return null
  const [tFrom, tTo] = rangeToday()
  if (from === tFrom && to === tTo) return 'today'
  const [wFrom, wTo] = rangeThisWeek()
  if (from === wFrom && to === wTo) return 'week'
  const [mFrom, mTo] = rangeThisMonth()
  if (from === mFrom && to === mTo) return 'month'
  return null
}

const QUICK_PRESETS: {
  key: 'today' | 'week' | 'month'
  label: string
  range: () => [string, string]
}[] = [
  { key: 'today', label: 'Today', range: rangeToday },
  { key: 'week', label: 'This week', range: rangeThisWeek },
  { key: 'month', label: 'This month', range: rangeThisMonth },
]

/**
 * Inline Today / This week / This month buttons for the main toolbar row.
 */
export function DateRangeQuickPresets({
  from,
  to,
  onRangeChange,
  className,
}: DateRangeQuickPresetsProps) {
  const preset = detectPreset(from, to)

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {QUICK_PRESETS.map((p) => {
        const isActive = preset === p.key
        return (
          <Button
            key={p.key}
            type="button"
            variant={isActive ? 'secondary' : 'outline'}
            size="sm"
            className={cn('h-8 font-normal', isActive && 'border-[var(--ember-border)]')}
            onClick={() => {
              if (isActive) {
                onRangeChange(undefined, undefined)
                return
              }
              const [nextFrom, nextTo] = p.range()
              onRangeChange(nextFrom, nextTo)
            }}
          >
            {p.label}
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Custom from/to date picker dropdown for the filters row.
 */
export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onRangeChange,
  className,
}: DateRangeFilterProps) {
  const fromLabel = formatShort(from)
  const toLabel = formatShort(to)
  const hasRange = Boolean(from || to)
  const preset = detectPreset(from, to)

  const label =
    preset === 'today'
      ? 'Today'
      : preset === 'week'
        ? 'This week'
        : preset === 'month'
          ? 'This month'
          : fromLabel && toLabel
            ? `${fromLabel} – ${toLabel}`
            : fromLabel
              ? `From ${fromLabel}`
              : toLabel
                ? `Until ${toLabel}`
                : 'Custom dates'

  function applyRange(nextFrom: string | undefined, nextTo: string | undefined) {
    if (onRangeChange) {
      onRangeChange(nextFrom, nextTo)
      return
    }
    onFromChange(nextFrom)
    onToChange(nextTo)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label="Filter by custom date range"
            className={cn(
              'h-8 max-w-[11rem] justify-between gap-1.5 font-normal',
              hasRange && !preset && 'border-[var(--ember-border)] text-[var(--sea-ink)]',
              className,
            )}
          />
        }
      >
        <CalendarDays data-icon="inline-start" className="opacity-60" />
        <span className="truncate">{label}</span>
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-3">
        <div className="flex flex-col gap-2.5" onKeyDown={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-date-from"
              className="text-xs font-medium text-muted-foreground"
            >
              From
            </label>
            <Input
              id="filter-date-from"
              type="date"
              className="h-8"
              value={from ?? ''}
              max={to || undefined}
              onChange={(e) => onFromChange(e.target.value || undefined)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-date-to"
              className="text-xs font-medium text-muted-foreground"
            >
              To
            </label>
            <Input
              id="filter-date-to"
              type="date"
              className="h-8"
              value={to ?? ''}
              min={from || undefined}
              onChange={(e) => onToChange(e.target.value || undefined)}
            />
          </div>
          {hasRange ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => applyRange(undefined, undefined)}
            >
              Clear dates
            </Button>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
