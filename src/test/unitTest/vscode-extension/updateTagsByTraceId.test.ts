import path from 'path';
import { Uri } from 'vscode';
import { addTagsByOrgId } from '../../../vscode-extension/api/services/apiService';
import { updateTagsByTraceId } from '../../../vscode-extension/cache/cacheManager';

import { getCacheFilterData } from '../../../vscode-extension/utils/commonUtil';

const cacheManager = require('cache-manager');

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getCacheFilterData: jest.fn(),
}));

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  addTagsByOrgId: jest.fn(),
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

const memoryCache = cacheManager.caching({
  store: 'memory',
  max: 100,
  ttl: 300,
});

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
  })
);

describe('updateTagsByTraceId', () => {
  const traceId = 'testTraceId';
  const tags = ['tag1', 'tag2'];
  const tags_remove: string[] = [];

  const mockFilter = {
    apiKey: '0123',
    contrastURL: 'example.com',
    userName: 'user',
    serviceKey: '1234',
    organizationId: 'org123',
    source: 'assess',
    projectId: 'project123',
  };

  const mockAddTagsResponse = {
    code: 200,
  };

  const mockCachedData = {
    responseData: {
      child: [
        {
          traceId: 'testTraceId',
          tags: ['existingTag'],
          child: [
            {
              traceId: 'testTraceId',
              tags: ['existingNestedTag'],
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    memoryCache.set.mockClear();
    memoryCache.get.mockClear();
    memoryCache.del.mockClear();
    memoryCache.reset.mockClear();
  });

  it('should add tags to traceId and update the cache when addTagsByOrgId response is successful', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addTagsByOrgId as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateTagsByTraceId([traceId], tags, tags_remove);

    expect(addTagsByOrgId).toHaveBeenCalledWith(
      mockFilter.organizationId,
      [traceId],
      tags,
      [],
      {
        apiKey: mockFilter.apiKey,
        contrastURL: mockFilter.contrastURL,
        userName: mockFilter.userName,
        serviceKey: mockFilter.serviceKey,
        organizationId: mockFilter.organizationId,
        source: mockFilter.source,
      }
    );

    expect(memoryCache.set).toHaveBeenCalledTimes(1);

    expect(mockCachedData.responseData.child[0].child[0].tags).toEqual([
      {
        id: 1,
        label: 'tag1',
      },
      {
        id: 2,
        label: 'tag2',
      },
    ]);

    expect(result).toEqual(mockCachedData);
  });

  it('should return failure response when GetAssessFilter returns invalid data', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      code: 400,
      message: 'Project not found',
    });

    const result = await updateTagsByTraceId([traceId], tags, tags_remove);

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
    (addTagsByOrgId as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockEmptyCache);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateTagsByTraceId([traceId], tags, tags_remove);

    expect(memoryCache.set).toHaveBeenCalledTimes(1);

    expect(result).toEqual(mockEmptyCache);
  });

  it('should handle an unsuccessful response from addTagsByOrgId', async () => {
    const mockFailedAddTagsResponse = {
      code: 400,
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addTagsByOrgId as jest.Mock).mockResolvedValue(mockFailedAddTagsResponse);

    const result = await updateTagsByTraceId([traceId], tags, tags_remove);

    expect(result).toBeUndefined();
  });

  it('should throw an error if GetAssessFilter throws an error', async () => {
    (getCacheFilterData as jest.Mock).mockRejectedValue(new Error('API error'));

    await expect(
      updateTagsByTraceId([traceId], tags, tags_remove)
    ).rejects.toThrowError('API error');
  });

  it('should throw an error if addTagsByOrgId throws an error', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addTagsByOrgId as jest.Mock).mockRejectedValue(new Error('API error'));

    await expect(
      updateTagsByTraceId([traceId], tags, tags_remove)
    ).rejects.toThrowError('API error');
  });

  it('should update nested child tags correctly when traceId matches', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (addTagsByOrgId as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateTagsByTraceId([traceId], tags, tags_remove);

    const nestedChild = mockCachedData.responseData.child[0].child[0];
    expect(nestedChild.tags).toEqual([
      {
        id: 1,
        label: 'tag1',
      },
      {
        id: 2,
        label: 'tag2',
      },
    ]);
    expect(result).toEqual(mockCachedData);
  });
});
