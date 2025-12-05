/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { runTests } = require('@vscode/test-electron');

(async () => {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..'); // repo root
    const extensionTestsPath = path.resolve(
      __dirname,
      '../out/test/ui/suite/index.js'
    );

    await runTests({
      version: 'stable',
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions'],
    });
  } catch (err) {
    console.error('Failed to run VS Code UI smoke tests:', err);
    process.exit(1);
  }
})();
