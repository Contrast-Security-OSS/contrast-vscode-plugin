import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getOrganisationName } from '../../../vscode-extension/api/services/apiService'; // Adjust import based on your structure
import { authBase64 } from '../../../webview/utils/authBase64';
import path from 'path';
import { Uri } from 'vscode';
import { loggerInstance } from '../../../vscode-extension/logging/logger';

jest.mock('../../../webview/utils/authBase64', () => ({
  authBase64: jest.fn(),
}));

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

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  ...jest.requireActual('../../../vscode-extension/api/services/apiService'),
  getAxiosClient: jest.fn(),
}));

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

describe('getOrganisationName', () => {
  let mockAxios: MockAdapter;
  let mockGetAxiosClient: jest.Mock;

  const mockConfig = {
    apiKey: 'fakeApiKey',
    contrastURL: 'https://local.com',
    userName: 'testUser',
    serviceKey: 'fakeServiceKey',
    organizationId: 'org123',
    source: 'someSource',
    projectName: 'TestProject',
    minute: 5,
  };

  beforeEach(() => {
    mockAxios = new MockAdapter(axios as any);
    mockGetAxiosClient = jest.fn();
    mockGetAxiosClient.mockReturnValue(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should return the organization name when the API call is successful', async () => {
    const mockConfig = {
      apiKey: 'fakeApiKey',
      contrastURL: 'https://local.com',
      userName: 'testUser',
      serviceKey: 'fakeServiceKey',
      organizationId: 'org123',
      source: 'someSource',
      projectName: 'TestProject',
      minute: 5,
    };

    mockAxios
      .onGet(`/ng/profile/organizations/${mockConfig.organizationId}`)
      .reply(200, {
        organization: { name: 'Test Organization' },
      });

    (authBase64 as jest.Mock).mockReturnValue('mockedAuthHeader');

    const result = await getOrganisationName(mockConfig);

    expect(result).toBe('Test Organization');
  });

  it('should return false when the API call fails', async () => {
    mockAxios
      .onGet(`/ng/profile/organizations/${mockConfig.organizationId}`)
      .reply(500);

    const result = await getOrganisationName(mockConfig);

    expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);

    expect(result).toBe(false);
  });

  it('should return false if no organization name is found in the response', async () => {
    mockAxios
      .onGet(`/ng/profile/organizations/${mockConfig.organizationId}`)
      .reply(200, {});

    const result = await getOrganisationName(mockConfig);

    expect(result).toBe(false);
  });
});
