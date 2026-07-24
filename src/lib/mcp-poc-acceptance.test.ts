import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const VERIFICATION = join(ROOT, 'docs/pr-artifacts/74/verification.md')
const ACCEPTANCE_SCRIPT = join(ROOT, 'scripts/verify-mcp-poc.sh')
const PRODUCTION_ENV = join(ROOT, 'bruno/environments/production.bru')
const CHECKOUT_SCREENSHOT = join(ROOT, 'docs/pr-artifacts/74/checkout-dates-filled.png')

describe('MCP PoC acceptance documentation (#74)', () => {
  const md = () => readFileSync(VERIFICATION, 'utf8')

  it('verification doc covers inspector search and checkout URL criteria', () => {
    const doc = md()
    expect(doc).toMatch(/search_available_cars/)
    expect(doc).toMatch(/get_checkout_url/)
    expect(doc).toMatch(/inspector|Bruno|verify-mcp-poc/i)
    expect(doc).toMatch(/checkout-dates-filled\.png/)
  })

  it('verification doc covers ChatGPT custom connector setup', () => {
    const doc = md()
    expect(doc).toMatch(/ChatGPT/)
    expect(doc).toMatch(/car\.xqholidays\.com\.my\/api\/mcp/)
    expect(doc).toMatch(/Streamable HTTP/i)
    expect(doc).toMatch(/Authentication.*None|public/i)
  })

  it('verification doc confirms no Rental is created by agent tools', () => {
    const doc = md()
    expect(doc).toMatch(/no Rental|No Rental/i)
    expect(doc).toMatch(/rentalId/)
    expect(doc).toMatch(/read-only|RM 0/i)
  })

  it('production acceptance script exists', () => {
    expect(existsSync(ACCEPTANCE_SCRIPT)).toBe(true)
    const script = readFileSync(ACCEPTANCE_SCRIPT, 'utf8')
    expect(script).toMatch(/search_available_cars/)
    expect(script).toMatch(/get_checkout_url/)
    expect(script).toMatch(/rentalId/)
  })

  it('Bruno production environment points at live MCP host', () => {
    const env = readFileSync(PRODUCTION_ENV, 'utf8')
    expect(env).toMatch(/car\.xqholidays\.com\.my/)
  })

  it('checkout handoff screenshot is captured for the PR', () => {
    expect(existsSync(CHECKOUT_SCREENSHOT)).toBe(true)
  })
})
