const STORAGE_KEY = 'cxq-checkout-draft'

export type CheckoutDraft = {
  carId: string
  buyer: {
    name: string
    email: string
    phone: string
    addressLine1: string
    addressLine2: string
    city: string
    stateProvince: string
    postalCode: string
    country: string
  }
  driver: {
    name: string
    email: string
    phone: string
    license: string
    country: string
  }
  alsoAsDriver: boolean
  addons: { child: boolean; second: boolean }
  appliedPromo: { code: string; discountSen: number } | null
  guestCheckout: boolean
  awaitingPayment: boolean
}

export function saveCheckoutDraft(draft: CheckoutDraft): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadCheckoutDraft(carId: string): CheckoutDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CheckoutDraft
    if (parsed.carId !== carId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearCheckoutDraft(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
