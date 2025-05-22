import { Uri } from 'vscode';
import {
  getFilePathuri,
  getProjectIdByName,
  slotInstance,
} from '../../../vscode-extension/utils/helper';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import path from 'path';

jest.mock('../../../vscode-extension/utils/persistanceState', () => ({
  PersistenceInstance: {
    getByKey: jest.fn(),
  },
}));

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getOpenedFolderName: jest.fn(),
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
      onChangeScreen: jest.fn(),
    },
  })
);

describe('Utility functions', () => {
  describe('createVulSlot', () => {
    it('should return the initial value of slot as true', () => {
      expect(slotInstance.getSlot()).toBe(true);
    });

    it('should update the slot value when setSlot is called', () => {
      slotInstance.setSlot(false);
      expect(slotInstance.getSlot()).toBe(false);
    });

    it('should allow toggling the slot value multiple times', () => {
      slotInstance.setSlot(true);
      expect(slotInstance.getSlot()).toBe(true);
      slotInstance.setSlot(false);
      expect(slotInstance.getSlot()).toBe(false);
    });
  });

  describe('getFilePathuri', () => {
    it('should return the relative file path if the folder name is found', async () => {
      const fileName = '/project/src/file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = await getFilePathuri(fileName);
      expect(result).toBe('file.js');
    });

    it('should return null if the folder name is not found', async () => {
      const fileName = '/project/src/file.js';
      const folderName = 'dist';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = await getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });

    it('should return the relative path when there are multiple folder parts', async () => {
      const fileName = '/project/src/subfolder/file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = await getFilePathuri(fileName);
      expect(result).toBe('subfolder/file.js');
    });

    it('should return null when the folder name is at the root level', async () => {
      const fileName = '/project/file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = await getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });

    it('should handle file names without slashes', async () => {
      const fileName = 'file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = await getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });

    it('should handle empty file name', async () => {
      const fileName = '';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = await getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });
  });

  describe('getProjectIdByName', () => {
    it('should return project when it exists in persisted data', () => {
      const projectName = 'MyProject';
      const persistedData = [
        { projectName: 'MyProject', projectId: '123', source: 'scan' },
        { projectName: 'OtherProject', projectId: '456', source: 'scan' },
      ];
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const result = getProjectIdByName(projectName);
      expect(result).toEqual({
        projectName: 'MyProject',
        projectId: '123',
        source: 'scan',
      });
    });

    it('should return undefined when project is not found', () => {
      const projectName = 'NonExistentProject';
      const persistedData = [
        { projectName: 'MyProject', projectId: '123' },
        { projectName: 'OtherProject', projectId: '456' },
      ];
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const result = getProjectIdByName(projectName);
      expect(result).toBeUndefined();
    });

    it('should return undefined when persisted data is empty', () => {
      const projectName = 'MyProject';
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue([]);

      const result = getProjectIdByName(projectName);
      expect(result).toBeUndefined();
    });

    it('should return the correct project even if there are multiple with similar names', () => {
      const projectName = 'MyProject';
      const persistedData = [
        { projectName: 'MyProject', projectId: '123', source: 'scan' },
        { projectName: 'MyProject_v2', projectId: '124', source: 'scan' },
      ];
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const result = getProjectIdByName(projectName);
      expect(result).toEqual({
        projectName: 'MyProject',
        projectId: '123',
        source: 'scan',
      });
    });
  });
});
