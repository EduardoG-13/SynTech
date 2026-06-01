module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/backend/__tests__/**/*.test.ts',
    '<rootDir>/src/backend/tests/**/*.test.ts'
  ],
  setupFiles: ['<rootDir>/src/backend/jest.setup.env.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/src/backend/tsconfig.json' }]
  }
};
