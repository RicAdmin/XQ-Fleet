import crypto from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { buildRequestSignature, formatAmountRM, verifyResponseSignature } from '#/lib/payment-functions'

function buildResponseSignature(
  merchantKey: string,
  merchantCode: string,
  paymentId: string,
  refNo: string,
  status: string,
  amountRM: string,
  currency: string,
): string {
  const amount = amountRM.replace(/[.,]/g, '')
  const raw = merchantKey + merchantCode + paymentId + refNo + amount + currency + status
  return crypto.createHmac('sha512', merchantKey).update(raw, 'utf8').digest('hex')
}

/** Vectors from iPay88 Technical API v1.6.4.4 §3.1 */
describe('iPay88 signatures', () => {
  const merchantKey = 'apple'
  const merchantCode = 'M00003'

  it('builds request signature with Xfield1 (doc §3.1)', () => {
    const sig = buildRequestSignature(
      merchantKey,
      merchantCode,
      'A00000001',
      '1.00',
      'MYR',
      'xx11',
    )
    expect(sig).toBe(
      'd8e0b9807bdd10527267f6433f9487155f56d42fdd23d3d76f2315bf72fdb50806e81e5a42491c64eb368c9e9165364fa3b011dcc81963b2fd465cfcdae77288',
    )
  })

  it('verifies response signature round-trip', () => {
    const sig = buildResponseSignature(merchantKey, merchantCode, '2', 'A00000001', '1', '1.00', 'MYR')
    expect(
      verifyResponseSignature(
        merchantKey,
        merchantCode,
        '2',
        'A00000001',
        '1',
        '1.00',
        'MYR',
        sig,
      ),
    ).toBe(true)
    expect(
      verifyResponseSignature(
        merchantKey,
        merchantCode,
        '2',
        'A00000001',
        '0',
        '1.00',
        'MYR',
        sig,
      ),
    ).toBe(false)
  })

  it('formats RM amounts for the gateway form', () => {
    expect(formatAmountRM(19500)).toBe('195.00')
    expect(formatAmountRM(100)).toBe('1.00')
  })
})
