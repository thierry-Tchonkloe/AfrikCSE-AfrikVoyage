/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  testMatch: ['<rootDir>/src/test/**/*.test.ts'], // Tous les tests sont centralisés dans src/test
  setupFiles: ['<rootDir>/src/test/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'], // évite les mocks manuels en double si dist/ existe (build local)
  verbose: true,
  forceExit: true,
  clearMocks: true,
};