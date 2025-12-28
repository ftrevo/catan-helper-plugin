'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var assert_non_null_1 = require('./assert-non-null')
describe('assertNonNull', function () {
  it('should not throw an error if the value is non-null', function () {
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)('non-null value')
    }).not.toThrow()
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)('')
    }).not.toThrow()
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)(123)
    }).not.toThrow()
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)(0)
    }).not.toThrow()
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)(true)
    }).not.toThrow()
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)(false)
    }).not.toThrow()
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)({})
    }).not.toThrow()
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)([])
    }).not.toThrow()
  })
  it('should throw an error if the value is null', function () {
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)(null)
    }).toThrow('Expected value to be non-null, but received null')
  })
  it('should throw an error if the value is undefined', function () {
    expect(function () {
      return (0, assert_non_null_1.assertNonNull)(undefined)
    }).toThrow('Expected value to be non-null, but received undefined')
  })
})
