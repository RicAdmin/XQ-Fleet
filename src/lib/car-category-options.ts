import type { CarCategory } from '#/db/schema'

export const CAR_CATEGORY_VALUES = ['economy', 'mpv', 'suv', 'other'] as const satisfies readonly CarCategory[]

export const CAR_CATEGORY_LABEL: Record<CarCategory, string> = {
  economy: 'Economy',
  mpv: 'MPV',
  suv: 'SUV',
  other: 'Other',
}

export const CAR_CATEGORY_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All types' },
  ...CAR_CATEGORY_VALUES.map((value) => ({
    value,
    label: CAR_CATEGORY_LABEL[value],
  })),
]

export type CarCategoryFilter = (typeof CAR_CATEGORY_FILTER_OPTIONS)[number]['value']
