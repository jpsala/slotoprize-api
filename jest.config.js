const { resolve } = require("path");

module.exports = {
  roots: ['<rootDir>/src'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['build', 'node_modules'],
  verbose: true,
  moduleDirectories: ['node_modules'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts', 'jest-extended'],
  moduleNameMapper: {
    '^@/(.*)$': resolve(__dirname, './src/$1'),
    '^@meta/(.*)$': resolve(__dirname, './src/modules/meta/$1'),
  },
}
