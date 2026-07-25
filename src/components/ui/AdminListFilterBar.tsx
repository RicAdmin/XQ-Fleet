import type { ReactNode } from 'react'
import { ListFilter, Search, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import { cn } from '#/lib/utils'

type AdminListFilterBarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearchClear?: () => void
  searchPlaceholder: string
  searchAriaLabel: string
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  activeFilterCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
  actions?: ReactNode
  inlineControls?: ReactNode
  children?: ReactNode
  className?: string
}

export function AdminListFilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder,
  searchAriaLabel,
  filtersOpen,
  onFiltersOpenChange,
  activeFilterCount,
  hasActiveFilters,
  onClearFilters,
  actions,
  inlineControls,
  children,
  className,
}: AdminListFilterBarProps) {
  const showFilterRow = filtersOpen && children

  return (
    <div className={cn('border-b border-[var(--line)] px-3 py-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <InputGroup className="h-8 w-full min-w-[min(100%,16rem)] max-w-md flex-1 sm:min-w-[18rem]">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={searchAriaLabel}
            />
            {searchValue ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  onClick={() => {
                    onSearchChange('')
                    onSearchClear?.()
                  }}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>

          {inlineControls}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5',
              activeFilterCount > 0 && 'border-[var(--ember-border)]',
            )}
            aria-expanded={filtersOpen}
            onClick={() => onFiltersOpenChange(!filtersOpen)}
          >
            <ListFilter size={14} />
            Filters
            {activeFilterCount > 0 ? (
              <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--ember-wash)] px-1.5 text-[10px] font-semibold text-[var(--ember-deep)]">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>

          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" className="h-8" onClick={onClearFilters}>
              Clear
            </Button>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      {showFilterRow ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  )
}
