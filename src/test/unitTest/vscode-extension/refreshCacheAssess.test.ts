/* eslint-disable @typescript-eslint/no-explicit-any */
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import { getAssessVulnerabilities } from '../../../vscode-extension/api/services/apiService';
import { refreshCacheAssess } from '../../../vscode-extension/cache/cacheManager';

import { Uri } from 'vscode';
import path from 'path';

import { ShowErrorPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';

const cacheManager = require('cache-manager');

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  getAssessVulnerabilities: jest.fn(),
}));
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
    it('should fetch data from the API and set it in memory cache', async () => {
      const mockScanResults = { vulnerabilities: [] };
      (getAssessVulnerabilities as jest.Mock).mockResolvedValue(
        mockScanResults
      );

      await refreshCacheAssess(requestParams, params);

      expect(getAssessVulnerabilities).toHaveBeenCalledWith(
        requestParams,
        params
      );
    });

    it('should fetch data from the API and set it in memory cache', async () => {
      const mockScanResults = { code: 200, vulnerabilities: [] }; // Mocked successful API response

      (getAssessVulnerabilities as jest.Mock).mockResolvedValue(
        mockScanResults
      );

      (memoryCache.set as jest.Mock).mockResolvedValue(true);

      const result = await refreshCacheAssess(requestParams, params);

      expect(getAssessVulnerabilities).toHaveBeenCalledWith(
        requestParams,
        params
      );

      expect(memoryCache.set).toHaveBeenCalledWith(
        'assess-' + requestParams.appId,
        mockScanResults
      );
      expect(memoryCache.set).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockScanResults);
    });

    it('should reset cache and return undefined if API response code is not 200', async () => {
      const mockErrorResponse = { code: 500, message: 'Error' }; // Mocked error response

      (getAssessVulnerabilities as jest.Mock).mockResolvedValue(
        mockErrorResponse
      );

      (memoryCache.reset as jest.Mock).mockResolvedValue(true);

      const result = await refreshCacheAssess(requestParams, params);

      expect(memoryCache.reset).toHaveBeenCalledTimes(1);

      expect(result).toBeUndefined();
    });
  });
});
