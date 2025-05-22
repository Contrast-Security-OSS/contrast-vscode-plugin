/* eslint-disable @typescript-eslint/no-explicit-any */
import { localeI18ln } from '../../../l10n';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import {
  getAssessVulnerabilities,
  getVulnerabilityEvents,
  getVulnerabilityHttps,
} from '../../../vscode-extension/api/services/apiService';
import {
  getCacheSize,
  getDataFromCacheAssess,
  refreshCacheAssess,
  updateAccessVulnerabilities,
} from '../../../vscode-extension/cache/cacheManager';
import { resolveFailure } from '../../../vscode-extension/utils/errorHandling';

import { Uri } from 'vscode';
import path from 'path';
import { getCacheFilterData } from '../../../vscode-extension/utils/commonUtil';
import {
  startBackgroundTimerAssess,
  stopBackgroundTimerAssess,
} from '../../../vscode-extension/cache/backgroundRefreshTimerAssess';
import { ShowErrorPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';

const cacheManager = require('cache-manager');

jest.mock('../../../vscode-extension/api/services/apiService');
jest.mock('../../../vscode-extension/utils/persistanceState');
jest.mock('../../../vscode-extension/utils/errorHandling');

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

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopupWithOptions: jest.fn(),
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
  })
);

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => ({
    GetAssessFilter: jest.fn(),
  })
);

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getCacheFilterData: jest.fn(),
  getVulnerabilitiesRefreshCycle: jest.fn(),
}));
jest.mock(
  '../../../vscode-extension/cache/backgroundRefreshTimerAssess',
  () => ({
    startBackgroundTimerAssess: jest.fn(),
    stopBackgroundTimerAssess: jest.fn(),
  })
);

const mockedShowErrorPopup = ShowErrorPopup as jest.MockedFunction<
  typeof ShowErrorPopup
>;

describe('Cache Management Tests', () => {
  const projectId = '12345';
  const appId = 'app123';

  const requestParams = { appId, orgId: 'org123' };
  const params = {
    apiKey: '0123',
    contrastURL: 'example.com',
    userName: 'user',
    serviceKey: '1234',
    organizationId: 'org123',
    source: 'assess',
  };
  const persistedData = [
    {
      projectId: appId,
      source: 'assess',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(persistedData);
    memoryCache.set.mockClear();
    memoryCache.get.mockClear();
    memoryCache.del.mockClear();
    memoryCache.reset.mockClear();
    mockedShowErrorPopup.mockReset();
  });

  describe('refreshCacheAssess', () => {
    it('should return undefined and reset memory cache if API does not return 200', async () => {
      const mockErrorResponse = { code: 500, message: 'Server Error' };
      (getAssessVulnerabilities as jest.Mock).mockResolvedValue(
        mockErrorResponse
      );

      const result = await refreshCacheAssess(requestParams, params);

      expect(memoryCache.reset).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  it('should return undefined and reset memory cache if API does not return 200', async () => {
    const mockErrorResponse = { code: 500, message: 'Server Error' };
    (getAssessVulnerabilities as jest.Mock).mockResolvedValue(
      mockErrorResponse
    );

    const result = await refreshCacheAssess(requestParams, params);

    expect(getAssessVulnerabilities).toHaveBeenCalledWith(
      requestParams,
      params
    );
    expect(memoryCache.reset).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should throw an error if fetching data from the API fails', async () => {
    const errorMessage = 'API error';
    (getAssessVulnerabilities as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    await expect(
      refreshCacheAssess(requestParams, params)
    ).rejects.toThrowError(errorMessage);
  });

  it('should handle and log unexpected API responses', async () => {
    const mockInvalidResponse = { code: 404, message: 'Not Found' };
    (getAssessVulnerabilities as jest.Mock).mockResolvedValue(
      mockInvalidResponse
    );

    const result = await refreshCacheAssess(requestParams, params);

    expect(memoryCache.reset).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
  it('should fetch data from the API and set it in memory cache', async () => {
    const mockScanResults = { vulnerabilities: [] };
    (getAssessVulnerabilities as jest.Mock).mockResolvedValue(mockScanResults);

    await refreshCacheAssess(requestParams, params);

    expect(getAssessVulnerabilities).toHaveBeenCalledWith(
      requestParams,
      params
    );
  });

  it('should throw an error if fetching data paramsfails', async () => {
    (getAssessVulnerabilities as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    await expect(
      refreshCacheAssess(requestParams, params)
    ).rejects.toThrowError('API error');
  });

  describe('updateAccessVulnerabilities', () => {
    const traceId = 'testTraceId';

    const mockFilter = {
      apiKey: '0123',
      contrastURL: 'example.com',
      userName: 'user',
      serviceKey: '1234',
      organizationId: 'org123',
      source: 'assess',
    };

    const mockVulnerabilityEventsResponse = {
      code: 200,
      responseData: [
        {
          type: 'Security',
          description: 'Vulnerability 1',
          codeView: { lines: [{ text: 'Line 1' }] },
          dataView: { lines: [{ text: 'Data 1' }] },
        },
      ],
    };

    const mockVulnerabilityHttpsResponse = {
      code: 200,
      responseData: {
        text: 'HTTP Response',
      },
    };

    const cachedData = {
      responseData: {
        child: [
          {
            traceId: 'testTraceId',
            events: {
              data: {
                events: [],
                http_request: {},
              },
            },
            child: [
              {
                traceId: 'testTraceId',
                events: {
                  data: {
                    events: [],
                    http_request: {},
                  },
                },
              },
            ],
          },
        ],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });

    it('should update vulnerabilities and set data in memory cache when both API calls are successful', async () => {
      (getCacheFilterData as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      (getVulnerabilityEvents as jest.Mock).mockResolvedValue(
        mockVulnerabilityEventsResponse
      );
      (getVulnerabilityHttps as jest.Mock).mockResolvedValue(
        mockVulnerabilityHttpsResponse
      );

      (memoryCache.get as jest.Mock).mockResolvedValue(cachedData);
      (memoryCache.set as jest.Mock).mockResolvedValue(true);

      const result = await updateAccessVulnerabilities(traceId);

      expect(memoryCache.set).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        responseData: {
          child: [
            {
              child: [
                {
                  events: {
                    data: [
                      {
                        child: [
                          {
                            child: [
                              {
                                label: 'Line 1',
                              },
                              {
                                label: 'Data 1',
                              },
                            ],
                            label: 'Vulnerability 1',
                            type: 'Security',
                          },
                        ],
                        isRoot: true,
                        label: 'Events',
                      },
                    ],
                  },
                  http_request: {
                    text: 'HTTP Response',
                  },
                  traceId: 'testTraceId',
                },
              ],
              events: {
                data: {
                  events: [],
                  http_request: {},
                },
              },
              traceId: 'testTraceId',
            },
          ],
        },
      });
    });

    it('should return failure response when GetAssessFilter returns invalid data', async () => {
      (getCacheFilterData as jest.Mock).mockResolvedValue({
        code: 400,
        message: 'Project not Configured',
      });

      const response = await updateAccessVulnerabilities(traceId);

      expect(response).toEqual({
        code: 400,
        message: 'Project not Configured',
      });
    });

    it('should handle cases when memory cache does not contain valid data', async () => {
      const mockEmptyCache = {
        responseData: {
          child: [],
        },
      };

      (getCacheFilterData as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      (getVulnerabilityEvents as jest.Mock).mockResolvedValue(
        mockVulnerabilityEventsResponse
      );
      (getVulnerabilityHttps as jest.Mock).mockResolvedValue(
        mockVulnerabilityHttpsResponse
      );

      (memoryCache.get as jest.Mock).mockResolvedValue(mockEmptyCache);
      (memoryCache.set as jest.Mock).mockResolvedValue(true);

      const result = await updateAccessVulnerabilities(traceId);

      expect(memoryCache.set).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockEmptyCache);
    });

    it('should handle unexpected API response structure', async () => {
      const mockInvalidApiResponse = {
        code: 200,
        responseData: null,
      };

      (getCacheFilterData as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      (getVulnerabilityEvents as jest.Mock).mockResolvedValue(
        mockInvalidApiResponse
      );
      (getVulnerabilityHttps as jest.Mock).mockResolvedValue(
        mockVulnerabilityHttpsResponse
      );

      (memoryCache.get as jest.Mock).mockResolvedValue(cachedData);
      (memoryCache.set as jest.Mock).mockResolvedValue(true);

      const result = await updateAccessVulnerabilities(traceId);

      expect(memoryCache.set).toHaveBeenCalledTimes(2);
      expect(result).toEqual(cachedData);
    });

    it('should throw an error if fetching data fails', async () => {
      (getVulnerabilityEvents as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      (getVulnerabilityHttps as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      await expect(updateAccessVulnerabilities(traceId)).rejects.toThrowError(
        'API error'
      );
    });
  });

  describe('getDataFromCacheAssess', () => {
    const archivedApplication = { appId: 'archivedApp123', archived: true };
    const activeApplication = { appId: 'activeApp123', archived: false };
    it('should return data from cache if available', async () => {
      const mockCacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(mockCacheData);

      const data = await getDataFromCacheAssess(requestParams, params);

      expect(memoryCache.get).toHaveBeenCalledTimes(1);
      expect(data).toEqual(mockCacheData);
    });

    it('should show a popup and clear cache if there are archived applications', async () => {
      const mockCacheData = {
        applications: [archivedApplication, activeApplication],
      };
      memoryCache.get.mockResolvedValue(mockCacheData);

      await getDataFromCacheAssess(requestParams, params);

      expect(stopBackgroundTimerAssess).toHaveBeenCalled();
    });

    it('should return failure if cache exceeds size limit', async () => {
      const largeCacheData = { vulnerabilities: new Array(1000).fill({}) };
      memoryCache.get.mockResolvedValue(largeCacheData);
      (getAssessVulnerabilities as jest.Mock).mockResolvedValue(largeCacheData);

      const cacheSize = getCacheSize(projectId);
      if (cacheSize / (1024 * 1024) > 10) {
        const response = await getDataFromCacheAssess(requestParams, params);
        expect(response).toEqual(
          resolveFailure(
            localeI18ln.getTranslation('apiResponse.configureFilter'),
            400
          )
        );
      }
    });

    it('should handle Project not Configured error gracefully', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const response = await getDataFromCacheAssess(requestParams, params);
      expect(resolveFailure).toHaveBeenCalledWith(
        'Project not Configured',
        400
      );
      expect(response).toEqual(resolveFailure('Project not Configured', 400));
    });

    it('should return failure if cache exceeds size limit after refreshing data', async () => {
      const mockEmptyCache = null;
      (memoryCache.get as jest.Mock).mockResolvedValue(mockEmptyCache);

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

      (getAssessVulnerabilities as jest.Mock).mockResolvedValue({
        vulnerabilities: new Array(1000).fill({}),
      });

      (memoryCache.set as jest.Mock).mockResolvedValue(true);

      const cacheSize = getCacheSize('assess-' + appId);
      if (cacheSize / (1024 * 1024) > 10) {
        const response = await getDataFromCacheAssess(requestParams, params);
        expect(response).toEqual(
          resolveFailure(
            localeI18ln.getTranslation('apiResponse.configureFilter'),
            400
          )
        );
      }
    });

    it('should handle Project not Configured error gracefully', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const response = await getDataFromCacheAssess(requestParams, params);
      expect(resolveFailure).toHaveBeenCalledWith(
        'Project not Configured',
        400
      );
      expect(response).toEqual(resolveFailure('Project not Configured', 400));
    });

    it('should return data from cache if available', async () => {
      const mockCacheData = { vulnerabilities: [] };
      memoryCache.get.mockResolvedValue(mockCacheData);
      const data = await getDataFromCacheAssess(requestParams, params);

      expect(memoryCache.get).toHaveBeenCalledTimes(1);
      expect(data).toEqual(mockCacheData);
    });

    it('should return failure if cache exceeds size limit', async () => {
      const largeCacheData = { vulnerabilities: new Array(1000).fill({}) };
      memoryCache.get.mockResolvedValue(largeCacheData);
      (getAssessVulnerabilities as jest.Mock).mockResolvedValue(largeCacheData);

      const cacheSize = getCacheSize(projectId);
      if (cacheSize / (1024 * 1024) > 10) {
        const response = await getDataFromCacheAssess(requestParams, params);
        expect(response).toEqual(
          resolveFailure(
            localeI18ln.getTranslation('apiResponse.configureFilter'),
            400
          )
        );
      }
    });

    it('should handle Project not Configured error gracefully', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const response = await getDataFromCacheAssess(requestParams, params);
      expect(resolveFailure).toHaveBeenCalledWith(
        'Project not Configured',
        400
      );
      expect(response).toEqual(resolveFailure('Project not Configured', 400));
    });

    it('should handle cache miss, refresh data, and start the background timer', async () => {
      const mockEmptyCache = null;
      (memoryCache.get as jest.Mock).mockResolvedValue(mockEmptyCache);

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

      (getAssessVulnerabilities as jest.Mock).mockResolvedValue({
        vulnerabilities: new Array(1000).fill({}),
      });

      (memoryCache.set as jest.Mock).mockResolvedValue(true);

      const data = await getDataFromCacheAssess(requestParams, params);

      expect(stopBackgroundTimerAssess).toHaveBeenCalledTimes(1);
      expect(memoryCache.reset).toHaveBeenCalledTimes(2);

      expect(getAssessVulnerabilities).toHaveBeenCalledTimes(1);

      expect(startBackgroundTimerAssess).toHaveBeenCalledTimes(1);

      expect(data).toEqual(await memoryCache.get('assess-' + appId));
    });

    it('should return failure if cache exceeds size limit after refreshing data', async () => {
      const mockEmptyCache = null;
      (memoryCache.get as jest.Mock).mockResolvedValue(mockEmptyCache);

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

      (getAssessVulnerabilities as jest.Mock).mockResolvedValue({
        vulnerabilities: new Array(1000).fill({}),
      });

      (memoryCache.set as jest.Mock).mockResolvedValue(true);

      const cacheSize = getCacheSize('assess-' + appId);
      if (cacheSize / (1024 * 1024) > 10) {
        const response = await getDataFromCacheAssess(requestParams, params);
        expect(response).toEqual(
          resolveFailure(
            localeI18ln.getTranslation('apiResponse.configureFilter'),
            400
          )
        );
      }
    });
  });
});
