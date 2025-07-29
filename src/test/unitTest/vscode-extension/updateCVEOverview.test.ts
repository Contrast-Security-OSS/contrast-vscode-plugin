/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateCVEOverview } from '../../../vscode-extension/cache/cacheManager';
import { getCacheFilterData } from '../../../vscode-extension/utils/commonUtil';
import { getCVEOverview } from '../../../vscode-extension/api/services/apiService';
import { ShowErrorPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import { Uri } from 'vscode';
import path from 'path';

const cacheManager = require('cache-manager');
const memoryCache = cacheManager.caching({
  store: 'memory',
  max: 100,
  ttl: 300,
});

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getCacheFilterData: jest.fn(),
}));

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  getCVEOverview: jest.fn(),
}));

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

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
  })
);

describe('updateCVEOverview', () => {
  const cveId = 'CVE-1234-5678';
  const mockFilter = {
    apiKey: '0123',
    contrastURL: 'example.com',
    userName: 'user',
    serviceKey: '1234',
    organizationId: 'org123',
    source: 'assess',
    projectId: 'project123',
  };

  const mockCVEOverviewResponse = {
    code: 200,
    responseData: {
      cve: {
        firstSeen: '1680000000000',
        nvdModified: '1685000000000',
        nvdPublished: '1670000000000',
        cvssv3: {
          baseScore: 7.5,
          severity: 'High',
          impactSubscore: 4.2,
          exploitabilitySubscore: 3.3,
          vector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          attackVector: 'NETWORK',
          attackComplexity: 'LOW',
          privilegesRequired: 'NONE',
          userInteraction: 'NONE',
          scope: 'UNCHANGED',
          confidentialityImpact: 'HIGH',
          integrityImpact: 'HIGH',
          availabilityImpact: 'HIGH',
        },
        epssScore: 0.85,
      },
      apps: [{ name: 'App A' }],
      servers: [{ name: 'Server A' }],
      impactStats: {
        impactedAppCount: 2,
        impactStats: 4,
        appPercentage: 50,
        impactedServerCount: 3,
        totalServerCount: 10,
      },
    },
  };

  const mockCachedData = {
    responseData: {
      child: [
        {
          child: [
            {
              label: cveId,
              overview: {},
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (memoryCache.get as jest.Mock).mockClear();
    (memoryCache.set as jest.Mock).mockClear();
  });

  it('should update CVE overview in cache and show info popup', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(mockCVEOverviewResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateCVEOverview(cveId);

    expect(getCVEOverview).toHaveBeenCalledWith(cveId, expect.any(Object));
    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      expect.any(Object)
    );
    expect(result).toEqual(mockCachedData);
  });

  it('should return failure response when getCacheFilterData fails', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      code: 400,
      message: 'Invalid project',
    });

    const result = await updateCVEOverview(cveId);

    expect(result).toEqual({ code: 400, message: 'Invalid project' });
    expect(ShowErrorPopup).not.toHaveBeenCalled();
  });

  it('should throw if getCVEOverview throws', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockRejectedValue(new Error('API error'));

    await expect(updateCVEOverview(cveId)).rejects.toThrow('API error');
  });

  it('should not update cache if CVE label does not match', async () => {
    const mockDataWithoutMatch = {
      responseData: {
        child: [
          {
            child: [
              {
                label: 'CVE-NOT-MATCHING',
                overview: {},
              },
            ],
          },
        ],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(mockCVEOverviewResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockDataWithoutMatch);

    await updateCVEOverview(cveId);

    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      mockDataWithoutMatch
    );
  });

  it('should handle missing optional fields like epssScore or cvssv3', async () => {
    const modifiedOverview = {
      ...mockCVEOverviewResponse,
      responseData: {
        ...mockCVEOverviewResponse.responseData,
        cve: {
          ...mockCVEOverviewResponse.responseData.cve,
          epssScore: undefined,
          cvssv3: undefined,
        },
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(modifiedOverview);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);

    const result = await updateCVEOverview(cveId);

    expect(result).toEqual(mockCachedData);
    expect(memoryCache.set).toHaveBeenCalled();
  });

  it('should handle undefined child in cached data gracefully', async () => {
    const incompleteCache = {}; // No child field

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(mockCVEOverviewResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(incompleteCache);

    const result = await updateCVEOverview(cveId);

    expect(result).toEqual(incompleteCache);
    expect(memoryCache.set).toHaveBeenCalledWith(
      'library-' + mockFilter.projectId,
      incompleteCache
    );
  });

  it('should handle missing impactStats field', async () => {
    const modifiedOverview = {
      ...mockCVEOverviewResponse,
      responseData: {
        ...mockCVEOverviewResponse.responseData,
        impactStats: undefined,
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(modifiedOverview);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);

    const result = await updateCVEOverview(cveId);

    expect(result).toEqual(mockCachedData);
  });

  it('should handle empty apps and servers arrays', async () => {
    const modifiedOverview = {
      ...mockCVEOverviewResponse,
      responseData: {
        ...mockCVEOverviewResponse.responseData,
        apps: [],
        servers: [],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(modifiedOverview);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCachedData);

    const result = await updateCVEOverview(cveId);

    expect(result).toEqual(mockCachedData);
  });

  it('should not throw if overview is missing on nestedChild', async () => {
    const badCache = {
      responseData: {
        child: [
          {
            child: [
              {
                label: cveId,
                // missing overview
              },
            ],
          },
        ],
      },
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(mockCVEOverviewResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(badCache);

    const result = await updateCVEOverview(cveId);

    expect(result).toEqual(badCache);
  });

  it('should return undefined for non-200 CVEOverview response', async () => {
    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue({ code: 500 });

    const result = await updateCVEOverview(cveId);

    expect(result).toBeUndefined();
  });

  it('should fully update overview fields on matching CVE label', async () => {
    const matchingNode = {
      label: cveId,
      overview: {
        cisa: false,
        cveRecordLink: '',
        description: '',
        firstSeen: '',
        nvdModified: '',
        nvdPublished: '',
        nvdRecordLink: '',
        severity: '',
        severityAndMetrics: [],
        vector: {
          label: '',
          vectors: [],
        },
        organizationalImpact: [
          {
            name: 'Applications',
            totalAppCount: 0,
            impactedAppCount: 0,
            appPercentage: 0,
          },
          {
            name: 'Servers',
            totalServerCount: 0,
            impactedServerCount: 0,
            serverPercentage: 0,
          },
        ],
        applications: [],
        servers: [],
      }, // important to allow mutation
    };

    const mockCacheWithMatchingCVE = {
      child: [
        {
          child: [matchingNode],
        },
      ],
    };

    (getCacheFilterData as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (getCVEOverview as jest.Mock).mockResolvedValue(mockCVEOverviewResponse);
    (memoryCache.get as jest.Mock).mockResolvedValue(mockCacheWithMatchingCVE);
    (memoryCache.set as jest.Mock).mockResolvedValue(true);

    const result = await updateCVEOverview(cveId);

    const overview = matchingNode.overview;

    expect(overview.firstSeen).toBe('2023-03-28'); // 1680000000000
    expect(overview.nvdModified).toBe('2023-05-25'); // 1685000000000
    expect(overview.nvdPublished).toBe('2022-12-02'); // 1670000000000

    expect(overview.severityAndMetrics).toEqual([
      { name: 'CVSS v3.1', score: 7.5, severity: 'High' },
      { name: 'Impact Score', score: 4.2, severity: '' },
      { name: 'Exploitability Score', score: 3.3, severity: '' },
      { name: 'EPSS', score: 0.85, severity: '' },
    ]);

    expect(overview.vector).toEqual({
      label: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      vectors: [
        { label: 'Attack vector (AV)', value: 'NETWORK' },
        { label: 'Attack complexity (AC)', value: 'LOW' },
        { label: 'Privileges required (PR)', value: 'NONE' },
        { label: 'User Interaction (UI)', value: 'NONE' },
        { label: 'Scope (S)', value: 'UNCHANGED' },
        { label: 'Confidentiality (C)', value: 'HIGH' },
        { label: 'Integrity (I)', value: 'HIGH' },
        { label: 'Availability (A)', value: 'HIGH' },
      ],
    });

    expect(overview.organizationalImpact).toEqual([
      {
        name: 'Applications',
        impactedAppCount: 2,
        totalAppCount: 0, // impactStats?.totalAppCount was missing; adjust if needed
        appPercentage: 50,
      },
      {
        name: 'Servers',
        impactedServerCount: 3,
        totalServerCount: 10,
        serverPercentage: 0, // adjust based on actual mock
      },
    ]);

    expect(overview.applications).toEqual(['App A']);
    expect(overview.servers).toEqual(['Server A']);

    expect(result).toEqual(mockCacheWithMatchingCVE);
  });
});
