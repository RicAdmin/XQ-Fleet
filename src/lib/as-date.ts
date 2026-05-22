/** Coerce ISO strings from server loaders back into Date instances. */
export function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}
