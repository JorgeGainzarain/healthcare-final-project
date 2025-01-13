/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  testPathIgnorePatterns: ["/node_modules/", "./src/config/", "./dist/"],
  moduleNameMapper: {
    "^app/(.*)$": "<rootDir>/src/app/$1",
    "^database/(.*)$": "<rootDir>/src/database/$1",
  }
};