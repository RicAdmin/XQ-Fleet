import { ChevronDown } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'

export type StatusOption<T extends string> = {
  value: T
  label: string
}

type StatusFilterSelectProps<T extends string> = {
  value: T
  options: StatusOption<T>[]
  onValueChange: (value: T) => void
  'aria-label'?: string
  className?: string
}

/**
 * Compact status dropdown for dashboard / list toolbars.
 * Height matches search / date controls (2rem).
 */
export function StatusFilterSelect<T extends string>({
  value,
  options,
  onValueChange,
  'aria-label': ariaLabel = 'Filter by status',
  className,
}: StatusFilterSelectProps<T>) {
  const selected = options.find((o) => o.value === value) ?? options[0]
  const isFiltered = value !== 'all' && value !== options[0]?.value

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label={ariaLabel}
            className={cn(
              'admin-filter-control min-w-[7.5rem] max-w-[14rem] justify-between gap-1.5 px-2.5',
              isFiltered && 'border-[var(--ui-ink)]',
              className,
            )}
          />
        }
      >
        <span className="truncate">{selected?.label ?? 'Status'}</span>
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onValueChange(next as T)}
        >
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
