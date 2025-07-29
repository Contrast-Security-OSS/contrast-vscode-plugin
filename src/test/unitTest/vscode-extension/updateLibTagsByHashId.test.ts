import path from 'path';
import { Uri } from 'vscode';
import { updateLibTags } from '../../../vscode-extension/api/services/apiService';
import { updateLibTagsByHashId } from '../../../vscode-extension/cache/cacheManager';
import { ShowErrorPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';

import { getCacheFilterData } from '../../../vscode-extension/utils/commonUtil';

const cacheManager = require('cache-manager');

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getCacheFilterData: jest.fn(),
}));

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  updateLibTags: jest.fn(),
}));

jest.mock('../../../vscode-extension/utils/errorHandling', () => ({
  resolveFailure: jest.fn(),
}));

jest.mock('../../../l10n', () => ({
  localeI18ln: {
    getTranslation: jest.fn().mockReturnValue(null),
  },
}));
/* eslint-disable @typescript-eslint/no-explicit-any */
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

jest.mock('cache-manager', () => ({
  caching: jest.fn().mockReturnValue({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  }),
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

describe('updateLibTagsByHashId', () => {
  const hashId = 'testTraceId';
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
          overview: {
            hash: 'testTraceId',
          },
          tags: ['tag1', 'tag2'],
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
    (updateLibTags as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove);

    expect(updateLibTags).toHaveBeenCalledWith(
      {
        apiKey: '0123',
        contrastURL: 'example.com',
        userName: 'user',
        serviceKey: '1234',
        organizationId: 'org123',
        source: 'assess',
      },
      hashId,
      tags,
      []
    );

    expect(memoryCache.set).toHaveBeenCalledTimes(1);

    expect(mockCachedData.responseData.child[0].tags).toEqual(['tag1', 'tag2']);

    expect(result).toEqual(mockCachedData);
  });

  it('should return failure response when GetAssessFilter returns invalid data', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      code: 400,
      message: 'Project not found',
    });

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove);
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
    (updateLibTags as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockEmptyCache);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove);

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
    (updateLibTags as jest.Mock).mockResolvedValue(mockFailedAddTagsResponse);

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove);

    expect(result).toBeUndefined();
  });

  it('should throw an error if GetAssessFilter throws an error', async () => {
    (getCacheFilterData as jest.Mock).mockRejectedValue(new Error('API error'));

    await expect(
      updateLibTagsByHashId(hashId, tags, tags_remove)
    ).rejects.toThrowError('API error');
  });

  it('should throw an error if addTagsByOrgId throws an error', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (updateLibTags as jest.Mock).mockRejectedValue(new Error('API error'));

    await expect(
      updateLibTagsByHashId(hashId, tags, tags_remove)
    ).rejects.toThrowError('API error');
  });

  it('should update nested child tags correctly when traceId matches', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (updateLibTags as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove);

    const nestedChild = mockCachedData.responseData.child[0];
    expect(nestedChild.tags).toEqual(['tag1', 'tag2']);
    expect(result).toEqual(mockCachedData);
  });

  it('should update nested child tags when isUnmapped is true', async () => {
    const mockCacheWithNested = {
      responseData: {
        child: [
          {
            child: [
              {
                overview: { hash: hashId },
                tags: ['tag1', 'tag2'],
              },
            ],
          },
        ],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (updateLibTags as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCacheWithNested);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateLibTagsByHashId(
      hashId,
      tags,
      tags_remove,
      true // isUnmapped
    );

    expect(mockCacheWithNested.responseData.child[0].child[0].tags).toEqual(
      tags
    );
    expect(result).toEqual(mockCacheWithNested);
  });

  it('should show error popup on failed tag update', async () => {
    const mockFailedResponse = { code: 500 };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (updateLibTags as jest.Mock).mockResolvedValue(mockFailedResponse);

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove);

    expect(result).toBeUndefined();
    expect(ShowErrorPopup).toHaveBeenCalledWith(
      expect.stringContaining('Oops! Something went wrong.')
    );
  });

  it('should skip childItems without overview when isUnmapped is false', async () => {
    const malformedCache = {
      responseData: {
        child: [
          {
            // Missing overview
            tags: [],
          },
        ],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (updateLibTags as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(malformedCache);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove);
    expect(result).toEqual(malformedCache);
  });

  it('should handle null entries in nested children array gracefully', async () => {
    const malformedUnmappedCache = {
      responseData: {
        child: [
          {
            child: [null, { overview: null }, undefined],
          },
        ],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (updateLibTags as jest.Mock).mockResolvedValue(mockAddTagsResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(malformedUnmappedCache);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateLibTagsByHashId(hashId, tags, tags_remove, true);

    expect(result).toEqual(malformedUnmappedCache);
  });

  it('should show fallback error message if translation is null', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (updateLibTags as jest.Mock).mockResolvedValue({ code: 500 });

    await updateLibTagsByHashId(hashId, tags, tags_remove);

    expect(ShowErrorPopup).toHaveBeenCalledWith('Oops! Something went wrong.');
  });
});
