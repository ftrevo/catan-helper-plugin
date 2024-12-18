/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  logHeapUsage: true,
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/.vscode/', 'openApi.ts', 'index.ts'],
  coverageReporters: ['lcov', 'text-summary'],
  collectCoverageFrom: ['src/v1/**/*.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts': [
      'ts-jest',
      {
        tsconfig: {
          noEmit: true,
          allowImportingTsExtensions: true,
        },
      },
    ],
  },
}
