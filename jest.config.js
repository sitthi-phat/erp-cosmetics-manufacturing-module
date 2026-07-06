/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/backend/**/*.test.ts', '<rootDir>/prisma/**/*.test.ts'],
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1'
  },
  collectCoverageFrom: ['src/backend/**/*.ts', '!src/backend/**/*.test.ts'],
  clearMocks: true
};
