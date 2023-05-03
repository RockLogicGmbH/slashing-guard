module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  roots: ["<rootDir>/src/", "<rootDir>/tests/"],
  testMatch: ["**/?(*.)+(spec|test|int).[tj]s?(x)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleDirectories: ["node_modules", "src"],
  testEnvironment: "node",
  transformIgnorePatterns: ["node_modules/(?!(sucrase)/)"],
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  // collectCoverage: true,
  // collectCoverageFrom: ["src/**/*.{js,ts}"],
  // coverageReporters: ["text", "json", "html"],
};
