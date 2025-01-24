import * as fs from 'fs';
import * as path from 'path';

import { logInfo } from '../../../vscode-extension/logging/cacheLogger';

jest.mock('fs');
jest.mock('axios');
jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
  },
}));

describe('Logging functionality', () => {
  const today = new Date();
  const logFilePath = path.join(
    '/path/to/mock/workspace',
    'application',
    `log_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.txt`
  );
  const startTime = new Date('2024-11-01T12:00:00Z');
  const endTime = new Date('2024-11-01T12:05:00Z');
  const message = 'Test log message';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create the log file directory if it does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    logInfo(startTime, endTime, message);

    expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(logFilePath), {
      recursive: true,
    });
  });

  it('should append log data to the log file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    (fs.appendFileSync as jest.Mock).mockImplementation(() => {});

    logInfo(startTime, endTime, message);

    const expectedLogData = `
        Start Time: 2024-11-01T12:00:00.000Z
        End Time: 2024-11-01T12:05:00.000Z
        Message: Test log message
    `;
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      logFilePath,
      expectedLogData + '\n',
      'utf8'
    );
  });
});
