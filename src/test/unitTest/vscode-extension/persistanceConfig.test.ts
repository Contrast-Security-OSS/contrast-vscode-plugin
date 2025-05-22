/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AssessFilter,
  ConfiguredProject,
  FilterType,
  LogLevel,
} from '../../../common/types';
import { ShowInformationPopupWithOptions } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import {
  DeleteConfiguredProjectById,
  AddProjectToConfig,
  UpdateConfiguredProjectById,
  GetAllConfiguredProjects,
  UpdateFilters,
  GetFilters,
  GetAssessFilter,
  UpdateAssessFilter,
} from '../../../vscode-extension/persistence/PersistenceConfigSetting';
import {
  resolveFailure,
  resolveSuccess,
} from '../../../vscode-extension/utils/errorHandling';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import {
  getApplicationById,
  getOrganisationName,
  getProjectById,
} from '../../../vscode-extension/api/services/apiService';
import {
  decrypt,
  encrypt,
} from '../../../vscode-extension/utils/encryptDecrypt';
import {
  ASSESS_KEYS,
  SCAN_KEYS,
  SETTING_KEYS,
  TOKEN,
  WEBVIEW_COMMANDS,
} from '../../../vscode-extension/utils/constants/commands';
import { configuredProject1, configuredProject2 } from '../../mocks/testMock';
import { clearCacheByProjectId } from '../../../vscode-extension/cache/cacheManager';
import { l10n } from '../../../l10n';
import { loggerInstance } from '../../../vscode-extension/logging/logger';
import path from 'path';
import { Uri } from 'vscode';
import { ContrastPanelInstance } from '../../../vscode-extension/commands/ui-commands/webviewHandler';
import { updateGlobalWebviewConfig } from '../../../vscode-extension/utils/multiInstanceConfigSync';

jest.mock('../../../vscode-extension/utils/helper', () => ({
  closeActiveFileHightlighting: jest.fn(),
}));

jest.mock('../../../vscode-extension/cache/cacheManager', () => ({
  clearCacheByProjectId: jest.fn(),
}));

jest.mock('../../../vscode-extension/utils/multiInstanceConfigSync', () => ({
  updateGlobalWebviewConfig: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/commands/ui-commands/messageHandler',
  () => ({
    ShowInformationPopupWithOptions: jest.fn(),
    ShowInformationPopup: jest.fn(),
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/aboutWebviewHandler',
  () => ({
    registerAboutWebviewPanel: {
      postMessage: jest.fn(),
    },
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/openActivityBar',
  () => ({
    registerContrastActivityBar: {
      postMessage: jest.fn(),
    },
  })
);

jest.mock('../../../vscode-extension/utils/toggleContrastPanel', () => ({
  toggleContrastPanel: jest.fn(),
}));

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      onChangeScreen: jest.fn(),
      clearAssessPersistance: jest.fn(), // Mock the function
      clearPrimaryAssessFilter: jest.fn(),
      postMessage: jest.fn(),
    },
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/aboutWebviewHandler',
  () => ({
    aboutWebviewPanelInstance: {
      dispose: jest.fn(),
    },
  })
);

jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  commands: {
    registerCommand: jest.fn(),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
    onDidChangeConfiguration: jest.fn(),
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
  languages: {
    registerHoverProvider: jest.fn(),
  },
}));

const localeI18ln = new l10n('en');

jest.mock('../../../vscode-extension/utils/persistanceState', () => ({
  PersistenceInstance: {
    set: jest.fn(),
    getByKey: jest.fn(),
  },
}));

jest.mock('../../../vscode-extension/api/services/apiService', () => ({
  getProjectById: jest.fn(),
  getOrganisationName: jest.fn(),
  getApplicationById: jest.fn(),
}));

jest.mock('../../../vscode-extension/utils/encryptDecrypt', () => ({
  encrypt: jest.fn((key) => `encrypted-${key}`),
  decrypt: jest.fn(),
}));

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

describe('Project Configuration Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AddProjectToConfig', () => {
    it('should add a new project when verification is successful', async () => {
      const project: ConfiguredProject = configuredProject1;
      const isScan = project.source === 'scan';
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');
      (encrypt as jest.Mock).mockImplementation(
        (value) => `encrypted-${value}`
      );

      const response = await AddProjectToConfig(project);

      expect(PersistenceInstance.set).toHaveBeenCalledTimes(1);
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation(
            `persistResponse.${isScan ? 'projectAddedSuccess' : 'applicationAddedSuccess'}`
          ),
          200,
          expect.any(Array)
        )
      );
    });

    it('should add a new Application when verification is successful', async () => {
      const project: ConfiguredProject = {
        ...configuredProject1,
        source: 'assess',
      };
      const isScan = project.source === 'scan';
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');
      (encrypt as jest.Mock).mockImplementation(
        (value) => `encrypted-${value}`
      );

      const response = await AddProjectToConfig(project);

      expect(PersistenceInstance.set).toHaveBeenCalledTimes(1);
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation(
            `persistResponse.${isScan ? 'projectAddedSuccess' : 'applicationAddedSuccess'}`
          ),
          200,
          expect.any(Array)
        )
      );
    });

    it('should fail to add a new project when verification fails', async () => {
      const project: ConfiguredProject = configuredProject1;
      const isScan = project.source === 'scan';
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(false);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 400 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');

      const response = await AddProjectToConfig(project);

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.badRequest'),
          400
        )
      );
    });

    it('should fail to add a new Application when verification fails', async () => {
      const project: ConfiguredProject = {
        ...configuredProject1,
        source: 'assess',
      };
      const isScan = project.source === 'scan';
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(false);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 400 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');

      const response = await AddProjectToConfig(project);

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.badRequest'),
          400
        )
      );
    });

    it('should handle errors gracefully (Scan)', async () => {
      const project: ConfiguredProject = configuredProject1;
      const isScan = project.source === 'scan';
      if (isScan) {
        (getProjectById as jest.Mock).mockRejectedValue(
          new Error('Network error')
        );
      } else {
        (getApplicationById as jest.Mock).mockRejectedValue(
          new Error('Network error')
        );
      }

      await expect(AddProjectToConfig(project)).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          500
        )
      );
    });
    it('should handle errors gracefully (Assess)', async () => {
      const project: ConfiguredProject = {
        ...configuredProject1,
        source: 'assess',
      };
      const isScan = project.source === 'scan';
      if (isScan) {
        (getProjectById as jest.Mock).mockRejectedValue(
          new Error('Network error')
        );
      } else {
        (getApplicationById as jest.Mock).mockRejectedValue(
          new Error('Network error')
        );
      }

      await expect(AddProjectToConfig(project)).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          500
        )
      );
    });

    it('should handle case when organization name is not found', async () => {
      const project: ConfiguredProject = configuredProject1;

      (getOrganisationName as jest.Mock).mockResolvedValue(null);

      const response = await AddProjectToConfig(project);

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.badRequest'),
          400
        )
      );
    });
  });

  describe('GetAllConfiguredProjects', () => {
    it('should return decrypted configured projects when there is persisted data', async () => {
      const persistedData: ConfiguredProject[] = [
        {
          projectId: '1',
          projectName: 'Test Project 1',
          minute: 10,
          apiKey: '0123',
          contrastURL: 'example.com',
          userName: 'user',
          serviceKey: '1234',
          organizationId: 'org123',
          source: 'assess',
        },
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );
      (decrypt as jest.Mock).mockImplementation(
        (value) => `decrypted-${value}`
      );

      const response = await GetAllConfiguredProjects();

      expect(decrypt).toHaveBeenCalledTimes(2);
      expect(decrypt).toHaveBeenCalledTimes(2);
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.fetchAllProjectsSuccess'),
          200,
          [
            {
              projectId: '1',
              projectName: 'Test Project 1',
              minute: 10,
              apiKey: 'decrypted-0123',
              contrastURL: 'example.com',
              userName: 'user',
              serviceKey: 'decrypted-1234',
              organizationId: 'org123',
              source: 'assess',
            },
          ]
        )
      );
    });

    it('should return an empty array when there are no configured projects', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const response = await GetAllConfiguredProjects();

      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.fetchAllProjectsSuccess'),
          200,
          []
        )
      );
    });

    it('should handle errors gracefully', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(GetAllConfiguredProjects()).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });
  });

  describe('UpdateConfiguredProjectById', () => {
    let configuredProject1: ConfiguredProject;

    let updatedProject: ConfiguredProject;
    beforeEach(() => {
      configuredProject1 = {
        id: '1',
        source: 'scan',
        contrastURL: 'https://xyz.com',
        userName: 'xyz@xyz.com',
        serviceKey: 'ABCDEFGHIJ',
        apiKey: 'PQRS1234TUV5678',
        organizationId: '123-XYZ-456-ABC-789',
        minute: '1440',
        projectName: 'Test Project',
        projectId: '456-ABC-789-XYZ',
      };
      updatedProject = {
        ...configuredProject1,
        projectName: 'Test Project 2',
      };
    });

    it('should update a project when verification is successful (Scan)', async () => {
      const isScan = configuredProject1.source === 'scan';
      const projectId = configuredProject1.projectId;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');

      const response = await UpdateConfiguredProjectById(
        projectId as string,
        updatedProject
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);

      expect(PersistenceInstance.set).toHaveBeenCalledWith(
        TOKEN.SETTING,
        SETTING_KEYS.CONFIGPROJECT,
        expect.arrayContaining([expect.objectContaining(updatedProject)])
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation(
            `persistResponse.${isScan ? 'projectUpdatedSuccess' : 'applicationUpdatedSuccess'}`
          ),
          200,
          expect.arrayContaining([expect.objectContaining(updatedProject)])
        )
      );
    });
    it('should update a project when verification is successful (Assess)', async () => {
      configuredProject1 = {
        ...configuredProject1,
        source: 'assess',
      };
      const isScan = configuredProject1.source === 'scan';
      const projectId = configuredProject1.projectId;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');

      const response = await UpdateConfiguredProjectById(
        projectId as string,
        updatedProject
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);

      expect(PersistenceInstance.set).toHaveBeenCalledWith(
        TOKEN.SETTING,
        SETTING_KEYS.CONFIGPROJECT,
        expect.arrayContaining([expect.objectContaining(updatedProject)])
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation(
            `persistResponse.${isScan ? 'projectUpdatedSuccess' : 'applicationUpdatedSuccess'}`
          ),
          200,
          expect.arrayContaining([expect.objectContaining(updatedProject)])
        )
      );
    });

    it('should return success with empty data when persisted data is an empty array (Scan)', async () => {
      const projectId = configuredProject1.projectId;

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const response = await UpdateConfiguredProjectById(
        projectId as string,
        updatedProject
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);

      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.projectUpdatedSuccess'),
          200,
          []
        )
      );
    });
    it('should return success with empty data when persisted data is an empty array (Assess)', async () => {
      updatedProject = {
        ...updatedProject,
        source: 'assess',
      };
      const projectId = configuredProject1.projectId;

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const response = await UpdateConfiguredProjectById(
        projectId as string,
        updatedProject
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);

      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation(
            'persistResponse.applicationUpdatedSuccess'
          ),
          200,
          []
        )
      );
    });

    it('should fail to update a project when verification fails (Scan)', async () => {
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(false);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 400 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.badRequest'),
          400
        )
      );
    });
    it('should fail to update a project when verification fails (Assess)', async () => {
      configuredProject1 = {
        ...configuredProject1,
        source: 'assess',
      };
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(false);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 400 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );
      expect(loggerInstance.logMessage).toHaveBeenCalledTimes(1);

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.badRequest'),
          400
        )
      );
    });

    it('should fail if organization name is not found (Scan)', async () => {
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue(null);

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.organizationNotFound'),
          400
        )
      );
    });

    it('should fail if organization name is not found (Assess)', async () => {
      configuredProject1 = {
        ...configuredProject1,
        source: 'assess',
      };
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue(null);

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.organizationNotFound'),
          400
        )
      );
    });

    it('should fail if organization name is not found (Scan)', async () => {
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue(null);

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.organizationNotFound'),
          400
        )
      );
    });
    it('should fail if organization name is not found (Assess)', async () => {
      configuredProject1 = {
        ...configuredProject1,
        source: 'assess',
      };
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue(null);

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.organizationNotFound'),
          400
        )
      );
    });

    it('should not clear cache if projectName is the same (Scam)', async () => {
      const mockProjectData: ConfiguredProject[] = [configuredProject1];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');
      (clearCacheByProjectId as jest.Mock).mockImplementation(() => {});

      const response = await UpdateConfiguredProjectById(
        configuredProject1.projectName,
        configuredProject1
      );

      expect(clearCacheByProjectId).not.toHaveBeenCalled();
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation(
            `persistResponse.${isScan ? 'projectUpdatedSuccess' : 'applicationUpdatedSuccess'}`
          ),
          200,
          expect.anything()
        )
      );
    });
    it('should not clear cache if projectName is the same (Assess)', async () => {
      const mockProjectData: ConfiguredProject[] = [
        { ...configuredProject1, source: 'assess' },
      ];
      const isScan = configuredProject1.source === 'scan';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      if (isScan) {
        (getProjectById as jest.Mock).mockResolvedValue(true);
      } else {
        (getApplicationById as jest.Mock).mockResolvedValue({ code: 200 });
      }
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');
      (clearCacheByProjectId as jest.Mock).mockImplementation(() => {});

      const response = await UpdateConfiguredProjectById(
        configuredProject1.projectName,
        configuredProject1
      );

      expect(clearCacheByProjectId).not.toHaveBeenCalled();
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation(
            `persistResponse.${isScan ? 'projectUpdatedSuccess' : 'applicationUpdatedSuccess'}`
          ),
          200,
          expect.anything()
        )
      );
    });

    it('should handle errors and return a failure response (Scan)', async () => {
      const projectId = configuredProject1.projectId as string;

      const updatedProject: ConfiguredProject = configuredProject1;

      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Test Error');
      });

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });
    it('should handle errors and return a failure response (Assess)', async () => {
      const projectId = configuredProject1.projectId as string;

      const updatedProject: ConfiguredProject = {
        ...configuredProject1,
        source: 'assess',
      };

      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Test Error');
      });

      const response = await UpdateConfiguredProjectById(
        projectId,
        updatedProject
      );

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });
  });

  describe('DeleteConfiguredProjectById', () => {
    it('should not delete a project when user cancels', async () => {
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('No');

      await DeleteConfiguredProjectById(
        configuredProject1.projectId as string,
        {
          source: 'scan',
          apiKey: '',
          contrastURL: '',
          userName: '',
          serviceKey: '',
          organizationId: '',
          projectName: '',
          minute: '',
        }
      );

      expect(PersistenceInstance.set).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const projectId = configuredProject1.projectId;

      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        DeleteConfiguredProjectById(projectId as string)
      ).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });

    it('should not delete a project when user cancels', async () => {
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('No');

      expect(PersistenceInstance.set).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const projectId = configuredProject1.projectId;

      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        DeleteConfiguredProjectById(projectId as string)
      ).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });

    it('should return an error if no projects exist in the persistence data', async () => {
      const projectId = configuredProject1.projectId;
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      try {
        await DeleteConfiguredProjectById(projectId as string, {
          source: 'scan',
          apiKey: '',
          contrastURL: '',
          userName: '',
          serviceKey: '',
          organizationId: '',
          projectName: '',
          minute: '',
        });
      } catch (error) {
        expect(PersistenceInstance.set).not.toHaveBeenCalled();

        expect(error).toEqual(
          resolveSuccess(
            localeI18ln.getTranslation('persistResponse.projectDeletionFailed'),
            200,
            false
          )
        );
      }
    });
    it('should return an error if no applications exist in the persistence data', async () => {
      const projectId = configuredProject1.projectId;
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      try {
        await DeleteConfiguredProjectById(projectId as string, {
          source: 'assess',
          apiKey: '',
          contrastURL: '',
          userName: '',
          serviceKey: '',
          organizationId: '',
          projectName: '',
          minute: '',
        });
      } catch (error) {
        expect(PersistenceInstance.set).not.toHaveBeenCalled();

        expect(error).toEqual(
          resolveSuccess(
            localeI18ln.getTranslation(
              'persistResponse.applicationDeletionFailed'
            ),
            200,
            false
          )
        );
      }
    });
    it('should delete a project when user confirms for a project with source "scan"', async () => {
      const projectId = configuredProject1.projectId;
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('Yes'); // Simulate confirmation
      const mockClearCacheByProjectId = clearCacheByProjectId as jest.Mock;
      mockClearCacheByProjectId.mockResolvedValue(projectId);

      await DeleteConfiguredProjectById(projectId as string, {
        source: 'scan',
        apiKey: '',
        contrastURL: '',
        userName: '',
        serviceKey: '',
        organizationId: '',
        projectName: '',
        minute: '',
      });

      expect(PersistenceInstance.set).toHaveBeenCalledTimes(1);

      expect(ShowInformationPopupWithOptions).toHaveBeenCalledTimes(1);

      expect(ContrastPanelInstance.postMessage).toHaveBeenCalledWith({
        command: WEBVIEW_COMMANDS.SETTING_CANCEL_STATE_WHILE_DELETE,
        data: null, // Randomized data
      });
    });
    it('should call the method updateGlobalWebviewConfig for "scan"', async () => {
      const projectId = configuredProject1.id;
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('Yes'); // Simulate confirmation

      await DeleteConfiguredProjectById(
        projectId as string,
        configuredProject1
      );
      expect(updateGlobalWebviewConfig).toHaveBeenCalled();
    });
    it('should call the method updateGlobalWebviewConfig for "scan"', async () => {
      const projectId = configuredProject1.id;
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('Yes'); // Simulate confirmation

      await DeleteConfiguredProjectById(
        projectId as string,
        configuredProject1
      );
      expect(updateGlobalWebviewConfig).toHaveBeenCalled();
    });

    it('should delete a project when user confirms for a project with source "assess"', async () => {
      const projectId = configuredProject1.projectId;
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('Yes');
      const mockClearCacheByProjectId = clearCacheByProjectId as jest.Mock;
      mockClearCacheByProjectId.mockResolvedValue(projectId);

      await DeleteConfiguredProjectById(projectId as string, {
        source: 'assess',
        apiKey: '',
        contrastURL: '',
        userName: '',
        serviceKey: '',
        organizationId: '',
        projectName: '',
        minute: '',
      });

      expect(PersistenceInstance.set).toHaveBeenCalledTimes(1);
    });

    it('should not delete a project when user cancels', async () => {
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('No');

      await DeleteConfiguredProjectById(configuredProject1.projectId as string);
      expect(ContrastPanelInstance.postMessage).toHaveBeenCalledWith({
        command: WEBVIEW_COMMANDS.SETTING_CANCEL_STATE_WHILE_DELETE,
        data: null, // Randomized data
      });
      expect(PersistenceInstance.set).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully when retrieving persistence data fails', async () => {
      const projectId = configuredProject1.projectId;

      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        DeleteConfiguredProjectById(projectId as string)
      ).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });

    it('should return an error if no projects exist in the persistence data', async () => {
      const projectId = configuredProject1.projectId;
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      try {
        await DeleteConfiguredProjectById(projectId as string, {
          source: 'scan',
          apiKey: '',
          contrastURL: '',
          userName: '',
          serviceKey: '',
          organizationId: '',
          projectName: '',
          minute: '',
        });
      } catch (error) {
        expect(PersistenceInstance.set).not.toHaveBeenCalled();
        expect(error).toEqual(
          resolveSuccess(
            localeI18ln.getTranslation('persistResponse.projectDeletionFailed'),
            200,
            false
          )
        );
      }
    });

    it('should return an error if no applications exist in the persistence data', async () => {
      const projectId = configuredProject1.projectId;
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      try {
        await DeleteConfiguredProjectById(projectId as string, {
          source: 'assess',
          apiKey: '',
          contrastURL: '',
          userName: '',
          serviceKey: '',
          organizationId: '',
          projectName: '',
          minute: '',
        });
      } catch (error) {
        expect(PersistenceInstance.set).not.toHaveBeenCalled();
        expect(error).toEqual(
          resolveSuccess(
            localeI18ln.getTranslation(
              'persistResponse.applicationDeletionFailed'
            ),
            200,
            false
          )
        );
      }
    });
    it('should confirm and delete a project when user clicks "Yes"', async () => {
      const mockId = 'testId';

      const mockPayload: ConfiguredProject = configuredProject1;
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([
        { id: mockId },
      ]);
      (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('Yes');
      (clearCacheByProjectId as jest.Mock).mockResolvedValue(true);
      (PersistenceInstance.set as jest.Mock).mockResolvedValue(true);

      const result = await DeleteConfiguredProjectById(mockId, mockPayload);

      expect(PersistenceInstance.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything()
      );

      expect(result).toEqual({
        code: 200,
        message: 'Project deleted successfully.',
        responseData: true,
        status: 'success',
      });
    });
  });

  it('should not delete the project if user clicks "No"', async () => {
    const mockId = 'testId';

    const mockPayload: ConfiguredProject = configuredProject1;
    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([
      { id: mockId },
    ]);
    (ShowInformationPopupWithOptions as jest.Mock).mockResolvedValue('No');

    const result = await DeleteConfiguredProjectById(mockId, mockPayload);

    expect(ShowInformationPopupWithOptions).toHaveBeenCalledTimes(1);
    expect(PersistenceInstance.set).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  describe('GetFilters', () => {
    it('should return persisted data when it is not an array', async () => {
      const persistedData = { id: 1, name: 'filter1' };

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const response = await GetFilters();

      expect(PersistenceInstance.getByKey).toHaveBeenCalledWith(
        TOKEN.SCAN,
        SCAN_KEYS.FILTERS
      );

      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterRetrivedSucess'),
          200,
          persistedData as any
        )
      );
    });

    it('should return null when persisted data is an empty array', async () => {
      const mockProject = {
        projectName: 'Test Project',
        minute: 10,
      };
      const persistedData = [mockProject];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const response = await GetFilters();

      expect(PersistenceInstance.getByKey).toHaveBeenCalledWith(
        TOKEN.SCAN,
        SCAN_KEYS.FILTERS
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterRetrivedSucess'),
          200,
          null
        )
      );
    });

    it('should handle errors gracefully', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(GetFilters()).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });
  });

  describe('UpdateFilters', () => {
    const mockPayload: FilterType = {
      severity: {
        CRITICAL: false,
        HIGH: true,
        MEDIUM: false,
        LOW: false,
        NOTE: false,
      },
      status: {
        REPORTED: true,
        CONFIRMED: false,
        SUSPICIOUS: false,
        NOT_A_PROBLEM: false,
        REMEDIATED: true,
        REMEDIATED_AUTO_VERIFIED: false,
        REOPENED: false,
      },
    };

    it('should return success message when data is updated successfully', async () => {
      (PersistenceInstance.set as jest.Mock).mockReturnValue(true);

      const response = await UpdateFilters(mockPayload);

      expect(PersistenceInstance.set).toHaveBeenCalledWith(
        TOKEN.SCAN,
        SCAN_KEYS.FILTERS,
        mockPayload
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          mockPayload
        )
      );
    });

    it('should return success message with null when persisting data fails', async () => {
      (PersistenceInstance.set as jest.Mock).mockReturnValue(false);

      const response = await UpdateFilters(mockPayload);

      expect(PersistenceInstance.set).toHaveBeenCalledWith(
        TOKEN.SCAN,
        SCAN_KEYS.FILTERS,
        mockPayload
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          mockPayload
        )
      );
    });

    it('should return failure message when an error occurs during execution', async () => {
      (PersistenceInstance.set as jest.Mock).mockImplementation(() => {
        throw new Error('Something went wrong');
      });

      try {
        await UpdateFilters(mockPayload);
      } catch (error) {
        expect(error).toEqual(
          resolveFailure(
            localeI18ln.getTranslation('persistResponse.errorOccurred'),
            400
          )
        );
      }
    });
  });

  describe('Assess GetFilters', () => {
    it('should return persisted data when it is not an array', async () => {
      const persistedData = { id: 1, name: 'filter1' };

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const response = await GetAssessFilter();

      expect(PersistenceInstance.getByKey).toHaveBeenCalledWith(
        TOKEN.ASSESS,
        ASSESS_KEYS.FILTERS
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterRetrivedSucess'),
          200,
          persistedData as any
        )
      );
    });

    it('should return null when persisted data is an empty array', async () => {
      const mockProject = {
        projectName: 'Test Project',
        minute: 10,
      };
      const persistedData = [mockProject];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const response = await GetAssessFilter();

      expect(PersistenceInstance.getByKey).toHaveBeenCalledWith(
        TOKEN.ASSESS,
        ASSESS_KEYS.FILTERS
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterRetrivedSucess'),
          200,
          null
        )
      );
    });

    it('should handle errors gracefully', async () => {
      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(GetFilters()).rejects.toEqual(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.errorOccurred'),
          400
        )
      );
    });

    it('should log error and return rejected promise when exception is thrown', async () => {
      const errorMessage = 'Something went wrong';
      const fakeError = new Error(errorMessage);

      (PersistenceInstance.getByKey as jest.Mock).mockImplementation(() => {
        throw fakeError;
      });

      const logMock = jest.fn();
      (loggerInstance.logMessage as jest.Mock) = logMock;

      await expect(GetAssessFilter()).rejects.toEqual({
        code: 400,
        message: 'Something went wrong, Please try again',
        responseData: null,
        status: 'failure',
      });

      expect(logMock).toHaveBeenCalledTimes(1);
      const [logLevel, logMessage] = logMock.mock.calls[0];

      expect(logLevel).toBe(LogLevel.ERROR);
      expect(logMessage).toContain('Assess Filter Data');
      expect(logMessage).toContain(errorMessage);
    });

    it('should return success when filter is updated successfully', async () => {
      const payload: AssessFilter = {
        id: 'appId',
        projectName: '',
        minute: 0,
        apiKey: 'testApiKey',
        contrastURL: 'http://test.url',
        userName: 'testUser',
        serviceKey: 'testServiceKey',
        organizationId: 'org1',
        source: 'assess',
      };
      const persistedData = true; // Simulate success

      (PersistenceInstance.set as jest.Mock).mockReturnValue(persistedData);
      const logMock = jest.fn();
      (loggerInstance.logMessage as jest.Mock) = logMock;

      await expect(UpdateAssessFilter(payload)).resolves.toEqual({
        code: 200,
        message: 'Filters updated successfully',
        responseData: payload,
        status: 'success',
      });

      expect(logMock).toHaveBeenCalledTimes(1);
      const [logLevel, logMessage] = logMock.mock.calls[0];

      expect(logLevel).toBe(LogLevel.INFO);
      expect(logMessage).toContain('Filters updated successfully');
    });

    it('should return success when filter is updated but no data persisted', async () => {
      const payload: AssessFilter = {
        id: 'appId',
        projectName: '',
        minute: 0,
        apiKey: 'testApiKey',
        contrastURL: 'http://test.url',
        userName: 'testUser',
        serviceKey: 'testServiceKey',
        organizationId: 'org1',
        source: 'assess',
      };
      const persistedData = null;

      (PersistenceInstance.set as jest.Mock).mockReturnValue(persistedData);
      const logMock = jest.fn();
      (loggerInstance.logMessage as jest.Mock) = logMock;

      await expect(UpdateAssessFilter(payload)).resolves.toEqual({
        code: 200,
        message: 'Filters updated successfully',
        responseData: null,
        status: 'success',
      });

      expect(logMock).toHaveBeenCalledTimes(1);
      const [logLevel, logMessage] = logMock.mock.calls[0];

      expect(logLevel).toBe(LogLevel.INFO);
      expect(logMessage).toContain('Filters updated successfully');
    });

    it('should log error and return rejected promise when exception is thrown', async () => {
      const payload: AssessFilter = {
        id: 'appId',
        projectName: '',
        minute: 0,
        apiKey: 'testApiKey',
        contrastURL: 'http://test.url',
        userName: 'testUser',
        serviceKey: 'testServiceKey',
        organizationId: 'org1',
        source: 'assess',
      };
      const errorMessage = 'Something went wrong';
      const fakeError = new Error(errorMessage);

      (PersistenceInstance.set as jest.Mock).mockImplementation(() => {
        throw fakeError;
      });

      const logMock = jest.fn();
      (loggerInstance.logMessage as jest.Mock) = logMock;

      await expect(UpdateAssessFilter(payload)).rejects.toEqual({
        code: 400,
        message: 'Something went wrong, Please try again',
        responseData: null,
        status: 'failure',
      });

      expect(logMock).toHaveBeenCalledTimes(1);
      const [logLevel, logMessage] = logMock.mock.calls[0];

      expect(logLevel).toBe(LogLevel.ERROR);
      expect(logMessage).toContain('Update Filter - Something went wrong');
    });
  });

  describe('UpdateAssessFilters', () => {
    const mockPayload: AssessFilter = {
      id: '16d28909-d60e-4621-8eaf-d4b03d034588',
      source: 'assess',
      contrastURL: 'https://web.com',
      userName: 'nxyz@gmail.com',
      organizationId: '9ujfdfnduf-nkjdnfjdb-8rhew',
      organizationName: 'WEB',
      apiKey: 'scjdndf8-sdfsd-sdfds',
      projectId: 'sdfdsf-rvv-cs32r',
      minute: '1440',
      orgId: '93754389h-8ryufih-jwbf',
      appId: 'fni9839-4u9u34no-in',
      projectName: 'test',
      serviceKey: 'kjnvdknv',
      severities: 'LOW',
      status: 'REPORTED,CONFIRMED,SUSPICIOUS,NOT_A_PROBLEM,REOPENED',
      dateFilter: '7',
      activeSessionMetadata: '2',
      servers: ['5344'],
      appVersionTags: ['2025'],
      metadataFilters: [
        {
          fieldID: '41450',
          values: ['20250131.12'],
        },
      ],
      startDate: {
        date: '2025-02-04',
        time: '4',
        timeStamp: 1738621800000,
        dateTime: 'Tuesday 4 February 2025 at 04:00:00 India Standard Time',
      },
      endDate: {
        date: '2025-02-18',
        time: '23',
        timeStamp: 1739899800000,
        dateTime: 'Tuesday 18 February 2025 at 23:00:00 India Standard Time',
      },
    };

    it('should return success message when data is updated successfully', async () => {
      (PersistenceInstance.set as jest.Mock).mockReturnValue(true);

      const response = await UpdateAssessFilter(mockPayload);

      expect(PersistenceInstance.set).toHaveBeenCalledWith(
        TOKEN.ASSESS,
        ASSESS_KEYS.FILTERS,
        mockPayload
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          mockPayload
        )
      );
    });

    it('should return success message with null when persisting data fails', async () => {
      (PersistenceInstance.set as jest.Mock).mockReturnValue(false);

      const response = await UpdateAssessFilter(mockPayload);

      expect(PersistenceInstance.set).toHaveBeenCalledWith(
        TOKEN.ASSESS,
        ASSESS_KEYS.FILTERS,
        mockPayload
      );
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          mockPayload
        )
      );
    });

    it('should return failure message when an error occurs during execution', async () => {
      (PersistenceInstance.set as jest.Mock).mockImplementation(() => {
        throw new Error('Something went wrong');
      });

      try {
        await UpdateAssessFilter(mockPayload);
      } catch (error) {
        expect(error).toEqual(
          resolveFailure(
            localeI18ln.getTranslation('persistResponse.errorOccurred'),
            400
          )
        );
      }
    });
  });
});
