import { describe, expect, it } from 'vitest'

import BrandLogo from '#/components/BrandLogo'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

describe('BrandLogo', () => {
  it('uses empty alt and aria-hidden when decorative', () => {
    const html = renderToStaticMarkup(createElement(BrandLogo, { decorative: true, size: 32 }))
    expect(html).toContain('alt=""')
    expect(html).toContain('aria-hidden="true"')
  })

  it('keeps brand alt when not decorative', () => {
    const html = renderToStaticMarkup(createElement(BrandLogo, { size: 32 }))
    expect(html).toContain('alt="XQCar"')
  })
})
