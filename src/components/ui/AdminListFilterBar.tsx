import type { ReactNode } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import { cn } from '#/lib/utils'

type AdminQuickFilterOption = {
  value: string
  label: string
}

type AdminQuickFilterChipsProps = {
  label?: string
  value: string
  options: AdminQuickFilterOption[]
  onValueChange: (value: string) => void
  className?: string
}

/** Pill chips for always-visible quick filters under the search row. */
export function AdminQuickFilterChips({
  label,
  value,
  options,
  onValueChange,
  className,
}: AdminQuickFilterChipsProps) {
  return (
    <div className={cn('admin-filter-bar__quick-group', className)}>
      {label ? <span className="admin-filter-bar__quick-label">{label}</span> : null}
      <div className="admin-filter-bar__chips" role="group" aria-label={label ?? 'Quick filters'}>
        {options.map((option) => {
          const isActive = value === option.value
          return (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="sm"
              data-active={isActive ? 'true' : 'false'}
              className="admin-filter-preset h-[1.875rem] min-h-[1.875rem] max-h-[1.875rem] active:translate-y-0"
              aria-pressed={isActive}
              onClick={() => onValueChange(option.value)}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

type AdminListFilterBarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearchClear?: () => void
  searchPlaceholder: string
  searchAriaLabel: string
  /** Optional count/summary shown inside the search field (e.g. "24 jobs"). */
  resultSummary?: string
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  activeFilterCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
  actions?: ReactNode
  /** Always-visible quick filters (chips) under the search row. */
  quickFilters?: ReactNode
  /** @deprecated Prefer quickFilters — still rendered in the quick row for compatibility. */
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
  resultSummary,
  filtersOpen,
  onFiltersOpenChange,
  activeFilterCount,
  hasActiveFilters,
  onClearFilters,
  actions,
  quickFilters,
  inlineControls,
  children,
  className,
}: AdminListFilterBarProps) {
  const showFilterPanel = filtersOpen && children
  const showQuickRow = Boolean(quickFilters || inlineControls)

  return (
    <div className={cn('admin-filter-bar', className)}>
      <div className="admin-filter-bar__row">
        <InputGroup className="admin-filter-search">
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
          ) : resultSummary ? (
            <InputGroupAddon align="inline-end" className="admin-filter-search__summary">
              <span>{resultSummary}</span>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <div className="admin-filter-bar__actions">
          {children ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'admin-filter-control gap-1.5',
                (filtersOpen || activeFilterCount > 0) && 'border-[var(--ui-ink)]',
              )}
              aria-expanded={filtersOpen}
              onClick={() => onFiltersOpenChange(!filtersOpen)}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 ? (
                <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--ui-ink)] px-1.5 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          ) : null}

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="admin-filter-control"
              onClick={onClearFilters}
            >
              Clear
            </Button>
          ) : null}

          {actions}
        </div>
      </div>

      {showQuickRow ? (
        <div className="admin-filter-bar__quick">
          {quickFilters}
          {inlineControls}
        </div>
      ) : null}

      {showFilterPanel ? <div className="admin-filter-bar__extra">{children}</div> : null}
    </div>
  )
}
