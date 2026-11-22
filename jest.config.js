/** Unit tests for pure logic (no React Native runtime); the site itself is tested by Playwright in tests/e2e. */
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/unit'],
    transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
