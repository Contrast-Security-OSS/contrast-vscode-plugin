import path from 'path';
import { Uri } from 'vscode';
import { l10n } from '../../../l10n';
import { resetTimer } from '../../../vscode-extension/api/services/apiService';
import { resetBackgroundTimer } from '../../../vscode-extension/cache/backgroundRefreshTimer';
import {
  resolveFailure,
  resolveSuccess,
} from '../../../vscode-extension/utils/errorHandling';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';

// Mocked imports
jest.mock('../../../vscode-extension/utils/persistanceState');
jest.mock('../../../vscode-extension/utils/errorHandling');
jest.mock('../../../vscode-extension/cache/backgroundRefreshTimer');
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

const locale = new l10n('en');

describe('resetTimer', () => {
  // Mocks for the necessary functions
  const mockedResolveFailure = resolveFailure as jest.MockedFunction<
    typeof resolveFailure
  >;
  const mockedResolveSuccess = resolveSuccess as jest.MockedFunction<
    typeof resolveSuccess
  >;
  const mockedResetBackgroundTimer =
    resetBackgroundTimer as jest.MockedFunction<typeof resetBackgroundTimer>;
  const mockedGetByKey = PersistenceInstance.getByKey as jest.MockedFunction<
    typeof PersistenceInstance.getByKey
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure if project is not found in persisted data', async () => {
    mockedGetByKey.mockReturnValue([]);

    mockedResolveFailure.mockReturnValue({
      message: locale.getTranslation('apiResponse.projectNotFound') as string,
      code: 400,
      status: 'failure',
      responseData: {},
    });

    const response = await resetTimer();

    expect(mockedResolveFailure).toHaveBeenCalledWith(
      locale.getTranslation('apiResponse.projectNotFound'),
      400
    );
    expect(response).toEqual({
      message: locale.getTranslation('apiResponse.projectNotFound') as string,
      code: 400,
      status: 'failure',
      responseData: {},
    });
  });

  it('should reset the timer successfully if project is found', async () => {
    const mockProject = {
      projectId: '12345',
      source: 'scan',
    };

    mockedGetByKey.mockReturnValue([mockProject]);

    mockedResetBackgroundTimer.mockResolvedValue(undefined);

    mockedResolveSuccess.mockReturnValue({
      message: locale.getTranslation(
        'apiResponse.successfullyResetTimer'
      ) as string,
      code: 200,
      status: 'success',
      responseData: {},
    });

    const response = await resetTimer();

    expect(mockedResolveSuccess).toHaveBeenCalledWith(
      locale.getTranslation('apiResponse.successfullyResetTimer'),
      200,
      null
    );
    expect(response).toEqual({
      message: locale.getTranslation(
        'apiResponse.successfullyResetTimer'
      ) as string,
      code: 200,
      status: 'success',
      responseData: {},
    });
  });

  it('should handle case where project is found but resetBackgroundTimer throws an error', async () => {
    const mockProject = {
      projectName: 'Test Project',
      projectId: '12345',
    };

    mockedGetByKey.mockReturnValue([mockProject]);

    mockedResetBackgroundTimer.mockRejectedValue(
      new Error('Timer reset failed')
    );
    mockedResolveFailure.mockReturnValue({
      message: 'Timer reset failed',
      code: 500,
      status: 'failure',
      responseData: {},
    });

    const response = await resetTimer();
    expect(mockedResolveFailure).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      message: 'Timer reset failed',
      code: 500,
      status: 'failure',
      responseData: {},
    });
  });
});
