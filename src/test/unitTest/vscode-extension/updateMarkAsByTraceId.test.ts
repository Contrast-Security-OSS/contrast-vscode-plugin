import { updateMarkAsByTraceId } from '../../../vscode-extension/cache/cacheManager';
import { addMarkByOrgId } from '../../../vscode-extension/api/services/apiService';
import cacheManager from 'cache-manager';
import path from 'path';
import { Uri } from 'vscode';
import { getCacheFilterData } from '../../../vscode-extension/utils/commonUtil';

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getCacheFilterData: jest.fn(),
}));

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  addMarkByOrgId: jest.fn(),
}));

jest.mock('../../../vscode-extension/utils/errorHandling', () => ({
  resolveFailure: jest.fn(),
}));
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
    onDidChangeConfiguration: jest.fn(),
  },
  window: {
    showInformationMessage: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
  },
  languages: {
    registerHoverProvider: jest.fn(),
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
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
  })
);

const memoryCache = cacheManager.caching({
  store: 'memory',
  max: 100,
  ttl: 300,
});

describe('updateMarkAsByTraceId', () => {
  const updateParams = {
    traceId: ['test123'],
    status: 'test',
    note: 'demo',
    substatus: 'not',
  };

  const mockFilter = {
    apiKey: '0123',
    contrastURL: 'example.com',
    userName: 'user',
    serviceKey: '1234',
    organizationId: 'org123',
    source: 'assess',
    projectId: 'project123',
  };

  const mockAddMarkResponse = {
    code: 200,
  };

  const mockCachedData = {
    responseData: {
      child: [
        {
          traceId: 'test123',
          status: 'test',
          sub_status: 'not',
          child: [
            {
              traceId: 'test123',
              status: 'test',
              sub_status: 'not',
              popupMessage: {},
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update mark and cache when addMarkByOrgId response is successful', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addMarkByOrgId as jest.Mock).mockResolvedValue(mockAddMarkResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateMarkAsByTraceId(updateParams);

    expect(addMarkByOrgId).toHaveBeenCalledTimes(1);

    expect(memoryCache.set).toHaveBeenCalledTimes(1);

    expect(mockCachedData.responseData.child[0].child[0].status).toEqual(
      updateParams.status
    );
    expect(mockCachedData.responseData.child[0].child[0].sub_status).toEqual(
      updateParams.substatus
    );

    expect(result).toEqual(mockCachedData);
  });

  it('should return failure response when GetAssessFilter returns invalid data', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      code: 400,
      message: 'Project not found',
    });

    const result = await updateMarkAsByTraceId(updateParams);

    expect(result).toEqual({
      code: 400,
      message: 'Project not found',
    });
  });

  it('should handle cases where the cache does not contain valid data', async () => {
    const mockEmptyCache = {
      responseData: {
        child: [],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addMarkByOrgId as jest.Mock).mockResolvedValue(mockAddMarkResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockEmptyCache);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateMarkAsByTraceId(updateParams);

    expect(memoryCache.set).toHaveBeenCalledTimes(1);

    expect(result).toEqual(mockEmptyCache);
  });

  it('should handle an unsuccessful response from addMarkByOrgId', async () => {
    const mockFailedAddMarkResponse = {
      code: 400,
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addMarkByOrgId as jest.Mock).mockResolvedValue(mockFailedAddMarkResponse);

    const result = await updateMarkAsByTraceId(updateParams);

    expect(result).toBeUndefined();
  });

  it('should throw an error if GetAssessFilter throws an error', async () => {
    (getCacheFilterData as jest.Mock).mockRejectedValue(new Error('API error'));

    await expect(updateMarkAsByTraceId(updateParams)).rejects.toThrowError(
      'API error'
    );
  });

  it('should throw an error if addMarkByOrgId throws an error', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addMarkByOrgId as jest.Mock).mockRejectedValue(new Error('API error'));

    await expect(updateMarkAsByTraceId(updateParams)).rejects.toThrowError(
      'API error'
    );
  });
});
