module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {},
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
}; 