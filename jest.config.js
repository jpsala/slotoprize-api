module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["build", "node_modules"],
  moduleDirectories: ["node_modules"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"]
}
