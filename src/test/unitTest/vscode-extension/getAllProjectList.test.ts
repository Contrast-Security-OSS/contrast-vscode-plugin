import axios from 'axios';
import {
  getAllProjectList,
  getAllScans,
  getProjectById,
  getScanById,
} from '../../../vscode-extension/api/services/apiService';
import {
  resolveFailure,
  resolveSuccess,
} from '../../../vscode-extension/utils/errorHandling';
import { configuredProject1 } from '../../mocks/testMock';
import { l10n } from '../../../l10n';
import { ShowInformationPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import path from 'path';
import { Uri } from 'vscode';
import { loggerInstance } from '../../../vscode-extension/logging/logger';

jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
    onDidChangeConfiguration: jest.fn(),
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
  commands: {
    registerCommand: jest.fn(),
  },
  languages: {
    registerHoverProvider: jest.fn(),
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

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopupWithOptions: jest.fn(),
    ShowInformationPopup: jest.fn(),
  })
);

jest.mock('../../../vscode-extension/utils/errorHandling', () => ({
  resolveSuccess: jest.fn(),
  resolveFailure: jest.fn(),
}));

jest.mock('axios');
jest.mock('axios-retry', () => jest.fn());

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

(ShowInformationPopup as jest.Mock).mockResolvedValue(
  'Fetching Project Details.'
);

const localeI18ln = new l10n('en');

describe('API Service Tests', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProjectList', () => {
    it('should fetch projects successfully', async () => {
      const mockResponse = {
        status: 'success',
        code: 200,
        data: {
          content: [
            { id: 1, name: 'Project 1' },
            { id: 2, name: 'Project 2' },
          ],
          totalPages: 1,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getAllProjectList(configuredProject1);
      expect(result).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('apiResponse.projectsFetchedSuccessful'),
          200,
          mockResponse.data.content as any
        )
      );
    });

    it('should handle missing parameters', async () => {
      const paramsWithMissingField = { ...configuredProject1, apiKey: '' };

      const result = await getAllProjectList(paramsWithMissingField);

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.missingOneOrMoreError'),
          400
        )
      );
    });

    it('should handle authorization failure', async () => {
      const mockResponse = {
        status: 403,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getAllProjectList(configuredProject1);

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.authenticationFailure'),
          400
        )
      );
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      const result = await getAllProjectList(configuredProject1);

      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.authenticationFailure'),
          500
        )
      );
    });
  });

  describe('getProjectById', () => {
    it('should return false for an invalid project ID', async () => {
      const mockResponse = {
        status: 404,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const paramsWithProjectId = {
        ...configuredProject1,
        projectId: String(configuredProject1.projectId),
      };

      const result = await getProjectById(paramsWithProjectId);

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      const paramsWithProjectId = {
        ...configuredProject1,
        projectId: String(configuredProject1.projectId),
      };

      const result = await getProjectById(paramsWithProjectId);

      expect(result).toBe(false);
    });
  });

  describe('getAllScans', () => {
    it('should handle failed scan retrieval (400 status)', async () => {
      const mockResponse = {
        status: 400,
        data: { message: 'Bad Request' },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getAllScans(configuredProject1);

      expect(result).toEqual(resolveFailure('Failed to retrieve scans', 400));
    });
  });

  describe('getScanById Tests', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should handle failed scan retrieval (404 status)', async () => {
      const scanId = 'nonexistent-scan-id';
      const mockResponse = {
        status: 404,
        data: { message: 'Scan not found' },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getScanById(configuredProject1, scanId);

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.failedToRetrieveScanById'),
          400
        )
      );
    });

    it('should handle network errors', async () => {
      const scanId = '0a273c6a-aac2-47ad-a76b-4836a1b34c23';

      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      const result = await getScanById(configuredProject1, scanId);

      expect(result).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.errorFetchingScanById'),
          500
        )
      );
    });
  });
});
