module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/jest-setup.ts"],
  moduleNameMapper: { "\\.css$": "identity-obj-proxy" },
  testMatch: ["<rootDir>/src/**/*.test.tsx"],
};
