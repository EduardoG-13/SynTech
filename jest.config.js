module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/backend/tests/**/*.test.ts'
  ],
  setupFiles: ['<rootDir>/src/backend/jest.setup.env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/backend/tests/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/src/backend/tsconfig.json' }]
  }
};
