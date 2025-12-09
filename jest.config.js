// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',

  // 👇 Limit Jest to unit tests only
  roots: ['<rootDir>/src/test/unitTest'],

  // Only pick test files inside src/test
  testMatch: ['**/?(*.)+(test|spec).+(ts|tsx|js|jsx)'],

  // Ignore compiled output and VS Code test runtime folders
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/out/',
    '/.vscode-test/',
  ],
  modulePathIgnorePatterns: ['/dist/', '/out/'],

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^vscode$': '<rootDir>/__mocks__/vscode.js',
  },

  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
    collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/vscode-extension/commands/**',
    '!<rootDir>/src/vscode-extension/logging/**',
    '!<rootDir>/src/vscode-extension/utils/**',
    '!<rootDir>/src/vscode-extension/utils/commandHandler/**',
    '!<rootDir>/src/webview/**',
    '!<rootDir>/src/l10n.ts'
  ],
};
