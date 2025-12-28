import { assertNonNull } from './assert-non-null'

describe('assertNonNull', () => {
  it('should not throw an error if the value is non-null', () => {
    expect(() => assertNonNull('non-null value')).not.toThrow()
    expect(() => assertNonNull('')).not.toThrow()
    expect(() => assertNonNull(123)).not.toThrow()
    expect(() => assertNonNull(0)).not.toThrow()
    expect(() => assertNonNull(true)).not.toThrow()
    expect(() => assertNonNull(false)).not.toThrow()
    expect(() => assertNonNull({})).not.toThrow()
    expect(() => assertNonNull([])).not.toThrow()
  })

  it('should throw an error if the value is null', () => {
    expect(() => assertNonNull(null)).toThrow('Expected value to be non-null, but received null')
  })

  it('should throw an error if the value is undefined', () => {
    expect(() => assertNonNull(undefined)).toThrow('Expected value to be non-null, but received undefined')
  })
})
