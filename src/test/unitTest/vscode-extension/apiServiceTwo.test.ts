import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  addMarkByOrgId,
  addTagsByOrgId,
  getAllApplicationsByOrgId,
  getApplicationById,
  getAxiosClient,
  getBuildNumber,
  getCustomSessionMetaData,
  getLibFilterListByAppId,
  getMostRecentMetaData,
  getServerListbyOrgId,
  getVulnerabilityEvents,
  getVulnerabilityHttps,
  getVulnerabilityIntroTextandRisk,
  getVulnerabilityLineNumberandFileName,
  getVulnerabilityRecommendation,
} from '../../../vscode-extension/api/services/apiService';
import { ShowInformationPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import { loggerInstance } from '../../../vscode-extension/logging/logger';
import path from 'path';
import { Uri } from 'vscode';
import { l10n } from '../../../l10n';
import { GetAllConfiguredProjects } from '../../../vscode-extension/persistence/PersistenceConfigSetting';

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopupWithOptions: jest.fn(),
    ShowInformationPopup: jest.fn(),
    ShowErrorPopup: jest.fn(),
  })
);

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  ...jest.requireActual('../../../vscode-extension/api/services/apiService'),
  getAxiosClient: jest.fn(),
}));

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

(ShowInformationPopup as jest.Mock).mockResolvedValue(
  'Fetching Project Details.'
);

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

const local = new l10n('en');

describe('API Service Unit Tests', () => {
  let mockAxios: MockAdapter;
  let mockGetAxiosClient: jest.Mock;
  const mockProjectId = '1';
  const mockList = 'tags';
  const mockParams = {
    projectId: mockProjectId,
    apiKey: 'testApiKey',
    contrastURL: 'http://test.url',
    userName: 'testUser',
    serviceKey: 'testServiceKey',
    organizationId: 'org1',
    source: 'scan',
  };

  const mockApplicationId = 'app1';
  const mockOrgId = 'org1';
  const mockTraceId = 'trace1';
  const mockTraceIdList = ['trace1', 'trace2'];
  const mockTags = ['Tag1', 'Tag2'];
  const mockTagsRemove = ['Tag3'];
  const mockStatus = 'Reported';
  const mockNote = 'Test notes';

  const mockRequestPayload = {
    traces_uuid: mockTraceId,
    tags: mockTags,
    tags_remove: mockTagsRemove,
  };

  const mockrequestPayload = {
    traces: mockTraceId,
    status: mockStatus,
    note: mockNote,
  };

  const mockParamadd = {
    orgId: 'org123',
    traceId: ['traces123'],
    status: 'status',
    note: 'note',
    substatus: '',
  };

  beforeEach(() => {
    const contrastURL = 'sfsf';
    const result = getAxiosClient(contrastURL);
    mockAxios = new MockAdapter(axios as any);
    mockGetAxiosClient = jest.fn();
    mockGetAxiosClient.mockReturnValue(result);

    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockParams],
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('getAllApplicationsByOrgId', () => {
    it('should fetch all applications successfully', async () => {
      const mockResponse = {
        applications: [
          { app_id: '1', name: 'App 1' },
          { app_id: '2', name: 'App 2' },
        ],
      };

      mockAxios.onPost('/ng/org1/applications/filter').reply(200, mockResponse);

      const response = await getAllApplicationsByOrgId(mockParams);
      expect(response.code).toBe(200);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.fechedSuccess')
      );
    });

    it('should handle API failure gracefully', async () => {
      mockAxios
        .onPost(
          '/ng/org1/applications/filter?offset=0&limit=25&expand=license%2Ccompliance_policy%2Cskip_links%2Ctechnologies%2Ctrace_severity_breakdown%2Cmetadata%2Cscores&sort=appName'
        )
        .reply(500, {});

      const response = await getAllApplicationsByOrgId(mockParams);
      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should return a failure when parameters are missing', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };
      const response = await getAllApplicationsByOrgId(invalidParams);
      expect(response.code).toBe(400);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.missingOneOrMoreError')
      );
    });

    it('should handle empty applications response', async () => {
      const mockResponse = { applications: [] };

      mockAxios.onPost('/ng/org1/applications/filter').reply(200, mockResponse);

      const response = await getAllApplicationsByOrgId(mockParams);
      expect(response.code).toBe(200);
    });
  });

  describe('getApplicationById', () => {
    it('should fetch application by ID successfully', async () => {
      const mockResponse = {
        application: {
          app_id: 'app1',
          name: 'Test Application',
        },
      };

      mockAxios
        .onGet(`/ng/org1/applications/${mockApplicationId}`)
        .reply(200, mockResponse);

      const response = await getApplicationById(mockApplicationId, mockParams);

      expect(response.code).toBe(200);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.fechedSuccess')
      );
      expect(response).toEqual({
        code: 200,
        message: 'Applications fetched successfully.',
        responseData: {
          id: 'app1',
          name: 'Test Application',
        },
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(`/ng/org1/applications/${mockApplicationId}`)
        .reply(500, {});

      const response = await getApplicationById(mockApplicationId, mockParams);

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle missing parameters and return failure (400 status)', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };

      const response = await getApplicationById(
        mockApplicationId,
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

    it('should handle invalid application ID (404 status)', async () => {
      mockAxios
        .onGet(`/ng/org1/applications/${mockApplicationId}`)
        .reply(500, {});

      const response = await getApplicationById(mockApplicationId, mockParams);

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(`/ng/org1/applications/${mockApplicationId}`)
        .networkError();

      const response = await getApplicationById(mockApplicationId, mockParams);

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getServerListbyOrgId', () => {
    it('should fetch getServerListbyOrgId by OrgId successfully', async () => {
      const mockResponse = {
        servers: [
          {
            server_id: 'app1',
            name: 'Test Application',
          },
        ],
      };

      mockAxios
        .onGet(`/ng/${mockOrgId}/servers/filter`)
        .reply(200, mockResponse);

      const response = await getServerListbyOrgId(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'ServerList fetched successfully.',
        responseData: [
          {
            server_id: 'app1',
            name: 'Test Application',
          },
        ],
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios.onGet(`/ng/${mockOrgId}/servers/filter`).reply(500, {});

      const response = await getServerListbyOrgId(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle missing parameters and return failure (400 status)', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };

      const response = await getServerListbyOrgId(
        mockOrgId,
        mockApplicationId,
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

    it('should handle invalid application ID (404 status)', async () => {
      mockAxios.onGet(`/ng/${mockOrgId}/servers/filter`).reply(500, {});

      const response = await getServerListbyOrgId(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios.onGet(`/ng/org1/applications/${mockOrgId}`).networkError();

      const response = await getServerListbyOrgId(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getBuildNumber', () => {
    it('should fetch getBuildNumber by OrgId and appId successfully', async () => {
      const mockResponse = {
        filters: [
          {
            keycode: 'app1',
            label: 'Test Application',
          },
        ],
      };

      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockApplicationId}/filter/appversiontags/listing`
        )
        .reply(200, mockResponse);

      const response = await getBuildNumber(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'BuildNumber fetched successfully.',
        responseData: [
          {
            keycode: 'app1',
            label: 'Test Application',
          },
        ],
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockApplicationId}/filter/appversiontags/listing`
        )
        .reply(500, {});

      const response = await getBuildNumber(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle missing parameters and return failure (400 status)', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };

      const response = await getBuildNumber(
        mockOrgId,
        mockApplicationId,
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

    it('should handle invalid application ID (404 status)', async () => {
      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockApplicationId}/filter/appversiontags/listing`
        )
        .reply(500, {});

      const response = await getBuildNumber(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockApplicationId}/filter/appversiontags/listing`
        )
        .networkError();

      const response = await getBuildNumber(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getCustomSessionMetaData', () => {
    it('should fetch getBuildNumber by OrgId and appId successfully', async () => {
      const mockResponse = {
        filters: [
          {
            id: 'app1',
            label: 'Test Application',
            values: [
              {
                value: 'names',
                count: 20,
              },
            ],
          },
        ],
      };

      mockAxios
        .onGet(`/ng/${mockOrgId}/metadata/session/${mockApplicationId}/filters`)
        .reply(200, mockResponse);

      const response = await getCustomSessionMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'CustomSessionMetaData fetched successfully.',
        responseData: [
          {
            id: 'app1',
            label: 'Test Application',
            values: [
              {
                value: 'names',
                count: 20,
              },
            ],
          },
        ],
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/metadata/session/${mockApplicationId}/filters`)
        .reply(500, {});

      const response = await getCustomSessionMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle missing parameters and return failure (400 status)', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };

      const response = await getCustomSessionMetaData(
        mockOrgId,
        mockApplicationId,
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

    it('should handle invalid application ID (404 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/metadata/session/${mockApplicationId}/filters`)
        .reply(500, {});

      const response = await getCustomSessionMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/metadata/session/${mockApplicationId}/filters`)
        .networkError();

      const response = await getCustomSessionMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getMostRecentMetaData', () => {
    it('should fetch getMostRecentMetaData by OrgId and appId successfully', async () => {
      const mockResponse = {
        agentSession: {
          agentSessionId: 'sfdbsd457fbd45c',
        },
      };
      mockAxios
        .onGet(
          `/ng/organizations/${mockOrgId}/applications/${mockApplicationId}/agent-sessions/latest`
        )
        .reply(200, mockResponse);

      const response = await getMostRecentMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'MostRecentMetaData fetched successfully.',
        responseData: [
          {
            agentSessionId: 'sfdbsd457fbd45c',
          },
        ],
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(
          `/ng/organizations/${mockOrgId}/applications/${mockApplicationId}/agent-sessions/latest`
        )
        .reply(500, {});

      const response = await getMostRecentMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle missing parameters and return failure (400 status)', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };

      const response = await getMostRecentMetaData(
        mockOrgId,
        mockApplicationId,
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

    it('should handle invalid application ID (404 status)', async () => {
      mockAxios
        .onGet(
          `/ng/organizations/${mockOrgId}/applications/${mockApplicationId}/agent-sessions/latest`
        )
        .reply(500, {});

      const response = await getMostRecentMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(
          `/ng/organizations/${mockOrgId}/applications/${mockApplicationId}/agent-sessions/latest`
        )
        .networkError();

      const response = await getMostRecentMetaData(
        mockOrgId,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getVulnerabilityLineNumberandFileName', () => {
    it('should fetch getVulnerabilityLineNumberandFileName by OrgId and traceId successfully', async () => {
      const mockResponse = [
        { file: 'file1.js', line: 10 },
        { file: 'file2.js', line: 20 },
      ];
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/story`)
        .reply(200, { story: mockResponse });

      const response = await getVulnerabilityLineNumberandFileName(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'LineNumber and FileName fetched successfully.',
        responseData: mockResponse,
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/story`)
        .reply(500, {});

      const response = await getVulnerabilityLineNumberandFileName(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle invalid trace ID (404 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/story`)
        .reply(500, {});

      const response = await getVulnerabilityLineNumberandFileName(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/story`)
        .networkError();

      const response = await getVulnerabilityLineNumberandFileName(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('addTagsByOrgId', () => {
    it('should successfully add tags and remove tags', async () => {
      mockAxios
        .onPut(`/ng/${mockOrgId}/tags/traces/bulk`)
        .reply(200, mockRequestPayload);

      const response = await addTagsByOrgId(
        mockOrgId,
        mockTraceIdList,
        mockTags,
        mockTagsRemove,
        mockParams
      );

      expect(response.code).toBe(200);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.vulnerabilitysuccessfully')
      );
    });

    it('should return failure if API request fails', async () => {
      mockAxios.onPut(`/ng/${mockOrgId}/tags/traces/bulk`).reply(500, {});

      const response = await addTagsByOrgId(
        mockOrgId,
        mockTraceIdList,
        mockTags,
        mockTagsRemove,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should return failure when missing required parameters', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };

      const response = await addTagsByOrgId(
        mockOrgId,
        mockTraceIdList,
        mockTags,
        mockTagsRemove,
        invalidParams
      );

      expect(response.code).toBe(400);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.missingOneOrMoreError')
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      mockAxios.onPut(`/ng/${mockOrgId}/tags/traces/bulk`).reply(500);

      const response = await addTagsByOrgId(
        mockOrgId,
        mockTraceIdList,
        mockTags,
        mockTagsRemove,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getVulnerabilityIntroTextandRisk', () => {
    it('should fetch getVulnerabilityIntroTextandRisk by OrgId and traceId successfully', async () => {
      const mockResponse = [
        { file: 'file1.js', line: 10 },
        { file: 'file2.js', line: 20 },
      ];
      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockTraceId}/story/?expand=skip_links`
        )
        .reply(200, { story: mockResponse });

      const response = await getVulnerabilityIntroTextandRisk(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'StoryResult fetched successfully.',
        responseData: mockResponse,
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockTraceId}/story/?expand=skip_links`
        )
        .reply(500, {});

      const response = await getVulnerabilityIntroTextandRisk(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle invalid trace ID (404 status)', async () => {
      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockTraceId}/story/?expand=skip_links`
        )
        .reply(500, {});

      const response = await getVulnerabilityIntroTextandRisk(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(
          `/ng/${mockOrgId}/traces/${mockTraceId}/story/?expand=skip_links`
        )
        .networkError();

      const response = await getVulnerabilityIntroTextandRisk(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getVulnerabilityRecommendation', () => {
    it('should fetch getVulnerabilityRecommendation by OrgId and traceId successfully', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/recommendation`)
        .reply(200);

      const response = await getVulnerabilityRecommendation(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'All Recommendation Text fetched successfully.',
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/recommendation`)
        .reply(500, {});

      const response = await getVulnerabilityRecommendation(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle invalid trace ID (404 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/recommendation`)
        .reply(500, {});

      const response = await getVulnerabilityRecommendation(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/recommendation`)
        .networkError();

      const response = await getVulnerabilityRecommendation(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getVulnerabilityEvents', () => {
    it('should fetch getVulnerabilityEvents by OrgId and traceId successfully', async () => {
      const mockResponse = [
        { file: 'file1.js', line: 10 },
        { file: 'file2.js', line: 20 },
      ];
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/events/summary`)
        .reply(200, { events: mockResponse });

      const response = await getVulnerabilityEvents(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'All Events fetched successfully.',
        responseData: mockResponse,
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/events/summary`)
        .reply(500, {});

      const response = await getVulnerabilityEvents(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle invalid trace ID (404 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/events/summary`)
        .reply(500, {});

      const response = await getVulnerabilityEvents(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/events/summary`)
        .networkError();

      const response = await getVulnerabilityEvents(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('addMarkByOrgId', () => {
    it('should successfully add status and note', async () => {
      mockAxios
        .onPut(`/ng/${mockParamadd.orgId}/orgtraces/mark`)
        .reply(200, mockrequestPayload);

      const response = await addMarkByOrgId(mockParamadd, mockParams);

      expect(response.code).toBe(200);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.addVulnerabilitySuccessfully')
      );
    });

    it('should return failure if API request fails', async () => {
      mockAxios.onPut(`/ng/${mockOrgId}/orgtraces/mark`).reply(500, {});

      const response = await addMarkByOrgId(mockParamadd, mockParams);

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      mockAxios.onPut(`/ng/${mockOrgId}/orgtraces/mark`).reply(500);

      const response = await addMarkByOrgId(mockParamadd, mockParams);

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getVulnerabilityEvents', () => {
    it('should fetch getVulnerabilityEvents by OrgId and traceId successfully', async () => {
      const mockResponse = {
        http_request: [
          { file: 'file1.js', line: 10 },
          { file: 'file2.js', line: 20 },
        ],
      };
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/httprequest`)
        .reply(200, mockResponse);

      const response = await getVulnerabilityHttps(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'All Https fetched successfully.',
        responseData: [
          {
            file: 'file1.js',
            line: 10,
          },
          {
            file: 'file2.js',
            line: 20,
          },
        ],
        status: 'success',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/httprequest`)
        .reply(500, {});

      const response = await getVulnerabilityHttps(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle invalid trace ID (404 status)', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/httprequest`)
        .reply(500, {});

      const response = await getVulnerabilityHttps(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onGet(`/ng/${mockOrgId}/traces/${mockTraceId}/httprequest`)
        .networkError();

      const response = await getVulnerabilityHttps(
        mockOrgId,
        mockTraceId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getLibFilterListByAppId', () => {
    it('should fetch the list by appId successfully', async () => {
      const mockResponse = {
        filters: [
          {
            keycode: 'custom',
            label: 'custom',
            count: 1,
            links: [],
          },
          {
            keycode: 'garthtest1',
            label: 'garthtest1',
            count: 31,
            links: [],
          },
        ],
      };
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .reply(200, mockResponse);

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 200,
        message: 'tags list fetched successfully.',
        responseData: [
          {
            keycode: 'custom',
            label: 'custom',
            count: 1,
            links: [],
          },
          {
            keycode: 'garthtest1',
            label: 'garthtest1',
            count: 31,
            links: [],
          },
        ],
        status: 'success',
      });
    });
    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .reply(500, {});

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle non-200 response with generic error', async () => {
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .reply(400);

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle exception and return authentication failure', async () => {
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .networkError(); // Simulate a network error

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 500,
        message: 'Authentication failure',
        responseData: null,
        status: 'failure',
      });
    });

    it('should handle API failure gracefully (500 status)', async () => {
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .reply(500, {});

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle missing parameters and return failure (400 status)', async () => {
      const invalidParams = { ...mockParams, apiKey: '' };

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
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

    it('should handle invalid application ID (404 status)', async () => {
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .reply(500, {});

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected error gracefully', async () => {
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .networkError();

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response.code).toBe(500);
      expect(response.message).toBe(
        local.getTranslation('apiResponse.authenticationFailure')
      );

      expect(loggerInstance.logMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle unexpected non-200 successful status (like 204)', async () => {
      mockAxios
        .onPost(`/ng/${mockOrgId}/libraries/filters/${mockList}/listing`)
        .reply(204);

      const response = await getLibFilterListByAppId(
        mockList,
        mockApplicationId,
        mockParams
      );

      expect(response).toEqual({
        code: 500,
        message: local.getTranslation('apiResponse.authenticationFailure'),
        responseData: null,
        status: 'failure',
      });
    });
  });
});
