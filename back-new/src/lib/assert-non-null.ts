export function assertNonNull<T>(value: unknown): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`Expected value to be non-null, but received ${value}`)
  }
}
