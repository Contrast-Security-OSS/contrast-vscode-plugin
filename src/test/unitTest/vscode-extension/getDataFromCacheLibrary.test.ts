/* eslint-disable @typescript-eslint/no-explicit-any */
import { getLibraryVulnerabilities } from '../../../vscode-extension/api/services/apiService';
import { getDataFromCacheLibrary } from '../../../vscode-extension/cache/cacheManager';
import { Uri } from 'vscode';
import path from 'path';

jest.mock('vscode', () => {
  const UIKind = { Desktop: 1, Web: 2 };
  return {
    UIKind,
    env: {
      language: 'en',
      appName: 'VSCode',
      uiKind: UIKind.Desktop,
    },
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
      onDidChangeConfiguration: jest.fn(),
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
  };
});

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

jest.mock('../../../vscode-extension/utils/encryptDecrypt', () => ({
  encrypt: jest.fn((key) => `encrypted-${key}`),
  decrypt: jest.fn(),
}));

jest.mock('../../../vscode-extension/api/services/apiService');

describe('getDataFromCacheLibrary', () => {
  const mockRequestBody = { appId: '123' } as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return data from cache if available', async () => {
    (memoryCache.get as jest.Mock).mockResolvedValueOnce({ cached: true });

    const result = await getDataFromCacheLibrary(mockRequestBody);

    expect(memoryCache.get).toHaveBeenCalledWith('library-123');
    expect(result).toEqual({
      code: 200,
      responseData: { cached: true },
      message: 'Cache fetched Successfully',
      status: 'success',
    });
    expect(getLibraryVulnerabilities).not.toHaveBeenCalled();
    expect(memoryCache.set).not.toHaveBeenCalled();
  });

  it('should call getLibraryVulnerabilities and cache result if not in cache', async () => {
    const apiResponse = {
      status: 'failure',
      code: 400,
      message: "Sorry we can't find the Vulnerabilities for this project.",
      responseData: null,
    };

    (memoryCache.get as jest.Mock)
      .mockResolvedValueOnce(null) // Initial cache miss
      .mockResolvedValueOnce(apiResponse); // Cache hit after set

    const result = await getDataFromCacheLibrary(mockRequestBody);

    expect(memoryCache.get).toHaveBeenCalledWith('library-123');

    expect(result).toEqual(apiResponse);
  });
});
