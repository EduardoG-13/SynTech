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
  },
  collectCoverageFrom: [
    'src/backend/services/**/*.ts',
  ],
  coverageThreshold: {
    'src/backend/services/': {
      lines: 80,
      statements: 80,
      branches: 65,
      functions: 65,
    },
  },
};
