import axios from 'axios';
import { resolveFailure } from '../../../vscode-extension/utils/errorHandling';
import { l10n } from '../../../l10n';
import {
  GetAllConfiguredProjects,
  GetFilters,
} from '../../../vscode-extension/persistence/PersistenceConfigSetting';
import { getScanResults } from '../../../vscode-extension/api/services/apiService';
import path from 'path';
import { Uri } from 'vscode';
import { loggerInstance } from '../../../vscode-extension/logging/logger';

jest.mock('axios');
jest.mock('axios-retry', () => {
  return jest.fn();
});
jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => ({
    GetAllConfiguredProjects: jest.fn(),
    GetFilters: jest.fn(),
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
  },
  TreeItem: class {
    [x: string]: { dark: Uri; light: Uri };
    constructor(
      label: { dark: Uri; light: Uri },
      /* eslint-disable @typescript-eslint/no-explicit-any */
      command: any = null,
      /* eslint-disable @typescript-eslint/no-explicit-any */
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

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      postMessage: jest.fn(),
    },
  })
);

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const localeI18n = new l10n('en');

describe('getScanResults', () => {
  const mockProjectId = '9a4ecef0-bf87-33e605bdcced';
  const mockConfiguredProject = {
    projectId: mockProjectId,
    apiKey: 'mockApiKey',
    userName: 'mockUser',
    serviceKey: 'mockServiceKey',
    contrastURL: 'https://local.com',
    organizationId: 'mockOrgId',
    source: 'scan',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });

    (GetFilters as jest.Mock).mockResolvedValue({
      responseData: null,
    });
  });

  it('should return failure if project not found', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [],
    });

    const result = await getScanResults('projectid123');

    expect(result).toEqual(
      resolveFailure(
        localeI18n.getTranslation('apiResponse.projectNotFound'),
        400
      )
    );
  });

  it('should return failure on API error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API error'));

    const result = await getScanResults(mockProjectId);

    expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      resolveFailure(
        localeI18n.getTranslation('apiResponse.errorFetchingScanResult'),
        500
      )
    );
  });

  it('should handle API response with unexpected structure', async () => {
    const mockApiResponse = {
      status: 200,
      data: {
        totalPages: 1,
      },
    };

    mockedAxios.get.mockResolvedValue(mockApiResponse);

    const result = await getScanResults(mockProjectId);

    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
    expect(result).toEqual(
      resolveFailure(
        localeI18n.getTranslation('apiResponse.errorFetchingScanResult'),
        500
      )
    );
  });

  it('should use filters if available', async () => {
    const mockFilters = {
      filter: {
        range: 1,
        fromDateTime: '2024-01-01T00:00:00Z',
        toDateTime: '2024-12-31T23:59:59Z',
      },
      severity: {
        CRITICAL: true,
      },
      status: {
        CONFIRMED: true,
      },
    };

    (GetFilters as jest.Mock).mockResolvedValue({
      responseData: mockFilters,
    });

    const mockApiResponse = {
      status: 200,
      data: {
        content: [{ issue: 'Issue with filter' }],
        totalPages: 1,
      },
    };

    mockedAxios.get.mockResolvedValue(mockApiResponse);

    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
  });
});
