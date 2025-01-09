import { ApiResponse } from '../../../common/types';
import { getPackageInformation } from '../../../vscode-extension/api/services/apiService';
import path from 'path';
import { Uri } from 'vscode';

jest.mock('axios');
jest.mock('axios-retry');
jest.mock('../../../vscode-extension/utils/errorHandling', () => ({
  resolveSuccess: jest.fn().mockReturnValue({
    status: 'success',
    code: 200,
    message: 'Package info retrieved successfully',
    responseData: {
      name: 'test-package',
      version: '0.0.1',
      displayName: 'Test Package',
      description: 'A test package for testing',
      aboutPage: {
        title: 'About Test Package',
        content: 'This package is used for testing purposes.',
      },
      osWithVersion: 'linux' + '6.0',
      IDEVersion: '1.93.0',
      platform: 'VSCode',
    },
  }),
}));

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

const mockPkg = {
  name: 'test-package',
  version: '0.0.1',
  displayName: 'Test Package',
  description: 'A test package for testing',
  aboutPage: {
    title: 'About Test Package',
    content: 'This package is used for testing purposes.',
  },
  osWithVersion: 'linux' + '6.0',
  IDEVersion: '1.93.0',
  platform: 'VSCode',
};

describe('getPackageInformation', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return package information successfully', async () => {
    const result: ApiResponse = await getPackageInformation();

    expect(result.status).toBe('success');
    expect(result.code).toBe(200);
    expect(result.message).toBe('Package info retrieved successfully');
    expect(result.responseData).toEqual({
      name: mockPkg.name,
      displayName: mockPkg.displayName,
      version: mockPkg.version,
      description: mockPkg.description,
      aboutPage: mockPkg.aboutPage,
      osWithVersion: mockPkg.osWithVersion,
      IDEVersion: mockPkg.IDEVersion,
      platform: mockPkg.platform,
    });
  });
});
