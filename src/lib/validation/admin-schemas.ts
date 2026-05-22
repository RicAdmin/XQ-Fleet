/**
 * Shared Zod schemas + helpers for admin server functions.
 *
 * Pattern for new server fns:
 *
 *   import { adminInputValidator } from '#/lib/validation/admin-schemas'
 *   import { z } from 'zod'
 *
 *   const inputSchema = z.object({ ... })
 *   export const myServerFn = createServerFn({ method: 'POST' })
 *     .inputValidator(adminInputValidator(inputSchema))
 *     .handler(async ({ data }) => { ... })
 *
 * Existing pass-through `inputValidator` callers are not retro-migrated; new
 * admin fns adopt Zod from day one.
 */
import { z } from 'zod'

/** Reusable: trimmed non-empty string. */
export const trimmedString = (max = 500) =>
  z.string().trim().min(1, 'Required.').max(max)

/** Reusable: optional non-empty trimmed string. */
export const optionalTrimmedString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v))

/** ISO 8601 date in YYYY-MM-DD form. */
export const dateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD.')

/** UUID v4 / v5 string. */
export const uuidString = z.string().uuid('Must be a valid UUID.')

/** Generic pagination input. Page is 1-indexed. */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(25),
})

export type PaginationInput = z.infer<typeof paginationSchema>

/** Sort direction. */
export const sortDirSchema = z.enum(['asc', 'desc']).default('desc')

/** Date range for KPI / report queries. */
export const dateRangeSchema = z
  .object({ from: dateOnlyString, to: dateOnlyString })
  .refine((v) => v.from <= v.to, 'from must be <= to.')

export type DateRangeInput = z.infer<typeof dateRangeSchema>

/** Currency value in sen (integer). */
export const senAmount = z.number().int().nonnegative()

/** Whole percent 0–100 (used by promos discount_value_sen for percent type). */
export const percentInt = z.number().int().min(0).max(100)

/** Promo code format: 3-32 chars, A-Z 0-9 - _. */
export const promoCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9_-]{3,32}$/, 'Code must be 3–32 chars; use A–Z, 0–9, -, _')

/** Affiliate code format: 3-32 chars, lowercase a-z 0-9 - _. */
export const affiliateCodeSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9_-]{3,32}$/,
    'Affiliate code must be 3–32 chars; use a–z, 0–9, -, _',
  )

/** Wraps a Zod schema as a TanStack `inputValidator`. Throws on invalid input. */
export function adminInputValidator<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
) {
  return (input: unknown): z.infer<TSchema> => {
    const result = schema.safeParse(input)
    if (!result.success) {
      const first = result.error.issues[0]
      const path = first.path.length ? `${first.path.join('.')}: ` : ''
      throw new Error(`${path}${first.message}`)
    }
    return result.data
  }
}
