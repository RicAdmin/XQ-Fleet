import type { LucideIcon } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { cn } from '#/lib/utils'

export type StatusFilterTab<T extends string> = {
  value: T
  label: string
  count?: number
  icon?: LucideIcon
}

type StatusFilterTabsProps<T extends string> = {
  tabs: StatusFilterTab<T>[]
  value: T
  onValueChange: (value: T) => void
  className?: string
  'aria-label'?: string
}

/**
 * Shared admin tab strip — pill container with ember-wash active state.
 * Used for status filters and section switchers across admin routes.
 */
export function StatusFilterTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  className,
  'aria-label': ariaLabel = 'Filter by status',
}: StatusFilterTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={cn('gap-0', className)}
      aria-label={ariaLabel}
    >
      <TabsList variant="pill" className="overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="shrink-0">
              {Icon ? <Icon size={17} /> : null}
              {tab.label}
              {typeof tab.count === 'number' ? (
                <span
                  className={cn(
                    'rounded-full bg-[rgba(26,25,22,0.06)] px-1.5 text-[10px] font-semibold tabular-nums text-[var(--sea-ink-soft)]',
                    'group-data-active/tabs-trigger:bg-[var(--ember-wash)] group-data-active/tabs-trigger:text-[var(--ember-deep)]',
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
