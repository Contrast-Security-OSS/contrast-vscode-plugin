import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  getApplicationById,
  getAssessVulnerabilities,
} from '../../../vscode-extension/api/services/apiService';
import { Uri } from 'vscode';
import path from 'path';
import {
  GetAllConfiguredProjects,
  GetAssessFilter,
} from '../../../vscode-extension/persistence/PersistenceConfigSetting';
import { localeI18ln } from '../../../l10n';
import { getAllAssessFilters } from '../../../vscode-extension/utils/helper';
import { ShowErrorPopup } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import { stopBackgroundTimerAssess } from '../../../vscode-extension/cache/backgroundRefreshTimerAssess';
// import { newData } from '../../../vscode-extension/api/model/api.interface';

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  ...jest.requireActual('../../../vscode-extension/api/services/apiService'),
  getScanVulnerabilityResults: jest.fn(),
  getVulnerabilityLineNumberandFileName: jest.fn(),
  getVulnerabilityRecommendation: jest.fn(),
  getProjectById: jest.fn(),
  getApplicationById: jest.fn(),
}));

jest.mock('../../../vscode-extension/cache/backgroundRefreshTimer', () => ({
  startBackgroundTimer: jest.fn(),
  stopBackgroundTimer: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/cache/backgroundRefreshTimerAssess',
  () => ({
    startBackgroundTimerAssess: jest.fn(),
    stopBackgroundTimerAssess: jest.fn(),
  })
);

jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => ({
    GetAllConfiguredProjects: jest.fn(),
    GetAssessFilter: jest.fn(),
  })
);

jest.mock('../../../vscode-extension/utils/helper', () => ({
  getAllAssessFilters: jest.fn().mockResolvedValue({
    responseData: null,
  }),
}));

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

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
    ShowErrorPopup: jest.fn(),
  })
);

describe('getAssessVulnerabilities Unit Test', () => {
  let mockAxios: MockAdapter;

  const mockRequestParams = {
    orgId: 'org123',
    appId: 'app123',
  };

  const mockParams = {
    apiKey: 'mockApiKey',
    contrastURL: 'https://test.com',
    userName: 'testUser',
    serviceKey: 'mockServiceKey',
    organizationId: 'org123',
    source: 'assess',
  };

  const mockConfiguredProject = {
    projectId: 'app123',
    apiKey: 'mockApiKey',
    userName: 'mockUser',
    serviceKey: 'mockServiceKey',
    contrastURL: 'https://test.com',
    organizationId: 'org123',
    source: 'assess',
  };

  beforeEach(() => {
    mockAxios = new MockAdapter(axios as any);

    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });

    (getAllAssessFilters as jest.Mock).mockResolvedValue({
      responseData: null,
    });

    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: {
        servers: ['server1'],
        appVersionTags: ['v1.0'],
        severities: 'HIGH',
        status: 'REPORTED',
        startDate: { timeStamp: 123456789 },
        endDate: { timeStamp: 987654321 },
        agentSessionId: 'sessionId123',
        metadataFilters: [{ fieldID: 'field1', values: ['value1'] }],
      },
    });
    (getApplicationById as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should fetch vulnerabilities successfully', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });
    const id = 'app123';
    const name = 'demo';
    const archieve = true;

    const allApplications = {
      id,
      name,
      archieve,
    };

    (getApplicationById as jest.Mock).mockResolvedValue(allApplications);

    mockAxios.onGet('/ng/org123/applications/app123').reply(200, {
      application: {
        app_id: 'app123',
        name: 'demo',
        archieve: true,
      },
    });

    mockAxios.onPost('/ng/org123/traces/app123/filter').reply(200, {
      traces: [
        {
          uuid: 'app123',
          title: 'Vulnerability 1',
          severity: 'High',
          first_time_seen: '2025-01-01',
          last_time_seen: '2025-01-01',
          status: 'new',
          sub_status: 'active',
        },
      ],
      totalPages: 1,
    });

    mockAxios.onGet(`/ng/org123/traces/app123/story`).reply(200, {
      story: {
        chapters: [
          {
            bodyFormatVariables: {
              lineNumber: 10,
              className: 'com.example.Vulnerability',
              fileName: 'Vulnerability.java',
            },
            introText: 'intro',
            type: 'location',
            body: 'vulnerable code',
          },
        ],
        risk: {
          text: 'demotext',
        },
      },
    });

    mockAxios.onGet('/ng/org123/traces/app123/recommendation').reply(200, {
      recommendation: { text: '' },
      custom_recommendation: { text: '' },
      owasp: 'OWASP1',
      cwe: 'CWE1',
      rule_references: { text: 'Rule1' },
      custom_rule_references: { text: '' },
    });

    const response = await getAssessVulnerabilities(
      mockRequestParams,
      mockParams
    );
    expect(response.code).toBe(200);
    expect(response.message).toBe(
      localeI18ln.getTranslation('apiResponse.assessVulnerbilitySuccess')
    );

    expect(ShowErrorPopup).not.toHaveBeenCalled();
    expect(stopBackgroundTimerAssess).not.toHaveBeenCalled();
    expect(response.responseData).toBeDefined();
  });

  it('should fetch vulnerabilities successfully', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });
    const id = 'app123';
    const name = 'demo';
    const archieve = true;

    const allApplications = {
      id,
      name,
      archieve,
    };

    (getApplicationById as jest.Mock).mockResolvedValue(allApplications);
    mockAxios.onGet('/ng/org123/applications/app123').reply(200, {
      application: {
        app_id: 'app123',
        name: 'demo',
        archieve: true,
      },
    });

    mockAxios.onPost('/ng/org123/traces/app123/filter').reply(200, {
      traces: [
        {
          uuid: 'app123',
          title: 'Vulnerability 1',
          severity: 'High',
          first_time_seen: '2025-01-01',
          last_time_seen: '2025-01-01',
          status: 'new',
          sub_status: 'active',
          language: 'Java',
          tags: ['tag1', 'tag2'],
        },
      ],
      totalPages: 1,
    });

    mockAxios.onGet('/ng/org123/traces/app123/story').reply(200, {
      story: {
        chapters: [
          {
            bodyFormatVariables: {
              lineNumber: 10,
              className: 'com.example.Vulnerability',
              fileName: 'Vulnerability.java',
            },
            introText: 'intro',
            type: 'location',
            body: 'vulnerable code',
          },
        ],
        risk: {
          text: 'demotext',
        },
      },
    });

    mockAxios.onGet('/ng/org123/traces/app123/recommendation').reply(200, {
      recommendation: { text: 'Fix this vulnerability' },
      custom_recommendation: { text: '' },
      owasp: 'OWASP1',
      cwe: 'CWE1',
      rule_references: { text: 'Rule1' },
      custom_rule_references: { text: '' },
    });

    const response = await getAssessVulnerabilities(
      mockRequestParams,
      mockParams
    );

    expect(response.code).toBe(200);
    expect(response.message).toBe(
      localeI18ln.getTranslation('apiResponse.assessVulnerbilitySuccess')
    );
    expect(response.responseData).toBeDefined();
    expect(response.responseData).toHaveProperty('level', 2);
    expect(response.responseData).toHaveProperty('issuesCount', 1);
    expect(response.responseData).toHaveProperty('filesCount', 1);
  });

  it('should handle empty vulnerability data', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });
    const id = 'app123';
    const name = 'demo';
    const archieve = true;

    const allApplications = {
      id,
      name,
      archieve,
    };

    (getApplicationById as jest.Mock).mockResolvedValue(allApplications);
    mockAxios.onGet('/ng/org123/applications/app123').reply(200, {
      application: {
        app_id: 'app123',
        name: 'demo',
        archieve: true,
      },
    });

    mockAxios.onPost('/ng/org123/traces/app123/filter').reply(200, {
      traces: [],
      totalPages: 1,
    });

    const response = await getAssessVulnerabilities(
      mockRequestParams,
      mockParams
    );

    expect(response.code).toBe(200);
    expect(response.message).toBe(
      localeI18ln.getTranslation('apiResponse.assessVulnerbilitySuccess')
    );
    expect(response.responseData).toEqual({
      level: 2,
      label: 'found 0 of 0 files',
      issuesCount: 0,
      filesCount: 0,
      child: [],
    });
  });

  it('should handle missing vulnerability details gracefully', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });
    const id = 'app123';
    const name = 'demo';
    const archieve = true;

    const allApplications = {
      id,
      name,
      archieve,
    };

    (getApplicationById as jest.Mock).mockResolvedValue(allApplications);
    mockAxios.onGet('/ng/org123/applications/app123').reply(200, {
      application: {
        app_id: 'app123',
        name: 'demo',
        archieve: true,
      },
    });

    mockAxios.onPost('/ng/org123/traces/app123/filter').reply(200, {
      traces: [
        {
          uuid: 'app123',
          title: 'Vulnerability 1',
          severity: 'High',
          first_time_seen: '2025-01-01',
          last_time_seen: '2025-01-01',
          status: 'new',
          sub_status: 'active',
        },
      ],
      totalPages: 1,
    });

    mockAxios.onGet(`/ng/org123/traces/app123/story`).reply(200, {
      story: {
        chapters: [],
        risk: {
          text: 'demotext',
        },
      },
    });

    mockAxios.onGet('/ng/org123/traces/app123/recommendation').reply(200, {
      recommendation: { text: '' },
      custom_recommendation: { text: '' },
      owasp: 'OWASP1',
      cwe: 'CWE1',
      rule_references: { text: 'Rule1' },
      custom_rule_references: { text: '' },
    });

    const response = await getAssessVulnerabilities(
      mockRequestParams,
      mockParams
    );

    expect(response.code).toBe(200);
    expect(response.message).toBe(
      localeI18ln.getTranslation('apiResponse.assessVulnerbilitySuccess')
    );
    expect(response.responseData).toBeDefined();
  });

  it('should handle missing vulnerability details gracefully', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });
    const id = 'app123';
    const name = 'demo';
    const archieve = true;

    const allApplications = {
      id,
      name,
      archieve,
    };

    (getApplicationById as jest.Mock).mockResolvedValue(allApplications);
    mockAxios.onGet('/ng/org123/applications/app123').reply(200, {
      application: {
        app_id: 'app123',
        name: 'demo',
        archieve: true,
      },
    });

    mockAxios.onPost('/ng/org123/traces/app123/filter').reply(200, {
      traces: [
        {
          uuid: 'app123',
          title: 'Vulnerability 1',
          severity: 'High',
          first_time_seen: '2025-01-01',
          last_time_seen: '2025-01-01',
          status: 'new',
          sub_status: 'active',
        },
      ],
      totalPages: 1,
    });

    mockAxios.onGet(`/ng/org123/traces/app123/story`).reply(200, {
      story: {
        chapters: [],
        risk: {
          text: 'demotext',
        },
      },
    });

    mockAxios.onGet('/ng/org123/traces/app123/recommendation').reply(200, {
      recommendation: { text: '' },
      custom_recommendation: { text: '' },
      owasp: 'OWASP1',
      cwe: 'CWE1',
      rule_references: { text: 'Rule1' },
      custom_rule_references: { text: '' },
    });

    const response = await getAssessVulnerabilities(
      mockRequestParams,
      mockParams
    );

    expect(response.code).toBe(200);
    expect(response.message).toBe(
      localeI18ln.getTranslation('apiResponse.assessVulnerbilitySuccess')
    );
    expect(response.responseData).toBeDefined();
  });

  it('should handle error retrieving vulnerabilities from API', async () => {
    (GetAllConfiguredProjects as jest.Mock).mockResolvedValue({
      responseData: [mockConfiguredProject],
    });
    const id = 'app123';
    const name = 'demo';
    const archieve = true;

    const allApplications = {
      id,
      name,
      archieve,
    };

    (getApplicationById as jest.Mock).mockResolvedValue(allApplications);
    mockAxios.onGet('/ng/org123/applications/app123').reply(200, {
      application: {
        app_id: 'app123',
        name: 'demo',
        archieve: false,
      },
    });

    mockAxios.onGet('/ng/org123/traces/app123/filter').reply(500, {
      message: 'Internal Server Error',
    });

    const response = await getAssessVulnerabilities(
      mockRequestParams,
      mockParams
    );

    expect(response.code).toBe(500);
    expect(response.message).toBe(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong')
    );
  });
});
