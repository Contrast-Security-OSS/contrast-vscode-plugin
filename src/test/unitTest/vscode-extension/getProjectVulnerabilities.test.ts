import { getProjectVulnerabilties } from '../../../vscode-extension/api/services/apiService';
import { getDataFromCache } from '../../../vscode-extension/cache/cacheManager';
import { resolveFailure } from '../../../vscode-extension/utils/errorHandling';
import {
  ShowInformationPopup,
  ShowErrorPopup,
} from '../../../vscode-extension/commands/ui-commands/messageHandler';
import { ApiResponse } from '../../../common/types';
import { l10n } from '../../../l10n';
import path from 'path';
import { Uri } from 'vscode';
import { loggerInstance } from '../../../vscode-extension/logging/logger';

jest.mock('../../../vscode-extension/utils/errorHandling');
jest.mock('../../../vscode-extension/cache/cacheManager');
jest.mock('../../../l10n');
jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
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

const locale = new l10n('en');
const mockedResolveFailure = resolveFailure as jest.MockedFunction<
  typeof resolveFailure
>;
const mockedGetDataFromCache = getDataFromCache as jest.MockedFunction<
  typeof getDataFromCache
>;
const mockedShowInformationPopup = ShowInformationPopup as jest.MockedFunction<
  typeof ShowInformationPopup
>;
const mockedShowErrorPopup = ShowErrorPopup as jest.MockedFunction<
  typeof ShowErrorPopup
>;

describe('getProjectVulnerabilties', () => {
  beforeEach(() => {
    mockedResolveFailure.mockReset();
    mockedGetDataFromCache.mockReset();
    mockedShowInformationPopup.mockReset();
    mockedShowErrorPopup.mockReset();
  });

  it('should return failure when issues count exceeds 150000', async () => {
    const mockProjectVulnerabilities = {
      responseData: {
        issuesCount: 200000,
        status: 'failure',
        code: 400,
        message: 'Issue count too high',
      },
    } as unknown as ApiResponse;

    mockedGetDataFromCache.mockResolvedValue(mockProjectVulnerabilities);

    mockedResolveFailure.mockReturnValue({
      message: locale.getTranslation('apiResponse.configureFilter') as string,
      code: 400,
      status: 'failure',
      responseData: {},
    });

    const response = await getProjectVulnerabilties();

    expect(mockedResolveFailure).toHaveBeenCalledWith(
      locale.getTranslation('apiResponse.configureFilter'),
      400
    );
    expect(response).toEqual({
      message: locale.getTranslation('apiResponse.configureFilter') as string,
      code: 400,
      status: 'failure',
      responseData: {},
    });
  });

  it('should show information popup and return project vulnerabilities when response code is 200', async () => {
    const mockProjectVulnerabilities = {
      code: 200,
      message: 'Data retrieved successfully',
      responseData: {
        issuesCount: 10000,
        status: 'success',
      },
    } as unknown as ApiResponse;

    mockedGetDataFromCache.mockResolvedValue(mockProjectVulnerabilities);

    const response = await getProjectVulnerabilties();

    expect(mockedShowInformationPopup).toHaveBeenCalledWith(
      'Data retrieved successfully'
    );
    expect(response).toEqual(mockProjectVulnerabilities);
  });

  it('should show error popup when response code is not 200 and issuesCount is within limits', async () => {
    const mockProjectVulnerabilities = {
      code: 500,
      message: 'Internal Server Error',
      responseData: {
        issuesCount: 5000,
        status: 'failure',
      },
    } as unknown as ApiResponse;

    mockedGetDataFromCache.mockResolvedValue(mockProjectVulnerabilities);

    const response = await getProjectVulnerabilties();
    expect(loggerInstance.logMessage).toHaveBeenCalledTimes(2);

    expect(mockedShowErrorPopup).toHaveBeenCalledWith('Internal Server Error');
    expect(response).toBeUndefined();
  });

  it('should handle edge case when responseData is undefined', async () => {
    const mockProjectVulnerabilities = {
      code: 200,
      message: 'No issues found',
      responseData: undefined,
    } as unknown as ApiResponse;

    mockedGetDataFromCache.mockResolvedValue(mockProjectVulnerabilities);

    const response = await getProjectVulnerabilties();

    expect(mockedShowInformationPopup).toHaveBeenCalledWith('No issues found');
    expect(response).toEqual(mockProjectVulnerabilities);
  });
});
