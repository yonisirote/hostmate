/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: [],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '<rootDir>/src/__tests__/jest\\.(env|setup)\\.ts$'],
  verbose: false,
  roots: ['<rootDir>/src'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: {
          warnOnly: true,
        },
      },
    ],
  },
};
