import { describe, expect, it } from 'vitest'

import { appendSpamFolderNotice, EMAIL_SPAM_FOLDER_NOTICE } from '#/emails/email-helpers'

describe('appendSpamFolderNotice', () => {
  it('inserts notice before closing body tag', () => {
    const html = '<html><body><p>Hello</p></body></html>'
    const result = appendSpamFolderNotice(html)
    expect(result).toContain(EMAIL_SPAM_FOLDER_NOTICE)
    expect(result).toMatch(/junk or spam folder\.<\/p><\/body><\/html>$/)
  })
})
