import { Fragment, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

export type RowActionItem = {
  label: string
  onSelect: () => void
  icon?: ReactNode
  variant?: 'default' | 'destructive'
  disabled?: boolean
  separatorBefore?: boolean
}

type RowActionsMenuProps = {
  actions: RowActionItem[]
  label?: string
  align?: 'start' | 'center' | 'end'
}

/**
 * Shared list-route row actions menu (edit / view / delete).
 * Prefer this over ad-hoc inline icon buttons on admin tables.
 */
export function RowActionsMenu({
  actions,
  label = 'Row actions',
  align = 'end',
}: RowActionsMenuProps) {
  if (actions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className="text-[var(--sea-ink-soft)]"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-40">
        <DropdownMenuGroup>
          {actions.map((action) => (
            <Fragment key={action.label}>
              {action.separatorBefore ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                variant={action.variant}
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onSelect()
                }}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            </Fragment>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
