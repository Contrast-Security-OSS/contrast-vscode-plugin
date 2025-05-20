/* eslint-disable @typescript-eslint/no-explicit-any */
import { localeI18ln } from '../../../l10n';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import {
  getProjectById,
  getScanResults,
} from '../../../vscode-extension/api/services/apiService';
import {
  getCacheSize,
  getDataFromCache,
  refreshCache,
} from '../../../vscode-extension/cache/cacheManager';
import { resolveFailure } from '../../../vscode-extension/utils/errorHandling';

import { getOpenedFolderName } from '../../../vscode-extension/utils/commonUtil';
import { Uri } from 'vscode';
import path from 'path';
import { stopBackgroundTimerAssess } from '../../../vscode-extension/cache/backgroundRefreshTimerAssess';
import {
  ShowErrorPopup,
  ShowInformationPopup,
} from '../../../vscode-extension/commands/ui-commands/messageHandler';

import {
  startBackgroundTimer,
  stopBackgroundTimer,
} from '../../../vscode-extension/cache/backgroundRefreshTimer';

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  getScanResults: jest.fn(),
  getProjectById: jest.fn(),
  getOrganisationName: jest.fn(),
  getApplicationById: jest.fn(),
}));

jest.mock('../../../vscode-extension/cache/cacheManager', () => ({
  ...jest.requireActual('../../../vscode-extension/cache/cacheManager'),
  refreshCache: jest.fn(),
  getCacheSize: jest.fn(),
}));

jest.mock('../../../vscode-extension/utils/persistanceState');
jest.mock('../../../vscode-extension/utils/errorHandling');
jest.mock('../../../vscode-extension/utils/commonUtil');
jest.mock('../../../vscode-extension/cache/backgroundRefreshTimer', () => ({
  startBackgroundTimer: jest.fn(),
  stopBackgroundTimer: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/cache/backgroundRefreshTimerAssess',
  () => ({
    startBackgroundTimerAssess: jest.fn(),
    stopBackgroundTimerAssess: jest.fn(),
  })
);

jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
  },
  window: {
    activeTextEditor: {
      document: {
        fileName: 'test.js',
      },
    },
    showErrorMessage: jest.fn(),
    ShowErrorPopup: jest.fn(),
    showInformationMessage: jest.fn(),
  },
  TreeItem: class {
    [x: string]: { dark: Uri; light: Uri };
    constructor(
      label: { dark: Uri; light: Uri },
      command: any = null,
      icon: any = null
    ) {
      this.label = label;
      if (command !== null) {
        this.command = {
          title: label,
          command: command,
        } as any;
      }
      if (icon !== null) {
        const projectRoot = path.resolve(__dirname, '..');
        const iconPath = Uri.file(path.join(projectRoot, 'assets', icon));
        this.iconPath = {
          dark: iconPath,
          light: iconPath,
        };
      }
    }
  },
  Uri: {
    file: jest.fn().mockReturnValue('mockUri'),
  },
  commands: {
    registerCommand: jest.fn(),
  },
  languages: {
    registerHoverProvider: jest.fn(),
  },
}));

jest.mock('cache-manager', () => ({
  caching: jest.fn().mockReturnValue({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  }),
  clearCacheByProjectId: jest.fn(),
  refreshCache: jest.fn(),
  getCacheSize: jest.fn(),
}));
const cacheManager = require('cache-manager');
const memoryCache = cacheManager.caching({
  store: 'memory',
  max: 100,
  ttl: 300,
});

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getOpenedFolderName: jest.fn(),
  getCacheFilterData: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/commands/ui-commands/openActivityBar',
  () => ({
    registerContrastActivityBar: {
      postMessage: jest.fn(),
    },
  })
);

jest.mock('../../../vscode-extension/utils/toggleContrastPanel', () => ({
  toggleContrastPanel: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      onChangeScreen: jest.fn(),
    },
  })
);

jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => ({
    GetAssessFilter: jest.fn(),
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopupWithOptions: jest.fn(),
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
  })
);

const mockedShowErrorPopup = ShowErrorPopup as jest.MockedFunction<
  typeof ShowErrorPopup
>;

jest.mock('../../../vscode-extension/utils/encryptDecrypt', () => ({
  encrypt: jest.fn((key) => `encrypted-${key}`),
  decrypt: jest.fn(),
}));

describe('Cache Management Tests', () => {
  const projectId = '12345';

  const projectName = 'Test Project';
  const source = 'scan';
  const mockProject = {
    projectId,
    projectName,
    source,
  };
  const persistedData = [mockProject];

  beforeEach(() => {
    jest.clearAllMocks();
    (getOpenedFolderName as jest.Mock).mockReturnValue(projectName);
    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(persistedData);
    memoryCache.set.mockClear();
    memoryCache.get.mockClear();
    memoryCache.del.mockClear();
    memoryCache.reset.mockClear();
    mockedShowErrorPopup.mockReset();
  });

  describe('refreshCache', () => {
    it('should fetch data from the API and set it in memory cache', async () => {
      const mockScanResults = { vulnerabilities: [] };
      (getScanResults as jest.Mock).mockResolvedValue(mockScanResults);
      (memoryCache.set as jest.Mock).mockResolvedValue(undefined);
      await refreshCache(projectId);

      expect(getScanResults).toHaveBeenCalledTimes(0);
    });

    it('should store API data in memory cache when code is 200', async () => {
      const mockApiResponse = {
        code: 200,
        vulnerabilities: ['vuln1', 'vuln2'],
      };

      (getScanResults as jest.Mock).mockResolvedValue(mockApiResponse);
      (memoryCache.set as jest.Mock).mockResolvedValue(undefined);

      await refreshCache(projectId);

      expect(getScanResults).toHaveBeenCalledTimes(0);
      expect(memoryCache.set).toHaveBeenCalledTimes(0);
    });

    it('should handle archived project by showing error and clearing cache', async () => {
      (getProjectById as jest.Mock).mockResolvedValue(false);

      await getDataFromCache();

      expect(ShowErrorPopup).toHaveBeenCalledWith(
        localeI18ln.getTranslation('apiResponse.ARCHIVED')
      );
      expect(stopBackgroundTimer).toHaveBeenCalled();
    });

    it('should handle archived applications by showing info and clearing cache', async () => {
      (getProjectById as jest.Mock).mockResolvedValue(true);
      (memoryCache.get as jest.Mock).mockResolvedValue({
        applications: [{ id: 'app1', archived: true }],
      });

      await getDataFromCache();

      expect(ShowInformationPopup).toHaveBeenCalledWith(
        localeI18ln.getTranslation('apiResponse.ARCHIVED')
      );
      expect(stopBackgroundTimerAssess).toHaveBeenCalled();
      expect(memoryCache.reset).toHaveBeenCalled();
    });

    it('should refresh cache and start background timer when cache is empty', async () => {
      const projectId = '12345';
      const mockPersistedProject = {
        projectId,
        projectName: 'Test Project',
        source: 'scan',
      };

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([
        mockPersistedProject,
      ]);
      (getProjectById as jest.Mock).mockResolvedValue(true);
      (memoryCache.get as jest.Mock).mockResolvedValue(undefined);
      (refreshCache as jest.Mock).mockResolvedValue({ applications: [] });
      (memoryCache.get as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ applications: [] });
      (getCacheSize as jest.Mock).mockReturnValue(5 * 1024 * 1024); // 5MB under threshold

      await getDataFromCache();

      expect(stopBackgroundTimer).toHaveBeenCalled();
      expect(memoryCache.reset).toHaveBeenCalled();
      expect(startBackgroundTimer).toHaveBeenCalledWith(projectId);
    });

    it('should return error if cache size exceeds 10MB', async () => {
      const projectId = '12345';
      const mockPersistedProject = {
        projectId,
        projectName: 'Test Project',
        source: 'scan',
      };

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([
        mockPersistedProject,
      ]);
      (getProjectById as jest.Mock).mockResolvedValue(true);
      (memoryCache.get as jest.Mock).mockResolvedValue(undefined);
      (refreshCache as jest.Mock).mockResolvedValue({});
      (getCacheSize as jest.Mock).mockReturnValue(11 * 1024 * 1024); // 11MB, over limit

      const result = await getDataFromCache();

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.configureFilter'),
          400
        )
      );
    });

    it('should trigger cache refresh when isManual is true', async () => {
      const projectId = '12345';
      const mockPersistedProject = {
        projectId,
        projectName: 'Test Project',
        source: 'scan',
      };

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([
        mockPersistedProject,
      ]);
      (getProjectById as jest.Mock).mockResolvedValue(true);
      (memoryCache.get as jest.Mock).mockResolvedValueOnce({
        applications: [],
      });
      (refreshCache as jest.Mock).mockResolvedValue({ applications: [] });
      (getCacheSize as jest.Mock).mockReturnValue(5 * 1024 * 1024);
      (memoryCache.get as jest.Mock).mockResolvedValueOnce({
        applications: [],
      });

      await getDataFromCache(true);

      expect(stopBackgroundTimer).toHaveBeenCalled();
      expect(memoryCache.reset).toHaveBeenCalled();
      expect(startBackgroundTimer).toHaveBeenCalledWith(projectId);
    });
  });
});
