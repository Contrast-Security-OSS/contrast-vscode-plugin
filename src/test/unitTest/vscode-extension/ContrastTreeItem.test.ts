import path from 'path';
import { Uri } from 'vscode';
import {
  ContrastNavigationItems,
  ContrastTreeItem,
} from '../../../vscode-extension/utils/treeItems';
import {
  CONSTRAST_ABOUT,
  CONSTRAST_SCAN,
  CONSTRAST_SETTING,
} from '../../../vscode-extension/utils/constants/commands';

jest.mock('vscode', () => ({
  env: {
    language: 'en',
    appName: 'VSCode',
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/path/to/mock/workspace' } }],
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
}));

describe('ContrastTreeItem', () => {
  it('should create an instance of ContrastTreeItem', () => {
    const treeItem = new ContrastTreeItem(
      'Test Label',
      'test.command',
      'test-icon.png'
    );

    expect(treeItem.label).toBe('Test Label');
    expect(treeItem.command).toEqual({
      title: 'Test Label',
      command: 'test.command',
    });
    expect(treeItem.iconPath).toEqual({
      dark: 'mockUri',
      light: 'mockUri',
    });
  });

  it('should create an instance of ContrastTreeItem without command and icon', () => {
    const treeItem = new ContrastTreeItem('Test Label');

    expect(treeItem.label).toBe('Test Label');
    expect(treeItem.command).not.toBe(null);
    expect(treeItem.iconPath).toBeUndefined();
  });

  describe('ContrastNavigationItems', () => {
    it('should contain the correct number of ContrastTreeItems', () => {
      expect(ContrastNavigationItems.length).toBe(4);
    });

    it('should have the correct labels and commands', () => {
      expect(ContrastNavigationItems[0].label).toBe('About');
      expect(ContrastNavigationItems[0].command).toEqual({
        title: 'About',
        command: CONSTRAST_ABOUT,
      });

      expect(ContrastNavigationItems[1].label).toBe('Contrast - Settings');
      expect(ContrastNavigationItems[1].command).toEqual({
        title: 'Contrast - Settings',
        command: CONSTRAST_SETTING,
      });

      expect(ContrastNavigationItems[2].label).toBe('Contrast - Scan');
      expect(ContrastNavigationItems[2].command).toEqual({
        title: 'Contrast - Scan',
        command: CONSTRAST_SCAN,
      });
    });
  });
});
