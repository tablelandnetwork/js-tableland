module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  setupFiles: ["./test/setupTest.ts"],
  moduleNameMapper: {
    "^@tableland/eth$": "<rootDir>/test/mock_modules/eth",
    "^ethers$": "<rootDir>/test/mock_modules/ethers.ts",
  },
  resolver: "jest-ts-webcompat-resolver",
};
