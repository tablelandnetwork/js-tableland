module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  setupFiles: ["./src/setupTest.ts"],
  moduleNameMapper: {
    "^@textile/eth-tableland$": "<rootDir>/test/mock_modules/eth-tableland",
    "^ethers$": "<rootDir>/test/mock_modules/ethers.ts"
  }
}
