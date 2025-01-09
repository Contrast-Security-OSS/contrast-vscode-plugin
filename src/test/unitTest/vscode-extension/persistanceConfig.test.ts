/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfiguredProject, FilterType } from '../../../common/types';
import { ShowInformationPopupWithOptions } from '../../../vscode-extension/commands/ui-commands/messageHandler';
import {
  DeleteConfiguredProjectById,
  AddProjectToConfig,
  UpdateConfiguredProjectById,
  GetAllConfiguredProjects,
  UpdateFilters,
  GetFilters,
} from '../../../vscode-extension/persistence/PersistenceConfigSetting';
import {
  resolveFailure,
  resolveSuccess,
} from '../../../vscode-extension/utils/errorHandling';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import {
  getOrganisationName,
  getProjectById,
} from '../../../vscode-extension/api/services/apiService';
import { encrypt } from '../../../vscode-extension/utils/encryptDecrypt';
import {
  SCAN_KEYS,
  SETTING_KEYS,
  TOKEN,
} from '../../../vscode-extension/utils/constants/commands';
import { configuredProject1, configuredProject2 } from '../../mocks/testMock';
import { clearCacheByProjectId } from '../../../vscode-extension/cache/cacheManager';
import { l10n } from '../../../l10n';
import { loggerInstance } from '../../../vscode-extension/logging/logger';
import path from 'path';
import { Uri } from 'vscode';

jest.mock('../../../vscode-extension/cache/cacheManager', () => ({
  clearCacheByProjectId: jest.fn(),
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
}));

jest.mock('../../../vscode-extension/utils/encryptDecrypt', () => ({
  encrypt: jest.fn((key) => `encrypted-${key}`),
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

      (getProjectById as jest.Mock).mockResolvedValue(true);
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');
      (encrypt as jest.Mock).mockImplementation(
        (value) => `encrypted-${value}`
      );

      const response = await AddProjectToConfig(project);

      expect(PersistenceInstance.set).toHaveBeenCalledTimes(1);
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.projectAddedSuccess'),
          200,
          expect.any(Array)
        )
      );
    });

    it('should fail to add a new project when verification fails', async () => {
      const project: ConfiguredProject = configuredProject1;

      (getProjectById as jest.Mock).mockResolvedValue(false);
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');

      const response = await AddProjectToConfig(project);

      expect(response).toEqual(
        resolveFailure(
          localeI18ln.getTranslation('apiResponse.badRequest'),
          400
        )
      );
    });

    it('should handle errors gracefully', async () => {
      const project: ConfiguredProject = configuredProject1;

      (getProjectById as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

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
    const configuredProject1: ConfiguredProject = {
      id: '1',
      source: 'scan',
      contrastURL: 'https://apptwo.security.com/Contrast/api/sast',
      userName: 'raju.kumar@contrastsecurity.com',
      serviceKey: '2OTZXMTI6YYYXY2KS',
      apiKey: 'HLgcBCLpXwuXvOM9uBEw81fIpd15xb91',
      organizationId: '2c3a73d6-78a0-46c7-944a-b07b94d557f1',
      minute: '1440',
      projectName: 'RnnettesTest14',
      projectId: '42a30a30-a34d-43ee-b347-8fd2dc5775ff',
    };

    const updatedProject: ConfiguredProject = {
      ...configuredProject1,
      projectName: 'UpdatedProjectName',
    };

    it('should update a project when verification is successful', async () => {
      const projectId = configuredProject1.projectId;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (getProjectById as jest.Mock).mockResolvedValue(true);
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
          localeI18ln.getTranslation('persistResponse.projectUpdatedSuccess'),
          200,
          expect.arrayContaining([expect.objectContaining(updatedProject)])
        )
      );
    });

    it('should return success with empty data when persisted data is an empty array', async () => {
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

    it('should fail to update a project when verification fails', async () => {
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (getProjectById as jest.Mock).mockResolvedValue(false);
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

    it('should fail if organization name is not found', async () => {
      const projectId = configuredProject1.projectId as string;
      const updatedProject: ConfiguredProject = configuredProject1;
      const mockProjectData: ConfiguredProject[] = [configuredProject1];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (getProjectById as jest.Mock).mockResolvedValue(true);
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

    it('should not clear cache if projectName is the same', async () => {
      const mockProjectData: ConfiguredProject[] = [configuredProject1];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );
      (getProjectById as jest.Mock).mockResolvedValue(true);
      (getOrganisationName as jest.Mock).mockResolvedValue('OrgName');
      (clearCacheByProjectId as jest.Mock).mockImplementation(() => {});

      const response = await UpdateConfiguredProjectById(
        configuredProject1.projectName,
        configuredProject1
      );

      expect(clearCacheByProjectId).not.toHaveBeenCalled();
      expect(response).toEqual(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.projectUpdatedSuccess'),
          200,
          expect.anything()
        )
      );
    });

    it('should handle errors and return a failure response', async () => {
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
  });

  describe('DeleteConfiguredProjectById', () => {
    it('should delete a project when user confirms', async () => {
      const projectId = configuredProject1.projectId;
      const mockProjectData: ConfiguredProject[] = [
        configuredProject1,
        configuredProject2,
      ];

      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockProjectData
      );

      const mockClearCacheByProjectId = clearCacheByProjectId as jest.Mock;
      mockClearCacheByProjectId.mockResolvedValue(projectId);

      expect(PersistenceInstance.set).toHaveBeenCalledTimes(0);
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
        await DeleteConfiguredProjectById(projectId as string);
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
});
