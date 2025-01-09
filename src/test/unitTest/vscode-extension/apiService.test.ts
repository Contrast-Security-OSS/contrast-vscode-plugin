import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  getAllProjectList,
  getAllScans,
  getAxiosClient,
  getCurrentFileVul,
  getProjectById,
  getScanById,
} from '../../../vscode-extension/api/services/apiService';
import { ShowInformationPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import { GetAllConfiguredProjects } from '../../../vscode-extension/persistence/PersistenceConfigSetting';
import path from 'path';
import { Uri } from 'vscode';
import { l10n } from '../../../l10n';
import { loggerInstance } from '../../../vscode-extension/logging/logger';

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
    activeTextEditor: null,
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

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  ...jest.requireActual('../../../vscode-extension/api/services/apiService'),
  getAxiosClient: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopupWithOptions: jest.fn(),
    ShowInformationPopup: jest.fn(),
  })
);

jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => ({
    GetAllConfiguredProjects: jest.fn(),
    GetFilters: jest.fn(),
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      postMessage: jest.fn(),
    },
  })
);

(ShowInformationPopup as jest.Mock).mockResolvedValue(
  'Fetching Project Details.'
);

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

const local = new l10n('en');

describe('VS Code Extension Plugin Tests', () => {
  let mockAxios: MockAdapter;
  let mockGetAxiosClient: jest.Mock;

  const mockProjectId = '1';
  const mockConfiguredProject = {
    projectId: mockProjectId,
    apiKey: 'mockApiKey',
    userName: 'mockUser',
    serviceKey: 'mockServiceKey',
    contrastURL: 'http://test.url',
    organizationId: 'mockOrgId',
    source: 'scan',
  };

  beforeEach(() => {
    const contrastURL = 'sfsf';
    const result = getAxiosClient(contrastURL);
    mockAxios = new MockAdapter(axios);
    mockGetAxiosClient = jest.fn();
    mockGetAxiosClient.mockReturnValue(result);

    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should fetch all project list successfully', async () => {
    const params = {
      apiKey: 'testApiKey',
      contrastURL: 'http://test.url',
      userName: 'testUser ',
      serviceKey: 'testServiceKey',
      organizationId: 'testOrgId',
      source: 'scan',
    };

    mockGetAxiosClient.mockReturnValue(axios);

    mockAxios.onGet(/\/sast\/organizations\/testOrgId\/projects/).reply(200, {
      content: [{ projectId: '1', name: 'Project 1' }],
      totalPages: 1,
    });

    const response = await getAllProjectList(params);
    expect(response.code).toBe(200);
    expect(response.message).toBe(
      local.getTranslation('apiResponse.projectsFetchedSuccessful')
    );
  });

  it('should handle API failure when server returns an error', async () => {
    mockAxios.onGet(/assess\/organizations\/org1\/projects/).reply(500, {
      content: [{ id: '1', name: 'Test Project' }],
      totalPages: 1,
    });

    const params = {
      apiKey: 'test-key',
      contrastURL: 'https://test.com',
      userName: 'user',
      serviceKey: 'key',
      organizationId: 'org1',
      source: 'assess',
    };

    const response = await getAllProjectList(params);
    expect(response.code).toBe(500);
    expect(response.message).toContain(
      local.getTranslation('apiResponse.badRequest')
    );
  });

  it('should fetch project by ID successfully', async () => {
    const params = {
      apiKey: 'testApiKey',
      contrastURL: 'http://test.url',
      userName: 'testUser ',
      serviceKey: 'testServiceKey',
      organizationId: 'testOrgId',
      source: 'scan',
      projectId: '1',
      projectName: 'test1',
      minute: 1440,
    };

    mockGetAxiosClient.mockReturnValue(axios);

    mockAxios
      .onGet(/\/sast\/organizations\/testOrgId\/projects\/1/)
      .reply(200, {});

    const response = await getProjectById(params);
    expect(response).toBe(true);
  });

  it('should fetch project by ID successfully', async () => {
    const params = {
      apiKey: 'testApiKey',
      contrastURL: 'http://test.url',
      userName: 'testUser ',
      serviceKey: 'testServiceKey',
      organizationId: 'testOrgId',
      source: 'scan',
      projectId: '1',
      projectName: 'test1',
      minute: 1440,
    };

    mockGetAxiosClient.mockReturnValue(axios);

    mockAxios
      .onGet(/\/sast\/organizations\/testOrgId\/projects\/1/)
      .reply(400, {});

    const response = await getProjectById(params);
    expect(response).toBe(false);
  });

  it('should fetch project by ID successfully', async () => {
    mockAxios
      .onGet(/\/assess\/organizations\/org1\/projects\/123\/scans\/sag123/)
      .reply(200, {
        content: [{ id: '456', vulnerability: 'Critical' }],
        totalPages: 1,
      });

    const params = {
      apiKey: 'test-key',
      userName: 'user',
      serviceKey: 'key',
      organizationId: 'org1',
      source: 'assess',
      projectId: '123',
      contrastURL: 'https://localhost',
      projectName: 'sac',
      minute: 1220,
    };

    mockGetAxiosClient.mockReturnValue(axios);

    const scanId = 'sag123';
    const result = await getScanById(params, scanId);
    expect(result.code).toBe(200);
  });

  it('should fetch project by ID failure response', async () => {
    mockAxios
      .onGet(/\/assess\/organizations\/org1\/projects\/123\/scans\/sag123/)
      .reply(201, {
        content: [],
        totalPages: 0,
      });

    const params = {
      apiKey: 'test-key',
      userName: 'user',
      serviceKey: 'key',
      organizationId: 'org1',
      source: 'assess',
      projectId: '123',
      contrastURL: 'https://localhost',
      projectName: 'sac',
      minute: 1220,
    };

    const scanId = 'sag123';
    const result = await getScanById(params, scanId);
    expect(result.code).toBe(400);
  });

  describe('getAllScans', () => {
    it('should fetch all scans for a project', async () => {
      mockAxios
        .onGet(/\/assess\/organizations\/.+\/projects\/.+\/scans/)
        .reply(200, {
          content: [{ id: 'scan1' }],
          totalPages: 1,
        });

      const params = {
        apiKey: 'test-key',
        contrastURL: 'localhost',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        projectId: '123',
        source: 'assess',
        projectName: 'sac',
        minute: 1220,
      };

      const response = await getAllScans(params);
      if (
        response.responseData !== null &&
        Array.isArray(response.responseData)
      ) {
        expect(response.responseData.length).toBeGreaterThan(0);
      } else {
        throw new Error('response.responseData is either null or not an array');
      }

      expect(response.code).toBe(200);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.scanRetrievedSuccessful')
      );
    });

    it('should return an empty response when no scans are available', async () => {
      mockAxios
        .onGet(/\/assess\/organizations\/.+\/projects\/.+\/scans/)
        .reply(200, {
          content: [],
          totalPages: 1,
        });

      const params = {
        apiKey: 'test-key',
        contrastURL: 'localhost',
        userName: 'user',
        serviceKey: 'service-key',
        organizationId: 'org1',
        projectId: '123',
        source: 'assess',
        projectName: 'sac',
        minute: 1220,
      };

      const response = await getAllScans(params);
      expect(response.code).toBe(200);
      if (
        response.responseData !== null &&
        Array.isArray(response.responseData)
      ) {
      } else {
        throw new Error('response.responseData is either null or not an array');
      }
      expect(response.message).toBe(
        local.getTranslation('apiResponse.scanRetrievedSuccessful')
      );
    });

    it('should return a failure response ', async () => {
      mockAxios
        .onGet(/\/assess\/organizations\/.+\/projects\/.+\/scans/)
        .reply(201, {
          content: [],
          totalPages: 1,
        });

      const params = {
        apiKey: 'test-key',
        contrastURL: 'localhost',
        userName: 'user',
        serviceKey: 'service-key',
        organizationId: 'org1',
        projectId: '123',
        source: 'assess',
        projectName: 'sac',
        minute: 1220,
      };

      const response = await getAllScans(params);
      expect(response.code).toBe(400);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.failedToRetrieveScan')
      );
    });

    it('should handle API failure gracefully', async () => {
      mockAxios
        .onGet(/\/assess\/organizations\/.+\/projects\/.+\/scans/)
        .reply(500, {
          content: [{ id: 'scan1' }],
          totalPages: 1,
        });

      const params = {
        apiKey: 'test-key',
        contrastURL: 'localhost',
        userName: 'user',
        serviceKey: 'service-key',
        organizationId: 'org1',
        projectId: '123',
        source: 'assess',
        projectName: 'sac',
        minute: 1220,
      };

      const response = await getAllScans(params);
      expect(response.code).toBe(500);
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(7);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.errorFetchingScanResult')
      );
    });

    it('should show information popup during the fetch process', async () => {
      mockAxios
        .onGet(/\/assess\/organizations\/.+\/projects\/.+\/scans/)
        .reply(200, {
          content: [{ id: 'scan1' }],
          totalPages: 1,
        });

      const params = {
        apiKey: 'test-key',
        contrastURL: 'localhost',
        userName: 'user',
        serviceKey: 'service-key',
        organizationId: 'org1',
        projectId: '123',
        source: 'assess',
        projectName: 'sac',
        minute: 1220,
      };

      await getAllScans(params);

      expect(ShowInformationPopup).toHaveBeenCalledWith(
        local.getTranslation('apiResponse.fetchingProjectDetails')
      );
    });
  });

  it('should return no active file error when no editor is open', async () => {
    const response = await getCurrentFileVul();
    expect(response.code).toBe(400);
  });
});
