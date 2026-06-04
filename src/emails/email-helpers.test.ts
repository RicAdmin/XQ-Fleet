import { describe, expect, it } from 'vitest'

import { appendSpamFolderNotice, EMAIL_SPAM_FOLDER_NOTICE } from '#/emails/email-helpers'
import { absolutePublicUrl } from '#/lib/brand'

describe('absolutePublicUrl', () => {
  it('prefixes site-relative paths with the public origin', () => {
    expect(absolutePublicUrl('/image/car_model/vios.jpg', 'https://carxq.com')).toBe(
      'https://carxq.com/image/car_model/vios.jpg',
    )
  })

  it('leaves absolute URLs unchanged', () => {
    expect(absolutePublicUrl('https://cdn.example.com/cars/1.jpg')).toBe(
      'https://cdn.example.com/cars/1.jpg',
    )
  })

  it('returns null for empty values', () => {
    expect(absolutePublicUrl(null)).toBeNull()
    expect(absolutePublicUrl('  ')).toBeNull()
  })
})

describe('appendSpamFolderNotice', () => {
  it('inserts notice before closing body tag', () => {
    const html = '<html><body><p>Hello</p></body></html>'
    const result = appendSpamFolderNotice(html)
    expect(result).toContain(EMAIL_SPAM_FOLDER_NOTICE)
    expect(result).toMatch(/junk or spam folder\.<\/p><\/body><\/html>$/)
  })
})
