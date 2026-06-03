import { describe, it, expect } from 'vitest'
import { urlBase64ToUint8Array } from './pushService.js'

describe('urlBase64ToUint8Array', () => {
  it('converts a URL-safe base64 string to Uint8Array', () => {
    // 'hello' in URL-safe base64 is 'aGVsbG8='
    const result = urlBase64ToUint8Array('aGVsbG8=')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111])
  })

  it('handles base64 strings without padding', () => {
    // 'hello' without trailing = padding
    const result = urlBase64ToUint8Array('aGVsbG8')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111])
  })

  it('converts URL-safe characters (- and _) to standard base64 (+ and /)', () => {
    // Standard base64 of bytes [251, 207] is '+88=' — URL-safe is '-88='
    const result = urlBase64ToUint8Array('-88=')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(Array.from(result)).toEqual([251, 207])
  })
})
