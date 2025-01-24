module.exports = {
  preset: 'ts-jest', // Use ts-jest preset to work with TypeScript
  testEnvironment: 'jest-environment-jsdom', // Simulate a browser environment
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports if using any CSS or TailwindCSS
    '^vscode$': '<rootDir>/__mocks__/vscode.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'], // Setup Jest DOM matchers
  testPathIgnorePatterns: ['/node_modules/', '/dist/'], // Ignore compiled files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        // Any other ts-jest configurations you need here
      },
    ],
  },
  globals: {
    testMatch: ['**/test/**/*.test.(ts|tsx|js|jsx)'],
  },
};
