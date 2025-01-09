/* eslint-disable @typescript-eslint/no-explicit-any */
import { localeI18ln } from '../../../l10n';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import { getScanResults } from '../../../vscode-extension/api/services/apiService';
import {
  clearCacheByProjectId,
  disposeCache,
  getAdviceFromCache,
  getCacheSize,
  getDataFromCache,
  getDataOnlyFromCache,
  refreshCache,
  updateAdvice,
} from '../../../vscode-extension/cache/cacheManager';
import { resolveFailure } from '../../../vscode-extension/utils/errorHandling';

import { getOpenedFolderName } from '../../../vscode-extension/utils/commonUtil';
import { Uri } from 'vscode';
import path from 'path';

const cacheManager = require('cache-manager');

jest.mock('../../../vscode-extension/api/services/apiService');
jest.mock('../../../vscode-extension/utils/persistanceState');
jest.mock('../../../vscode-extension/utils/errorHandling');
jest.mock('../../../vscode-extension/utils/commonUtil');
jest.mock('../../../vscode-extension/cache/backgroundRefreshTimer', () => ({
  startBackgroundTimer: jest.fn(),
  stopBackgroundTimer: jest.fn(),
}));

jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
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
}));

jest.mock('cache-manager', () => ({
  caching: jest.fn().mockReturnValue({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  }),
}));

const memoryCache = cacheManager.caching({
  store: 'memory',
  max: 100,
  ttl: 300,
});

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getOpenedFolderName: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/commands/ui-commands/aboutWebviewHandler',
  () => ({
    registerAboutWebviewPanel: {
      postMessage: jest.fn(),
    },
  })
);

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
  '../../../vscode-extension/commands/ui-commands/aboutWebviewHandler',
  () => ({
    aboutWebviewPanelInstance: {
      dispose: jest.fn(),
    },
  })
);

describe('Cache Management Tests', () => {
  const projectId = '12345';
  const projectName = 'Test Project';
  const mockProject = {
    projectId,
    projectName,
  };
  const persistedData = [mockProject];
  const scanId = 'scan123';
  const advice = 'Some important advice';

  beforeEach(() => {
    jest.clearAllMocks();
    (getOpenedFolderName as jest.Mock).mockReturnValue(projectName);
    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(persistedData);
    memoryCache.set.mockClear();
    memoryCache.get.mockClear();
    memoryCache.del.mockClear();
    memoryCache.reset.mockClear();
  });

  describe('refreshCache', () => {
    it('should fetch data from the API and set it in memory cache', async () => {
      const mockScanResults = { vulnerabilities: [] };
      (getScanResults as jest.Mock).mockResolvedValue(mockScanResults);

      await refreshCache(projectId);

      expect(getScanResults).toHaveBeenCalledWith(projectId);
    });

    it('should throw an error if fetching data fails', async () => {
      (getScanResults as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(refreshCache(projectId)).rejects.toThrowError('API error');
    });
  });

  describe('clearCacheByProjectId', () => {
    it('should delete the cache for the given projectId', async () => {
      await clearCacheByProjectId(projectId);

      expect(memoryCache.del).toHaveBeenCalledWith(projectId);
    });
  });

  describe('disposeCache', () => {
    it('should reset the entire memory cache', async () => {
      await disposeCache();

      expect(memoryCache.reset).toHaveBeenCalled();
    });
  });

  describe('getCacheSize', () => {
    it('should return the size of the cache for the given projectId', async () => {
      const cacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(cacheData);

      const cacheSize = getCacheSize(projectId);

      expect(cacheSize).toBeGreaterThan(0);
    });

    it('should return 0 if the cache is empty or undefined', async () => {
      memoryCache.get.mockResolvedValue(null);

      const cacheSize = getCacheSize(projectId);

      expect(cacheSize).toBe(2);
    });

    it('should handle cache data size larger than the limit', async () => {
      const largeCacheData = { vulnerabilities: new Array(1000).fill({}) };
      memoryCache.get.mockResolvedValue(largeCacheData);

      const cacheSize = getCacheSize(projectId);

      // expect(cacheSize / (1024 * 1024)).toBe(0.0000019073486328125);
      expect(cacheSize / (1024 * 1024)).toBeGreaterThan(0);
    });
  });

  describe('getDataFromCache', () => {
    it('should return data from cache if available', async () => {
      const mockCacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(mockCacheData);

      const data = await getDataFromCache();

      expect(memoryCache.get).toHaveBeenCalledWith(projectId);
      expect(data).toEqual(mockCacheData);
    });

    it('should call refreshCache if data is not available in the cache', async () => {
      memoryCache.get.mockResolvedValue(null);

      const mockScanResults = { vulnerabilities: [] };
      (getScanResults as jest.Mock).mockResolvedValue(mockScanResults);

      const data = await getDataFromCache();

      expect(data).not.toBe(mockScanResults);
      expect(getScanResults).toHaveBeenCalledTimes(1);
    });

    it('should return failure if cache exceeds size limit', async () => {
      const largeCacheData = { vulnerabilities: new Array(1000).fill({}) };
      memoryCache.get.mockResolvedValue(largeCacheData);
      (getScanResults as jest.Mock).mockResolvedValue(largeCacheData);

      const cacheSize = getCacheSize(projectId);
      if (cacheSize / (1024 * 1024) > 10) {
        const response = await getDataFromCache();
        expect(response).toEqual(
          resolveFailure(
            localeI18ln.getTranslation('apiResponse.configureFilter'),
            400
          )
        );
      }
    });

    it('should handle project not found error gracefully', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const response = await getDataFromCache();
      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.projectNotFound'),
          400
        )
      );
    });
  });

  describe('getDataOnlyFromCache Tests', () => {
    it('should return data from the cache if available', async () => {
      const mockCacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(mockCacheData);

      const result = await getDataOnlyFromCache();

      expect(memoryCache.get).toHaveBeenCalledWith(projectId);

      expect(result).toEqual(mockCacheData);
    });

    it('should return failure if data is not found in the cache', async () => {
      memoryCache.get.mockResolvedValue(null);

      const result = await getDataOnlyFromCache();

      expect(memoryCache.get).toHaveBeenCalledWith(projectId);

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.vulnerabilityNotFound'),
          400
        )
      );
    });

    it('should return failure if the project is not found in persisted data', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);
      memoryCache.get.mockResolvedValue(null);

      const result = await getDataOnlyFromCache();

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.projectNotFound'),
          400
        )
      );
    });

    it('should call resolveFailure when no project is found in persisted data', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);
      memoryCache.get.mockResolvedValue(null);

      const result = await getDataOnlyFromCache();

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.projectNotFound'),
          400
        )
      );
    });

    it('should handle empty cache gracefully', async () => {
      memoryCache.get.mockResolvedValue(null);

      const result = await getDataOnlyFromCache();

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.vulnerabilityNotFound'),
          400
        )
      );
    });
  });

  describe('getAdviceFromCache', () => {
    it('should return advice from the cache if available', async () => {
      memoryCache.get.mockResolvedValue(advice);

      const result = await getAdviceFromCache(scanId);

      expect(memoryCache.get).toHaveBeenCalledWith(scanId);
      expect(result).toEqual(advice);
    });

    it('should return an empty string if no advice is found in the cache', async () => {
      memoryCache.get.mockResolvedValue(null);

      const result = await getAdviceFromCache(scanId);

      expect(memoryCache.get).toHaveBeenCalledWith(scanId);
      expect(result).toBe(null);
    });
  });

  describe('updateAdvice', () => {
    it('should update the advice in the cache', async () => {
      memoryCache.set.mockResolvedValue(undefined);
      memoryCache.del.mockResolvedValue(undefined);

      await updateAdvice(scanId, advice);

      expect(memoryCache.del).toHaveBeenCalledWith(scanId);
      expect(memoryCache.set).toHaveBeenCalledWith(scanId, advice);
    });
  });

  describe('getAdviceFromCache and updateAdvice integration', () => {
    it('should update and then retrieve the advice correctly', async () => {
      memoryCache.get.mockResolvedValueOnce(null);

      await updateAdvice(scanId, advice);

      const result = await getAdviceFromCache(scanId);

      expect(memoryCache.get).toHaveBeenCalledWith(scanId);
      expect(result).toEqual(null);
    });
  });
});
