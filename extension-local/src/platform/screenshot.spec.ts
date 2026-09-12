import { describe, expect, test } from 'vitest'
import { isColonistUrl } from './screenshot'

describe('isColonistUrl', () => {
  test('accepts colonist.io and its subdomains', () => {
    expect(isColonistUrl('https://colonist.io/')).toBe(true)
    expect(isColonistUrl('https://www.colonist.io/#room')).toBe(true)
  })

  test('rejects other hosts and malformed URLs', () => {
    expect(isColonistUrl('https://notcolonist.io/')).toBe(false)
    expect(isColonistUrl('https://colonist.io.evil.com/')).toBe(false)
    expect(isColonistUrl('chrome://extensions')).toBe(false)
    expect(isColonistUrl('nope')).toBe(false)
  })
})
