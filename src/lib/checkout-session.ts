import { appRoleFromSessionUser } from '#/lib/auth-model'

export type CheckoutSessionUser = {
  name?: string | null
  email: string
}

/** Public checkout is for customers only; tolerate missing role on client session payloads. */
export function toCheckoutCustomer(
  user: { name?: string | null; email: string } | null | undefined,
): CheckoutSessionUser | undefined {
  if (!user?.email) return undefined
  const role = appRoleFromSessionUser(user)
  if (role && role !== 'customer') return undefined
  return { name: user.name, email: user.email }
}
