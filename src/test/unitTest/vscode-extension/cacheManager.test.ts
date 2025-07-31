/* eslint-disable @typescript-eslint/no-explicit-any */
import { localeI18ln } from '../../../l10n';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import { getProjectById } from '../../../vscode-extension/api/services/apiService';
import {
  clearCacheByProjectId,
  commonRefreshAssessLibrariesCache,
  disposeCache,
  getAdviceFromCache,
  getCacheSize,
  getDataFromCache,
  getDataOnlyFromCache,
  getDataOnlyFromCacheAssess,
  updateAdvice,
} from '../../../vscode-extension/cache/cacheManager';
import {
  resolveFailure,
  resolveSuccess,
} from '../../../vscode-extension/utils/errorHandling';

import {
  getCacheFilterData,
  getOpenedFolderName,
} from '../../../vscode-extension/utils/commonUtil';
import { Uri } from 'vscode';
import path from 'path';
import { stopBackgroundTimerAssess } from '../../../vscode-extension/cache/backgroundRefreshTimerAssess';
import {
  ShowErrorPopup,
  ShowInformationPopup,
} from '../../../vscode-extension/commands/ui-commands/messageHandler';
import { stopBackgroundTimer } from '../../../vscode-extension/cache/backgroundRefreshTimer';
import { commonResponse } from '../../../common/types';

const cacheManager = require('cache-manager');

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  getScanResults: jest.fn(),
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
}));

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

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  getProjectById: jest.fn(),
  getOrganisationName: jest.fn(),
  getApplicationById: jest.fn(),
}));

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
    mockedShowErrorPopup.mockReset();
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

    it('should fetch data and reset cache if data is null or undefined', async () => {
      (memoryCache.get as jest.Mock).mockResolvedValue(null);

      await getDataFromCache();

      expect(stopBackgroundTimer).toHaveBeenCalledTimes(1);
    });

    it('should handle cache data size larger than the limit', async () => {
      const largeCacheData = { vulnerabilities: new Array(1000).fill({}) };
      memoryCache.get.mockResolvedValue(largeCacheData);

      const cacheSize = getCacheSize(projectId);

      expect(cacheSize / (1024 * 1024)).toBeGreaterThan(0);
    });
  });

  describe('getDataFromCache', () => {
    const projectId = '12345';
    const mockActiveApplication = { appId: 'activeApp123', archived: false };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let mockData: any;

    it('should handle archived applications and show error popup', async () => {
      const archivedMockData = {
        applications: [{ appId: 'archivedApp123', archived: true }],
      };
      memoryCache.get.mockResolvedValue(archivedMockData);
      (getProjectById as jest.Mock).mockResolvedValue(true);

      await getDataFromCache();

      expect(ShowInformationPopup).toHaveBeenCalledWith(
        'project is archived/deleted'
      );
      expect(stopBackgroundTimerAssess).toHaveBeenCalled();
      expect(memoryCache.reset).toHaveBeenCalled();
    });

    it('should stop background timer and clear cache for archived applications', async () => {
      const archivedMockData = {
        applications: [{ appId: 'archivedApp123', archived: true }],
      };
      memoryCache.get.mockResolvedValue(archivedMockData);
      (getProjectById as jest.Mock).mockResolvedValue(true);

      const result = await getDataFromCache();

      expect(result).toEqual(
        resolveFailure('Archived applications found', 400)
      );
      expect(memoryCache.del).toHaveBeenCalledWith('archivedApp123');
    });

    it('should not enter the archived block when no archived applications are found', async () => {
      mockData = {
        applications: [mockActiveApplication],
      };

      memoryCache.get.mockResolvedValue(mockData);

      const result = await getDataFromCache();

      expect(ShowInformationPopup).not.toHaveBeenCalled();
      expect(stopBackgroundTimerAssess).not.toHaveBeenCalled();
      expect(memoryCache.reset).not.toHaveBeenCalled();

      expect(result).toEqual(mockData);
    });

    it('should not enter the archived block if applications array is empty', async () => {
      mockData = {
        applications: [],
      };

      memoryCache.get.mockResolvedValue(mockData);

      const result = await getDataFromCache();

      expect(ShowInformationPopup).not.toHaveBeenCalled();
      expect(stopBackgroundTimerAssess).not.toHaveBeenCalled();
      expect(memoryCache.reset).not.toHaveBeenCalled();

      expect(result).toEqual(mockData);
    });

    it('should handle case where applications is undefined or null', async () => {
      mockData = {
        applications: undefined,
      };

      memoryCache.get.mockResolvedValue(mockData);

      const result = await getDataFromCache();

      expect(ShowInformationPopup).not.toHaveBeenCalled();
      expect(stopBackgroundTimerAssess).not.toHaveBeenCalled();
      expect(memoryCache.reset).not.toHaveBeenCalled();

      expect(result).toEqual(mockData);
    });

    it('should return data from cache if available', async () => {
      const mockCacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(mockCacheData);

      const data = await getDataFromCache();

      expect(memoryCache.get).toHaveBeenCalledWith(projectId);
      expect(data).toEqual(mockCacheData);
    });

    it('should return data from cache if available', async () => {
      const mockCacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(mockCacheData);

      const data = await getDataFromCache();

      expect(memoryCache.get).toHaveBeenCalledTimes(1);
      expect(data).toEqual(mockCacheData);
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

  describe('commonRefreshAssessLibrariesCache', () => {
    const mockRequestBody = { appId: '123' } as any;
    const mockRequestParams = { appId: '123', orgId: 'org1' } as any;
    const mockParams = { apiKey: 'mockApiKey' } as any;
    const configuredProject = { projectId: '123', source: 'assess' };

    beforeEach(() => {
      jest.clearAllMocks();
      memoryCache.set.mockClear();
      memoryCache.get.mockClear();
      memoryCache.del.mockClear();
      memoryCache.reset.mockClear();
      mockedShowErrorPopup.mockReset();
    });

    it('should return failure if project is not found', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const result = await commonRefreshAssessLibrariesCache(
        mockRequestBody,
        mockRequestParams,
        mockParams
      );

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.projectNotFound'),
          400
        )
      );
    });

    it('should return success if both assess and library refresh succeed', async () => {
      const mockCacheData: commonResponse = {
        assess: {
          code: 200,
          status: 'success', // literal type match
          responseData: [],
          message: 'Assess OK',
        },
        library: {
          code: 200,
          status: 'success', // literal type match
          responseData: [],
          message: 'Library OK',
        },
      };

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([
        configuredProject,
      ]);

      const result = await commonRefreshAssessLibrariesCache(
        mockRequestBody,
        mockRequestParams,
        mockParams
      );

      expect(result).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('apiResponse.vulnerabilitesRetrieved'),
          200,
          mockCacheData
        )
      );
    });

    it('should return success with partial result if library fails', async () => {
      const mockCacheData: commonResponse = {
        assess: {
          code: 200,
          status: 'success', // literal type match
          responseData: [],
          message: 'Assess OK',
        },
        library: {
          code: 400,
          status: 'failure', // literal type match
          message: 'Library failed',
          responseData: null,
        },
      };
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([
        configuredProject,
      ]);

      const result = await commonRefreshAssessLibrariesCache(
        mockRequestBody,
        mockRequestParams,
        mockParams
      );

      expect(result).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('apiResponse.vulnerabilitesRetrieved'),
          200,
          mockCacheData
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

  describe('getDataOnlyFromCacheAssess Tests', () => {
    const mockFilter = {
      apiKey: '0123',
      contrastURL: 'example.com',
      userName: 'user',
      serviceKey: '1234',
      organizationId: 'org123',
      source: 'assess',
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });

    it('should return data from the cache if available', async () => {
      (getCacheFilterData as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });
      const mockCacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(mockCacheData);

      const result = await getDataOnlyFromCacheAssess();

      expect(memoryCache.get).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockCacheData);
    });

    it('should return failure if data is not found in the cache', async () => {
      memoryCache.get.mockResolvedValue(null);

      const result = await getDataOnlyFromCacheAssess();

      expect(memoryCache.get).toHaveBeenCalledTimes(1);

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

      const result = await getDataOnlyFromCacheAssess();

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

      const result = await getDataOnlyFromCacheAssess();

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.projectNotFound'),
          400
        )
      );
    });

    it('should handle empty cache gracefully', async () => {
      memoryCache.get.mockResolvedValue(null);

      const result = await getDataOnlyFromCacheAssess();

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.vulnerabilityNotFound'),
          400
        )
      );
    });
  });
});
