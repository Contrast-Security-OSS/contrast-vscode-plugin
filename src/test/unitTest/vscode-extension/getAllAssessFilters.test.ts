import { localeI18ln } from '../../../l10n';
import { GetAssessFilter } from '../../../vscode-extension/persistence/PersistenceConfigSetting';
import { resolveSuccess } from '../../../vscode-extension/utils/errorHandling';
import { getAllAssessFilters } from '../../../vscode-extension/utils/helper';
import path from 'path';
import { Uri } from 'vscode';
jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => ({
    GetAssessFilter: jest.fn(),
  })
);
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
    onDidChangeConfiguration: jest.fn(),
    onDidChangeWorkspaceFolders: jest.fn(),
  },
  window: {
    activeTextEditor: null,
    createTreeView: jest.fn(),
    registerWebviewViewProvider: jest.fn(),
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
}));

jest.mock('../../../vscode-extension/utils/errorHandling', () => ({
  resolveSuccess: jest.fn(),
  resolveFailure: jest.fn(),
}));

jest.mock('../../../l10n', () => ({
  localeI18ln: {
    getTranslation: jest.fn(),
  },
}));

jest.mock(
  '../../../vscode-extension/commands/ui-commands/openActivityBar',
  () => ({
    registerContrastActivityBar: {
      postMessage: jest.fn(),
    },
  })
);

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

describe('getAllAssessFilters', () => {
  it('should return the correct filters when the workspace filter is valid', async () => {
    const mockFilter = {
      servers: ['1'],
      appVersionTags: ['v1.0'],
      severities: ['CRITICAL', 'HIGH'],
      status: ['REPORTED'],
      startDate: { timeStamp: 1618900000000 },
      endDate: { timeStamp: 1618990000000 },
      agentSessionId: 'session1',
      metadataFilters: { key: 'value' },
    };

    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });
    (localeI18ln.getTranslation as jest.Mock).mockReturnValue('Success');
    (resolveSuccess as jest.Mock).mockReturnValue({
      message: 'Success',
      statusCode: 200,
      data: mockFilter,
    });

    const result = await getAllAssessFilters();

    expect(result).toEqual({
      severities: ['CRITICAL', 'HIGH'],
      status: ['REPORTED'],
      servers: 1,
      appVersionTags: 'v1.0',
      startDate: 1618900000000,
      endDate: 1618990000000,
      agentSessionId: 'session1',
      metadataFilters: '{"key":"value"}',
    });
  });

  it('should return undefined if the workspace filter is null or undefined', async () => {
    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: null,
    });
    const result = await getAllAssessFilters();
    expect(result).toBeUndefined();
  });

  it('should handle server filter and convert to a number', async () => {
    const mockFilter = {
      servers: ['1'],
    };
    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });

    const result = await getAllAssessFilters();

    expect(result?.servers).toBe(1);
  });

  it('should handle appVersionTags filter correctly', async () => {
    const mockFilter = {
      appVersionTags: ['v1.0'],
    };
    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });

    const result = await getAllAssessFilters();

    expect(result?.appVersionTags).toBe('v1.0');
  });

  it('should correctly handle empty severities', async () => {
    const mockFilter = {
      severities: [],
    };
    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });

    const result = await getAllAssessFilters();

    expect(result?.severities).toBeUndefined();
  });

  it('should correctly handle null status and delete it', async () => {
    const mockFilter = {
      status: null,
    };
    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: mockFilter,
    });

    const result = await getAllAssessFilters();

    expect(result?.status).toBeUndefined();
  });
});
