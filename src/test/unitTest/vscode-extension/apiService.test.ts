import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  getAllAssessFilters,
  getAllProjectList,
  getAllScans,
  getAvailableEnvironments,
  getAvailableTags,
  getAxiosClient,
  getCurrentFileVul,
  getCVEOverview,
  getLibOrgTags,
  getLibraryVulnerabilities,
  getProjectById,
  getScanById,
  getUsageForLibVul,
  updateLibTags,
} from '../../../vscode-extension/api/services/apiService';
import { ShowInformationPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import {
  GetAllConfiguredProjects,
  GetAssessFilter,
} from '../../../vscode-extension/persistence/PersistenceConfigSetting';
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
  commands: {
    registerCommand: jest.fn(),
  },
  languages: {
    registerHoverProvider: jest.fn(),
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
    GetAssessFilter: jest.fn(),
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

  const mockLibraryRequestBody = {
    appId: '456-ABC-789-XYZ',
    applicationName: 'WebGoatIAST',
    tags: [],
    grades: [],
    usage: ['used', 'unused'],
    licenses: [],
    environments: [],
    servers: [],
    severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  };

  const hashId = '123-356-das12-3123-daa';

  beforeEach(() => {
    const contrastURL = 'sfsf';
    const result = getAxiosClient(contrastURL);
    mockAxios = new MockAdapter(axios as any);
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

  describe('getLibraryVulenrabilities', () => {
    it('should return failure if project not found', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [],
      });

      const result = await getLibraryVulnerabilities(mockLibraryRequestBody);
      expect(result.code).toBe(400);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.projectNotFound')
      );
    });

    it('should return failure if project is not found from configured list', async () => {
      const result = await getLibraryVulnerabilities({
        appId: '456-ABC-789-XYZ',
      });
      expect(result.code).toBe(400);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.projectNotFound')
      );
    });

    it('should return failure if initial API call is not 200', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      mockAxios.onPost(/libraries\/filter/).reply(500, {});

      const result = await getLibraryVulnerabilities(mockLibraryRequestBody);
      expect(result.code).toBe(500);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
    });
  });

  it('should return failure if exception is thrown', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [
        {
          projectId: '456-ABC-789-XYZ',
          contrastURL: 'https://xyz.com',
          userName: 'xyz@xyz.com',
          serviceKey: 'ABCDEFGHIJ',
          apiKey: 'PQRS1234TUV5678',
          organizationId: '123-XYZ-456-ABC-789',
          source: 'assess',
        },
      ],
    });
    mockAxios.onPost(/libraries\/filter/).networkErrorOnce();

    const result = await getLibraryVulnerabilities(mockLibraryRequestBody);

    expect(result).toEqual(
      expect.objectContaining({
        code: 500,
        message: local.getTranslation('apiResponse.authenticationFailure'),
      })
    );
  });

  it('should handle paginated library results correctly', async () => {
    const totalLibraries = 120;
    const firstPage = new Array(50).fill({ id: 'lib', name: 'Lib1' });
    const secondPage = new Array(50).fill({ id: 'lib', name: 'Lib2' });
    const thirdPage = new Array(20).fill({ id: 'lib', name: 'Lib3' });
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [
        {
          projectId: '456-ABC-789-XYZ',
          contrastURL: 'https://xyz.com',
          userName: 'xyz@xyz.com',
          serviceKey: 'ABCDEFGHIJ',
          apiKey: 'PQRS1234TUV5678',
          organizationId: '123-XYZ-456-ABC-789',
          source: 'assess',
        },
      ],
    });
    mockAxios
      .onPost(/libraries\/filter/)
      .replyOnce(200, { count: totalLibraries, libraries: firstPage }) // Initial call
      .onPost(/libraries\/filter/)
      .replyOnce(200, { filters: secondPage }) // 2nd page
      .onPost(/libraries\/filter/)
      .replyOnce(200, { filters: thirdPage }); // 3rd page

    const result = await getLibraryVulnerabilities(mockLibraryRequestBody);

    expect(result.status).toBe('failure');
    expect(result.message).toBe(
      local.getTranslation('apiResponse.authenticationFailure')
    );
    expect(result.responseData).toBe(null);
  });

  // Scenario 2: Project found but source is not 'assess'
  it('should return failure if project is found but source is not "assess"', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [{ ...mockConfiguredProject, source: 'other' }],
    });
    mockAxios.onPost(/libraries\/filter/).reply(400, {});
    const result = await getLibraryVulnerabilities(mockLibraryRequestBody);

    expect(GetAllConfiguredProjects).toHaveBeenCalledTimes(6);

    expect(result).toEqual({
      status: 'failure',
      code: 400,
      message: local.getTranslation('apiResponse.projectNotFound'),
      responseData: null,
    });
  });

  it('should return failure if initial API call fails', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [
        {
          projectId: '456-ABC-789-XYZ',
          contrastURL: 'https://xyz.com',
          userName: 'xyz@xyz.com',
          serviceKey: 'ABCDEFGHIJ',
          apiKey: 'PQRS1234TUV5678',
          organizationId: '123-XYZ-456-ABC-789',
          source: 'assess',
        },
      ],
    });

    // Mock the HTTP failure (e.g., 500 Internal Server Error)
    mockAxios.onPost(/libraries\/filter/).reply(500, {});

    const result = await getLibraryVulnerabilities(mockLibraryRequestBody);

    expect(result).toEqual({
      status: 'failure',
      code: 500,
      message: local.getTranslation('apiResponse.authenticationFailure'),
      responseData: null,
    });
  });

  it('should return failure if exception is thrown', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [
        {
          projectId: '456-ABC-789-XYZ',
          contrastURL: 'https://xyz.com',
          userName: 'xyz@xyz.com',
          serviceKey: 'ABCDEFGHIJ',
          apiKey: 'PQRS1234TUV5678',
          organizationId: '123-XYZ-456-ABC-789',
          source: 'assess',
        },
      ],
    });
    mockAxios.onPost(/libraries\/filter/).networkErrorOnce();

    const result = await getLibraryVulnerabilities(mockLibraryRequestBody);

    expect(result).toEqual(
      expect.objectContaining({
        code: 500,
        message: local.getTranslation('apiResponse.authenticationFailure'),
      })
    );
  });

  describe('getAvailableEnvironments', () => {
    it('should return failure if project not found', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [],
      });

      const result = await getAvailableEnvironments('123-ASD-123');
      expect(result.code).toBe(400);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.projectNotFound')
      );
    });

    it('should return failure if project is not found from configured list', async () => {
      const result = await getAvailableEnvironments('123-ASD-123');
      expect(result.code).toBe(400);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.projectNotFound')
      );
    });

    it('should return failure if initial API call is not 200', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      mockAxios
        .onPost(/orgtraces\/filter\/servers-environment\/listing/)
        .reply(500, {});

      const result = await getAvailableEnvironments('456-ABC-789-XYZ');
      expect(result.code).toBe(500);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
    });

    it('should return failure if exception is thrown', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });
      mockAxios
        .onPost(/orgtraces\/filter\/servers-environment\/listing/)
        .networkErrorOnce();

      const result = await getAvailableEnvironments('123-ASD-123');

      expect(result).toEqual(
        expect.objectContaining({
          code: 400,
          message: local.getTranslation('apiResponse.projectNotFound'),
        })
      );
    });

    it('should return success with environments data', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      const mockResponse = {
        filters: [
          {
            keycode: 'DEVELOPMENT',
            label: 'Development',
            count: 9,
            new_group: false,
          },
          {
            keycode: 'QA',
            label: 'QA',
            count: 0,
            new_group: false,
          },
          {
            keycode: 'PRODUCTION',
            label: 'Production',
            count: 0,
            new_group: false,
          },
        ],
      };

      mockAxios
        .onPost(/orgtraces\/filter\/servers-environment\/listing/)
        .reply(200, mockResponse);

      const result = await getAvailableEnvironments('456-ABC-789-XYZ');

      expect(result.code).toBe(200);
      expect(result.responseData).toEqual(mockResponse.filters);
    });

    it('should return success with tags data', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      const mockResponse = {
        filters: [
          {
            keycode: '(no tags)',
            label: 'Not tagged',
            count: 4,
            new_group: false,
          },
          {
            keycode: 'Check Check 1234',
            label: 'Check Check 1234',
            count: 2,
            new_group: false,
          },
          {
            keycode: 'hghgcghc',
            label: 'hghgcghc',
            count: 1,
            new_group: false,
          },
        ],
      };

      mockAxios
        .onPost(/orgtraces\/filter\/servers-environment\/listing/)
        .reply(200, mockResponse);

      const result = await getAvailableEnvironments('456-ABC-789-XYZ');

      expect(result.code).toBe(200);
      expect(result.responseData).toEqual(mockResponse.filters);
    });

    it('should return success with empty filters when no environments or tags are found', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      const mockResponse = { filters: [] };

      mockAxios
        .onPost(/orgtraces\/filter\/servers-environment\/listing/)
        .reply(200, mockResponse);

      const result = await getAvailableEnvironments('456-ABC-789-XYZ');

      expect(result.code).toBe(200);
      expect(result.responseData).toEqual([]);
    });

    it('should return failure if project source is not "assess"', async () => {
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'library', // not "assess"
          },
        ],
      });

      const result = await getAvailableEnvironments('456-ABC-789-XYZ');

      expect(result.code).toBe(400);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.projectNotFound')
      );
    });
  });

  describe('getAvailableTags', () => {
    it('should return failure if project not found', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [],
      });

      const result = await getAvailableTags('123-ASD-123', params);
      expect(result.code).toBe(500);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
    });

    it('should return failure if project is not found from configured list', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      const result = await getAvailableTags('123-ASD-123', params);
      expect(result.code).toBe(500);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
    });

    it('should return failure if initial API call is not 200', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });
      mockAxios.onGet(/tags\/application\/list/).reply(500, {});

      const result = await getAvailableTags('456-ABC-789-XYZ', params);
      expect(result.code).toBe(500);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
    });

    it('should return failure if exception is thrown', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });
      mockAxios.onGet(/tags\/application\/list/).networkErrorOnce();

      const result = await getAvailableTags('123-ASD-123', params);

      expect(result).toEqual(
        expect.objectContaining({
          code: 500,
          message: local.getTranslation('apiResponse.authenticationFailure'),
        })
      );
    });

    it('should return success with TagsgetAvailableTags data', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      const mockResponse = [
        {
          keycode: 'tags',
          label: 'tags',
        },
        {
          keycode: 'QA',
          label: 'QA',
        },
      ];

      mockAxios.onGet(/tags\/application\/list/).reply(200, {
        success: true,
        messages: ['Tags for application loaded successfully'],
        tags: ['tags', 'QA'],
      });
      const result = await getAvailableTags('456-ABC-789-XYZ', params);

      expect(result.code).toBe(200);
      expect(result.responseData).toEqual(mockResponse);
    });

    it('should return success with tags data', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      const mockResponse = [
        {
          keycode: 'tags',
          label: 'tags',
        },
        {
          keycode: 'tags1',
          label: 'tags1',
        },
      ];

      mockAxios.onGet(/tags\/application\/list/).reply(200, {
        success: true,
        messages: ['Tags for application loaded successfully'],
        tags: ['tags', 'tags1'],
      });

      const result = await getAvailableTags('456-ABC-789-XYZ', params);

      expect(result.code).toBe(200);
      expect(result.responseData).toEqual(mockResponse);
    });

    it('should return success with empty filters when no TagsgetAvailableTags or tags are found', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'assess',
          },
        ],
      });

      mockAxios.onGet(/tags\/application\/list/).reply(200, {
        success: true,
        messages: [],
        tags: [],
      });

      const result = await getAvailableTags('456-ABC-789-XYZ', params);

      expect(result.code).toBe(200);
      expect(result.responseData).toEqual([]);
    });

    it('should return failure if project source is not "assess"', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
        responseData: [
          {
            projectId: '456-ABC-789-XYZ',
            contrastURL: 'https://xyz.com',
            userName: 'xyz@xyz.com',
            serviceKey: 'ABCDEFGHIJ',
            apiKey: 'PQRS1234TUV5678',
            organizationId: '123-XYZ-456-ABC-789',
            source: 'library', // not "assess"
          },
        ],
      });

      const result = await getAvailableTags('456-ABC-789-XYZ', params);

      expect(result.code).toBe(500);
      expect(result.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
    });
  });

  describe('getAllAssessFilters', () => {
    it('should return the correct filters when the workspace filter is valid', async () => {
      const mockFilter = {
        servers: ['1'],
        appVersionTags: ['v1.0'],
        severities: 'CRITICAL,HIGH',
        status: 'REPORTED,CONFIRMED',
        startDate: { timeStamp: 1618900000000 },
        endDate: { timeStamp: 1618990000000 },
        agentSessionId: 'session1',
        metadataFilters: { key: 'value' },
        environments: ['DEV', 'PROD'],
        applicationTags: ['tag1', 'tag2'],
      };

      (GetAssessFilter as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      const result = await getAllAssessFilters();

      expect(result).toEqual({
        severities: ['CRITICAL', 'HIGH'],
        status: ['REPORTED', 'CONFIRMED'],
        servers: ['1'],
        appVersionTags: ['v1.0'],
        startDate: 1618900000000,
        endDate: 1618990000000,
        agentSessionId: 'session1',
        metadataFilters: { key: 'value' },
        environments: ['DEV', 'PROD'],
        applicationTags: ['tag1', 'tag2'],
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

      expect(result?.servers).toEqual(['1']);
    });

    it('should handle appVersionTags filter correctly', async () => {
      const mockFilter = {
        appVersionTags: ['v1.0'],
      };
      (GetAssessFilter as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      const result = await getAllAssessFilters();

      expect(result?.appVersionTags).toEqual(['v1.0']);
    });

    it('should handle appVersionTags filter correctly', async () => {
      const mockFilter = {
        environments: ['v1.0'],
      };
      (GetAssessFilter as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      const result = await getAllAssessFilters();

      expect(result?.environments).toEqual(['v1.0']);
    });

    it('should handle appVersionTags filter correctly', async () => {
      const mockFilter = {
        applicationTags: ['check'],
      };
      (GetAssessFilter as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      const result = await getAllAssessFilters();

      expect(result?.applicationTags).toEqual(['check']);
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
    it('should replace NOT_A_PROBLEM in status with NotAProblem', async () => {
      const mockFilter = {
        status: 'REPORTED,NOT_A_PROBLEM,CONFIRMED',
      };
      (GetAssessFilter as jest.Mock).mockResolvedValue({
        responseData: mockFilter,
      });

      const result = await getAllAssessFilters();

      expect(result?.status).toEqual(['REPORTED', 'NotAProblem', 'CONFIRMED']);
    });
  });

  describe('getUsageForLibVul', () => {
    it('should return failure if appId not found', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };

      const result = await getUsageForLibVul(
        undefined,
        '123-3123ada-123asda-1231',
        params
      );

      expect(result).toEqual({
        code: 400,
        status: 'failure',
        responseData: null,
        message: 'Project not Configured',
      });
    });

    it('should return failure if the credentials are invaild', async () => {
      const invalidParams = { ...mockConfiguredProject, apiKey: '' };

      const response = await getUsageForLibVul(
        '132-sada-3asd-23',
        '123-3123ada-123asda-1231',
        invalidParams
      );

      expect(response.code).toBe(400);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.missingOneOrMoreError')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should fetch the usage data by appId successfully', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      const mockResponse = {
        total: 1,
        id: '123-34544-3453',
        observations: [
          {
            name: 'asdad',
            firstObservedTime: '2025-05-19T10:00:00Z',
            lastObservedTime: '2025-05-19T10:00:00Z',
          },
        ],
      };

      mockAxios
        .onGet(
          `/ng/organizations/${params.organizationId}/applications/123-123-123/libraries/3123-dasdc-312das-dasd/reports/library-usage`
        )
        .reply(200, mockResponse);

      const response = await getUsageForLibVul(
        '123-123-123',
        '3123-dasdc-312das-dasd',
        params
      );

      expect(response).toEqual({
        code: 200,
        message: 'Library Usage report retrieved successfully',
        responseData: mockResponse,
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/organizations/${params.organizationId}/applications/123-123-123/libraries/3123-dasdc-312das-dasd/reports/library-usage`
        )
        .reply(500, {});

      const response = await getUsageForLibVul(
        '123-123-123',
        '3123-dasdc-312das-dasd',
        params
      );

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle non-200 response with generic error', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/organizations/${params.organizationId}/applications/123-123-123/libraries/3123-dasdc-312das-dasd/reports/library-usage`
        )
        .reply(400, { message: 'Bad Request' });

      const response = await getUsageForLibVul(
        '123-123-123',
        '3123-dasdc-312das-dasd',
        params
      );

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle exception and return authentication failure', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/organizations/${params.organizationId}/applications/123-123-123/libraries/3123-dasdc-312das-dasd/reports/library-usage`
        )
        .networkError(); // Simulate a network failure

      const response = await getUsageForLibVul(
        '123-123-123',
        '3123-dasdc-312das-dasd',
        params
      );

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });
  });

  describe('getLibOrgTags', () => {
    it('should return failure if the credentials are invaild', async () => {
      const invalidParams = { ...mockConfiguredProject, apiKey: '' };

      const response = await getLibOrgTags(invalidParams);

      expect(response.code).toBe(400);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.missingOneOrMoreError')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should fetch the tags data by org successfully', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      const mockResponse = {
        tags: ['test', 'test1', 'example', 'sacumenTest'],
      };
      mockAxios
        .onGet(
          `/ng/${params.organizationId}/tags/libraries/list?expand=skip_links`
        )
        .reply(200, mockResponse);

      const response = await getLibOrgTags(params);

      expect(response).toEqual({
        code: 200,
        message: 'Library Tags fetched successfully',
        responseData: mockResponse.tags,
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/${params.organizationId}/tags/libraries/list?expand=skip_links`
        )
        .reply(500, {});

      const response = await getLibOrgTags(params);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle non-200 response with generic error', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/${params.organizationId}/tags/libraries/list?expand=skip_links`
        )
        .reply(400, { message: 'Bad Request' });

      const response = await getLibOrgTags(params);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle exception and return authentication failure', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/${params.organizationId}/tags/libraries/list?expand=skip_links`
        )
        .networkError(); // Simulate a network failure

      const response = await getLibOrgTags(params);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });
  });

  describe('updateLibTags', () => {
    it('should return failure if the credentials are invaild', async () => {
      const invalidParams = { ...mockConfiguredProject, apiKey: '' };

      const response = await updateLibTags(invalidParams, hashId, [], []);

      expect(response.code).toBe(400);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.missingOneOrMoreError')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should update the tags successfully', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      const mockResponse = {
        messages: ['Libraries tagged successfully'],
      };
      mockAxios
        .onPut(
          `/ng/${params.organizationId}/tags/libraries/bulk?expand=skip_links`
        )
        .reply(200, mockResponse);

      const response = await updateLibTags(
        params,
        hashId,
        ['1231-dasd1'],
        ['13123-dad-123']
      );

      expect(response).toEqual({
        code: 200,
        message: 'Library Tags updated successfully',
        responseData: mockResponse.messages,
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/${params.organizationId}/tags/libraries/bulk?expand=skip_links`
        )
        .reply(500, {});

      const response = await updateLibTags(params, hashId, [], []);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle non-200 response with generic error', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/${params.organizationId}/tags/libraries/bulk?expand=skip_links`
        )
        .reply(400, { message: 'Bad Request' });

      const response = await updateLibTags(params, hashId, [], []);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle exception and return authentication failure', async () => {
      const params = {
        apiKey: 'test-key',
        contrastURL: 'https://test.com',
        userName: 'user',
        serviceKey: 'key',
        organizationId: 'org1',
        source: 'assess',
      };
      mockAxios
        .onGet(
          `/ng/${params.organizationId}/tags/libraries/bulk?expand=skip_links`
        )
        .networkError(); // Simulate a network failure

      const response = await updateLibTags(params, hashId, [], []);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });
  });

  describe('getCVEOverview', () => {
    const validParams = {
      apiKey: 'test-api-key',
      contrastURL: 'https://test.contrast.com',
      userName: 'test-user',
      serviceKey: 'test-service-key',
      organizationId: 'org-id',
      source: 'assess',
    };

    const cveId = 'CVE-2024-0056';

    it('should return failure if the credentials are invalid', async () => {
      const invalidParams = { ...validParams, apiKey: '' };

      const response = await getCVEOverview(cveId, invalidParams);

      expect(response.code).toBe(400);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.missingOneOrMoreError')
      );
    });

    it('should return success when API returns 200', async () => {
      const mockCVEResponse = {
        cve: { name: cveId },
        impactStats: {},
        apps: [],
        servers: [],
      };

      mockAxios
        .onGet(`/ng/organizations/${validParams.organizationId}/cves/${cveId}`)
        .reply(200, mockCVEResponse);

      const response = await getCVEOverview(cveId, validParams);

      expect(response).toEqual({
        code: 200,
        message: "CVE's Overview Retrieved successfully",
        responseData: mockCVEResponse,
        status: 'success',
      });
    });

    it('should return failure on API 500 status', async () => {
      mockAxios
        .onGet(`/ng/organizations/${validParams.organizationId}/cves/${cveId}`)
        .reply(500, {});

      const response = await getCVEOverview(cveId, validParams);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Error retrieving ServerList')
      );
    });

    it('should return failure on API 400 with error message', async () => {
      mockAxios
        .onGet(`/ng/organizations/${validParams.organizationId}/cves/${cveId}`)
        .reply(400, { message: 'Bad Request' });

      const response = await getCVEOverview(cveId, validParams);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });

      expect(loggerInstance.logMessage).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      mockAxios
        .onGet(`/ng/organizations/${validParams.organizationId}/cves/${cveId}`)
        .networkError();

      const response = await getCVEOverview(cveId, validParams);

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });

      expect(loggerInstance.logMessage).toHaveBeenCalled();
    });

    it('should return failure for invalid contrastURL format', async () => {
      const invalidParams = { ...validParams, contrastURL: 'invalid-url' };

      const response = await getCVEOverview(cveId, invalidParams);

      expect(response.code).toBe(500); // Assuming validation fails
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
    });

    it('should log proper error when error.message is undefined', async () => {
      mockAxios
        .onGet(`/ng/organizations/${validParams.organizationId}/cves/${cveId}`)
        .reply(500, {});

      const response = await getCVEOverview(cveId, validParams);

      expect(response.code).toBe(500);
      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Error retrieving ServerList')
      );
    });
  });
});
