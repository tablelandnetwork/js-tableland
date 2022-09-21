module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test/unit"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  setupFiles: ["./test/unit/setupTest.ts"],
  moduleNameMapper: {
    "^@tableland/evm$": "<rootDir>/test/unit/mock_modules/evm",
    "^ethers$": "<rootDir>/test/unit/mock_modules/ethers.ts",
  },
  resolver: "jest-ts-webcompat-resolver",
};
