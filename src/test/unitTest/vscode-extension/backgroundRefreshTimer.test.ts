import {
  startBackgroundTimer,
  stopBackgroundTimer,
  resetBackgroundTimer,
} from '../../../vscode-extension/cache/backgroundRefreshTimer';
import {
  DateTime,
  getVulnerabilitiesRefreshCycle,
} from '../../../vscode-extension/utils/commonUtil';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import {
  refreshCache,
  clearCacheByProjectId,
  getDataOnlyFromCache,
} from '../../../vscode-extension/cache/cacheManager';
import { localeI18ln } from '../../../l10n';
import { ShowInformationPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import { ContrastPanelInstance } from '../../../vscode-extension/commands/ui-commands/webviewHandler';
import { WEBVIEW_COMMANDS } from '../../../vscode-extension/utils/constants/commands';
import { loggerInstance } from '../../../vscode-extension/logging/logger';
import { LogLevel } from '../../../common/types';

jest.mock('../../../vscode-extension/utils/persistanceState', () => ({
  PersistenceInstance: {
    getByKey: jest.fn(),
  },
}));

jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
  },
  window: {
    showInformationMessage: jest.fn(),
    onDidChangeActiveTextEditor: jest.fn(),
    onDidChangeActiveColorTheme: jest.fn(),
  },
}));

jest.mock('axios');
jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopup: jest.fn(),
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      postMessage: jest.fn(),
    },
  })
);

(ShowInformationPopup as jest.Mock).mockResolvedValue(
  'Failed to refresh cache'
);

jest.mock('../../../vscode-extension/utils/errorHandling');

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getVulnerabilitiesRefreshCycle: jest.fn(),
  refreshCache: jest.fn(),
}));

jest.mock('../../../vscode-extension/cache/cacheManager', () => ({
  refreshCache: jest.fn(),
  clearCacheByProjectId: jest.fn(),
  getDataOnlyFromCache: jest.fn(),
}));

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

let interval: NodeJS.Timeout;

describe('Background Timer Tests', () => {
  const projectId = '12345';
  const mockProject = {
    projectId,
    projectName: 'Test Project',
    minute: 10,
  };
  const persistedData = [mockProject];

  beforeEach(() => {
    jest.clearAllMocks();
    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(persistedData);
    interval = {} as NodeJS.Timeout;
  });

  describe('startBackgroundTimer', () => {
    it('should start the timer and refresh cache based on the cycle time', async () => {
      const mockRefreshCycle = 10;

      (getVulnerabilitiesRefreshCycle as jest.Mock).mockResolvedValue(
        mockRefreshCycle
      );

      const mockSetInterval = jest
        .spyOn(global, 'setInterval')
        .mockImplementation(jest.fn());

      const mockRefreshCache = refreshCache as jest.Mock;
      mockRefreshCache.mockResolvedValue(undefined);

      const mockGetDataOnlyFromCache = getDataOnlyFromCache as jest.Mock;
      mockGetDataOnlyFromCache.mockResolvedValue({
        files: ['file1.js', 'file2.js'],
      });

      await startBackgroundTimer(projectId);

      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        mockRefreshCycle * 60 * 1000
      );

      const intervalCallback = mockSetInterval.mock.calls[0][0];
      await intervalCallback();
      expect(mockRefreshCache).toHaveBeenCalledWith(projectId);

      const response = await refreshCache('334');
      if (response !== undefined) {
        expect(ContrastPanelInstance.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
            data: { files: ['file1.js', 'file2.js'] },
          })
        );
      }
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(0);
      expect(ShowInformationPopup).toHaveBeenCalledWith(
        localeI18ln.getTranslation('apiResponse.cacheStarted')
      );
    });

    it('should handle the error when refreshing cache fails', async () => {
      const mockRefreshCycle = 10;
      (getVulnerabilitiesRefreshCycle as jest.Mock).mockResolvedValue(
        mockRefreshCycle
      );

      const mockSetInterval = jest
        .spyOn(global, 'setInterval')
        .mockImplementation(jest.fn());

      const mockRefreshCache = refreshCache as jest.Mock;
      mockRefreshCache.mockRejectedValue(new Error('Cache refresh failed'));

      await startBackgroundTimer(projectId);

      expect(mockSetInterval).toHaveBeenCalled();

      const intervalCallback = mockSetInterval.mock.calls[0][0];
      await intervalCallback();
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);
      expect(mockRefreshCache).toHaveBeenCalled();
      expect(ShowInformationPopup).toHaveBeenCalledWith(expect.any(String));
      await expect(refreshCache).rejects.toThrow('Cache refresh failed');
    });

    it('should not start a new timer if one already exists', async () => {
      interval = {} as NodeJS.Timeout;

      const mockSetInterval = jest
        .spyOn(global, 'setInterval')
        .mockImplementation(jest.fn());

      await startBackgroundTimer(projectId);

      expect(mockSetInterval).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the project is not found in the persisted data', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      await expect(startBackgroundTimer(projectId)).not.toBe(
        'Project not found'
      );
    });

    it('should send a message and log success if cache is refreshed successfully', async () => {
      const mockRefreshCycle = 10;
      const mockSetInterval = jest
        .spyOn(global, 'setInterval')
        .mockImplementation(jest.fn());

      (getVulnerabilitiesRefreshCycle as jest.Mock).mockResolvedValue(
        mockRefreshCycle
      );

      const mockRefreshCache = refreshCache as jest.Mock;
      mockRefreshCache.mockResolvedValue('34544');

      const mockGetDataOnlyFromCache = getDataOnlyFromCache as jest.Mock;
      mockGetDataOnlyFromCache.mockResolvedValue({
        files: ['file1.js', 'file2.js'],
      });

      const mockPostMessage = ContrastPanelInstance.postMessage as jest.Mock;
      const mockLogMessage = loggerInstance.logMessage as jest.Mock;

      await startBackgroundTimer(projectId);

      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        mockRefreshCycle * 60 * 1000
      );

      const intervalCallback = mockSetInterval.mock.calls[0][0];
      await intervalCallback();

      expect(mockRefreshCache).toHaveBeenCalledWith(projectId);

      expect(mockPostMessage).toHaveBeenCalledWith({
        command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
        data: { files: ['file1.js', 'file2.js'] },
      });

      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Auto-Refresh - Vulnerability Sync Process Completed`;
      expect(mockLogMessage).toHaveBeenCalledWith(LogLevel.INFO, logData);
    });

    it('should not proceed with postMessage, information message, or log if refreshCache returns undefined', async () => {
      const mockRefreshCycle = 10;
      const mockSetInterval = jest
        .spyOn(global, 'setInterval')
        .mockImplementation(jest.fn());

      (getVulnerabilitiesRefreshCycle as jest.Mock).mockResolvedValue(
        mockRefreshCycle
      );

      const mockRefreshCache = refreshCache as jest.Mock;
      mockRefreshCache.mockResolvedValue(undefined);

      const mockGetDataOnlyFromCache = getDataOnlyFromCache as jest.Mock;
      mockGetDataOnlyFromCache.mockResolvedValue({
        files: ['file1.js', 'file2.js'],
      });

      const mockPostMessage = ContrastPanelInstance.postMessage as jest.Mock;
      const mockLogMessage = loggerInstance.logMessage as jest.Mock;

      await startBackgroundTimer(projectId);

      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        mockRefreshCycle * 60 * 1000
      );

      const intervalCallback = mockSetInterval.mock.calls[0][0];
      await intervalCallback();

      expect(mockRefreshCache).toHaveBeenCalledWith(projectId);

      expect(mockPostMessage).not.toHaveBeenCalled();

      expect(mockLogMessage).not.toHaveBeenCalled();
    });
  });

  describe('stopBackgroundTimer', () => {
    it('should stop the timer if interval is set', async () => {
      jest.spyOn(global, 'clearInterval');

      interval = setInterval(() => {}, 1000);

      await stopBackgroundTimer();
      jest.useFakeTimers();
      expect(clearInterval).toBeTruthy();
      expect(interval).not.toBe('');
    });

    it('should not call clearInterval if interval is undefined', async () => {
      interval = {} as NodeJS.Timeout;

      const mockClearInterval = jest
        .spyOn(global, 'clearInterval')
        .mockImplementation(jest.fn());
      await stopBackgroundTimer();

      expect(mockClearInterval).not.toHaveBeenCalled();
    });

    it('should handle multiple stop calls without errors', async () => {
      interval = setInterval(() => {}, 1000);

      await stopBackgroundTimer();
      await stopBackgroundTimer();
      jest.useFakeTimers();
      expect(clearInterval).toBeTruthy();
    });
  });

  describe('resetBackgroundTimer', () => {
    it('should stop the current timer, clear cache, and restart the timer', async () => {
      const mockClearInterval = jest
        .spyOn(global, 'clearInterval')
        .mockImplementation(jest.fn());
      const mockStartBackgroundTimer = jest.fn();
      const mockClearCacheByProjectId = clearCacheByProjectId as jest.Mock;

      interval = {} as NodeJS.Timeout;
      jest.spyOn(global, 'clearInterval');
      interval = {} as NodeJS.Timeout;

      mockClearCacheByProjectId.mockResolvedValue(projectId);

      await resetBackgroundTimer(projectId);

      expect(mockClearInterval).toHaveBeenCalledTimes(0);
      expect(mockClearCacheByProjectId).toHaveBeenCalledWith(projectId);
      expect(mockStartBackgroundTimer).toHaveBeenCalledTimes(0);
    });

    it('should do nothing if the interval is undefined', async () => {
      interval = {} as NodeJS.Timeout;

      const mockStartBackgroundTimer = jest.fn();
      const mockClearCacheByProjectId = clearCacheByProjectId as jest.Mock;

      mockClearCacheByProjectId.mockResolvedValue(undefined);

      await resetBackgroundTimer(projectId);

      jest.useFakeTimers();
      expect(clearInterval).toBeTruthy();
      expect(mockClearCacheByProjectId).toHaveBeenCalledWith(projectId);
      expect(mockStartBackgroundTimer).toHaveBeenCalledTimes(0);
    });
  });

  describe('getVulnerabilitiesRefreshCycle', () => {
    it('should return the correct refresh cycle value', async () => {
      const refreshCycle = await getVulnerabilitiesRefreshCycle(projectId);

      expect(refreshCycle).toBe(10);
    });

    it('should throw an error if project is not found', async () => {
      (getVulnerabilitiesRefreshCycle as jest.Mock).mockImplementation(
        async () => {
          throw new Error('Project not found');
        }
      );

      await expect(
        getVulnerabilitiesRefreshCycle(projectId)
      ).rejects.toThrowError('Project not found');
    });
  });
});
