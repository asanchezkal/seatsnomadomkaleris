import { describe, it, expect } from 'vitest'
import { deriveNameFromEmail } from './userUtils.js'

describe('deriveNameFromEmail', () => {
  it('converts jane.doe@kaleris.com to Jane Doe', () => {
    expect(deriveNameFromEmail('jane.doe@kaleris.com')).toBe('Jane Doe')
  })

  it('converts mark.tan@kaleris.com to Mark Tan', () => {
    expect(deriveNameFromEmail('mark.tan@kaleris.com')).toBe('Mark Tan')
  })

  it('handles single-part local name', () => {
    expect(deriveNameFromEmail('alice@kaleris.com')).toBe('Alice')
  })

  it('handles three-part local name', () => {
    expect(deriveNameFromEmail('mary.ann.jones@kaleris.com')).toBe('Mary Ann Jones')
  })
})
