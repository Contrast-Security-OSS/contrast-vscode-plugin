/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateUsageDetails } from '../../../vscode-extension/cache/cacheManager';
import { getCacheFilterData } from '../../../vscode-extension/utils/commonUtil';
import { getUsageForLibVul } from '../../../vscode-extension/api/services/apiService';
import { Uri } from 'vscode';
import path from 'path';

const cacheManager = require('cache-manager');

jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  commands: {
    registerCommand: jest.fn(),
  },
  languages: {
    registerHoverProvider: jest.fn(),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
    onDidChangeConfiguration: jest.fn(),
  },
  window: {
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
}));

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getCacheFilterData: jest.fn(),
}));

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  getUsageForLibVul: jest.fn(),
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

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      onChangeScreen: jest.fn(),
    },
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
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

describe('updateUsageDetails', () => {
  const hashId = 'test-hash-id';
  const mockFilter = {
    apiKey: 'apiKey',
    contrastURL: 'https://contrast.com',
    userName: 'user',
    serviceKey: 'serviceKey',
    organizationId: 'org-id',
    source: 'assess',
    projectId: 'project-id',
  };

  const mockUsageData = {
    code: 200,
    responseData: {
      total: 1,
      observations: {
        name: 'org.dummy.engine',
        firstObservedTime: '2025-05-19T10:00:00Z',
        lastObservedTime: '2025-05-19T10:00:00Z',
      },
      id: '123123',
    },
  };

  const mockLibCache = {
    child: [
      {
        overview: {
          hash: 'test-hash-id',
        },
        usage: undefined,
      },
      {
        overview: {
          hash: 'other-hash-id',
        },
        usage: undefined,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    memoryCache.set.mockClear();
    memoryCache.get.mockClear();
    memoryCache.del.mockClear();
    memoryCache.reset.mockClear();
  });

  it('should update usage details and set updated cache', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockLibCache);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateUsageDetails(hashId);

    expect(getCacheFilterData).toHaveBeenCalled();
    expect(getUsageForLibVul).toHaveBeenCalledWith(
      mockFilter.projectId,
      hashId,
      {
        apiKey: mockFilter.apiKey,
        contrastURL: mockFilter.contrastURL,
        userName: mockFilter.userName,
        serviceKey: mockFilter.serviceKey,
        organizationId: mockFilter.organizationId,
        source: mockFilter.source,
      }
    );

    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      {
        child: [
          {
            overview: {
              hash: 'test-hash-id',
            },
            usage: mockUsageData.responseData,
          },
          {
            overview: {
              hash: 'other-hash-id',
            },
          },
        ],
      }
    );

    expect(result).toEqual({
      child: [
        {
          overview: {
            hash: 'test-hash-id',
          },
          usage: mockUsageData.responseData,
        },
        {
          overview: {
            hash: 'other-hash-id',
          },
        },
      ],
    });
  });

  it('should return early if getCacheFilterData fails with code 400', async () => {
    const failResponse = {
      code: 400,
      message: 'Invalid project',
    };
    (getCacheFilterData as jest.Mock).mockResolvedValue(failResponse);

    const result = await updateUsageDetails(hashId);
    expect(result).toEqual(failResponse);
    expect(getUsageForLibVul).not.toHaveBeenCalled();
  });

  it('should return undefined if getUsageForLibVul fails or returns non-200 code', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue({ code: 500 });

    const result = await updateUsageDetails(hashId);
    expect(result).toBeUndefined();
    expect(memoryCache.set).not.toHaveBeenCalled();
  });

  it('should do nothing if lib cache is not an array', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue({ child: null });

    const result = await updateUsageDetails(hashId);
    expect(result).toBeUndefined();
    expect(memoryCache.set).not.toHaveBeenCalled();
  });

  it('should throw an error if getCacheFilterData throws', async () => {
    (getCacheFilterData as jest.Mock).mockRejectedValue(
      new Error('API failure')
    );

    await expect(updateUsageDetails(hashId)).rejects.toThrow('API failure');
  });

  it('should throw an error if getUsageForLibVul throws', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockRejectedValue(
      new Error('API failure')
    );

    await expect(updateUsageDetails(hashId)).rejects.toThrow('API failure');
  });

  it('should update usage for unmapped hash in nested child when isUnmapped is true', async () => {
    const nestedLibCache = {
      child: [
        {
          child: [
            {
              overview: { hash: 'test-hash-id' },
              usage: undefined,
            },
          ],
        },
      ],
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue(nestedLibCache);

    const result = await updateUsageDetails(hashId, true);

    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      expect.objectContaining({
        child: [
          {
            child: [
              {
                overview: { hash: 'test-hash-id' },
                usage: mockUsageData.responseData,
              },
            ],
          },
        ],
      })
    );
    expect(result).toEqual(nestedLibCache);
  });

  it('should skip nodes without overview property', async () => {
    const partialData = {
      child: [
        {
          // No overview
          usage: undefined,
        },
      ],
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue(partialData);

    const result = await updateUsageDetails(hashId);

    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      partialData
    );
    expect(result).toEqual(partialData);
  });

  it('should handle unexpected libVul structure (non-object)', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue(null);

    const result = await updateUsageDetails(hashId);

    expect(result).toBeUndefined();
    expect(memoryCache.set).not.toHaveBeenCalled();
  });

  it('should skip node if overview is present but hash is missing', async () => {
    const partialNode = {
      child: [
        {
          overview: {},
          usage: undefined,
        },
      ],
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue(partialNode);

    const result = await updateUsageDetails(hashId);
    expect(result).toEqual(partialNode);
    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      partialNode
    );
  });

  it('should skip updating if childNode in unmapped mode is malformed', async () => {
    const malformedCache = {
      child: [
        {
          child: [null, { overview: null }],
        },
      ],
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue(malformedCache);

    const result = await updateUsageDetails(hashId, true);
    expect(result).toEqual(malformedCache);
    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      malformedCache
    );
  });

  it('should not fail when libVul.child is an empty array', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getUsageForLibVul as jest.Mock).mockResolvedValue(mockUsageData);
    (memoryCache.get as jest.Mock).mockResolvedValue({ child: [] });

    const result = await updateUsageDetails(hashId);
    expect(result).toEqual({ child: [] });
    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      { child: [] }
    );
  });
});
