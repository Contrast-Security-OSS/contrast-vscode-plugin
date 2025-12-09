import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 60000 });

  // Points to out/ui
  const testsRoot = path.resolve(__dirname, '..');

  // Find all test files inside out/ui (including subfolders)
  const files = await glob('**/*.test.js', { cwd: testsRoot });

  // Add each test file to Mocha
  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

  // Run tests
  await new Promise<void>((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures) {
          reject(new Error(`${failures} tests failed`));
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
