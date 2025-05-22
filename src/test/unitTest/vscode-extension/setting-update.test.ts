/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfiguredProject } from '../../../common/types';
import {
  GetAssessFilter,
  UpdateConfiguredProjectById,
} from '../../../vscode-extension/persistence/PersistenceConfigSetting';

import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';

import path from 'path';
import { Uri } from 'vscode';
import { ContrastPanelInstance } from '../../../vscode-extension/commands/ui-commands/webviewHandler';

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
      clearAssessPersistance: jest.fn(),
      clearPrimaryAssessFilter: jest.fn(),
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
}));

jest.mock('../../../vscode-extension/logging/logger', () => ({
  loggerInstance: {
    logMessage: jest.fn(),
  },
}));

jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => ({
    GetAssessFilter: jest.fn(),
    UpdateConfiguredProjectById: jest.fn(),
  })
);

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      clearAssessPersistance: jest.fn(),
      clearPrimaryAssessFilter: jest.fn(),
      resetAssessVulnerabilityRecords: jest.fn(),
    },
  })
);

describe('UpdateConfiguredProjectById', () => {
  let configuredProject1: ConfiguredProject;
  let updatedProject: ConfiguredProject;

  beforeEach(() => {
    configuredProject1 = {
      id: '1',
      source: 'assess',
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

  it('should call ContrastPanelInstance.clearAssessPersistance and clearPrimaryAssessFilter methods', async () => {
    const dummyProject = {
      ...configuredProject1,
      id: '1',
      source: 'assess',
      projectName: 'InitialProjectName',
    };

    const updatedProject: ConfiguredProject = {
      ...dummyProject,
      organizationId: 'UpdatedProjectName',
    };

    const mockProjectData: ConfiguredProject[] = [dummyProject];

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockProjectData
    );

    (GetAssessFilter as jest.Mock).mockResolvedValue({
      responseData: {
        projectId: '42a30a30-a34d-43ee-b347-8fd2dc5775ff',
        id: '1',
      },
    });

    await UpdateConfiguredProjectById('1', updatedProject);

    await ContrastPanelInstance.clearAssessPersistance();
    await ContrastPanelInstance.clearPrimaryAssessFilter();

    expect(ContrastPanelInstance.clearAssessPersistance).toHaveBeenCalledTimes(
      1
    );
    expect(
      ContrastPanelInstance.clearPrimaryAssessFilter
    ).toHaveBeenCalledTimes(1);
  });
});
