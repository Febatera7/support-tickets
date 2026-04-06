import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node"
        },
        diagnostics: {
          ignoreCodes: [151002]
        }
      }
    ]
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "api.ts", "worker.ts"],
  moduleNameMapper: {
    "^#src/(.*)$": "<rootDir>/src/$1"
  }
};

export default config;