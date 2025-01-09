import {
  getFilePathuri,
  getProjectIdByName,
  slotInstance,
} from '../../../vscode-extension/utils/helper';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';

jest.mock('../../../vscode-extension/utils/persistanceState', () => ({
  PersistenceInstance: {
    getByKey: jest.fn(),
  },
}));

jest.mock('../../../vscode-extension/utils/commonUtil', () => ({
  getOpenedFolderName: jest.fn(),
}));

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
    it('should return the relative file path if the folder name is found', () => {
      const fileName = '/project/src/file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = getFilePathuri(fileName);
      expect(result).toBe('file.js');
    });

    it('should return null if the folder name is not found', () => {
      const fileName = '/project/src/file.js';
      const folderName = 'dist';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });

    it('should return the relative path when there are multiple folder parts', () => {
      const fileName = '/project/src/subfolder/file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = getFilePathuri(fileName);
      expect(result).toBe('subfolder/file.js');
    });

    it('should return null when the folder name is at the root level', () => {
      const fileName = '/project/file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });

    it('should handle file names without slashes', () => {
      const fileName = 'file.js';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });

    it('should handle empty file name', () => {
      const fileName = '';
      const folderName = 'src';
      require('../../../vscode-extension/utils/commonUtil').getOpenedFolderName.mockReturnValue(
        folderName
      );

      const result = getFilePathuri(fileName);
      expect(result).toBeUndefined();
    });
  });

  describe('getProjectIdByName', () => {
    it('should return project when it exists in persisted data', () => {
      const projectName = 'MyProject';
      const persistedData = [
        { projectName: 'MyProject', projectId: '123' },
        { projectName: 'OtherProject', projectId: '456' },
      ];
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const result = getProjectIdByName(projectName);
      expect(result).toEqual({ projectName: 'MyProject', projectId: '123' });
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
        { projectName: 'MyProject', projectId: '123' },
        { projectName: 'MyProject_v2', projectId: '124' },
      ];
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        persistedData
      );

      const result = getProjectIdByName(projectName);
      expect(result).toEqual({ projectName: 'MyProject', projectId: '123' });
    });
  });
});
