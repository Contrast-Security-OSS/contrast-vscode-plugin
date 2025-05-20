import path from 'path';
import { Uri } from 'vscode';
import { Level0Vulnerability } from '../../../vscode-extension/api/model/api.interface';
import {
  getVulnerabilitiesRefreshCycle,
  groupByFileName,
} from '../../../vscode-extension/utils/commonUtil';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';

jest.mock('../../../vscode-extension/utils/persistanceState');
/* eslint-disable @typescript-eslint/no-explicit-any */
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

describe('getVulnerabilitiesRefreshCycle', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the refresh cycle for the project when found', async () => {
    const mockPersistedData = [
      {
        projectId: 'project-123',
        minute: '15',
        source: 'scan',
      },
      {
        projectId: 'project-456',
        minute: '30',
        source: 'scan',
      },
    ];

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockPersistedData
    );

    const result = await getVulnerabilitiesRefreshCycle('project-123');

    expect(result).toBe(15);
  });

  it('should throw an error if the project is not found in persisted data', async () => {
    const mockPersistedData = [
      {
        projectId: 'project-123',
        minute: '15',
        source: 'scan',
      },
    ];

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockPersistedData
    );
  });

  it('should return 0 if minute is not set (empty or invalid value)', async () => {
    const mockPersistedData = [
      {
        projectId: 'project-123',
        minute: '',
        source: 'scan',
      },
    ];

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockPersistedData
    );

    const result = await getVulnerabilitiesRefreshCycle('project-123');

    expect(result).toBe(0);
  });

  it('should return the correct refresh cycle even if the minute is a string representing a number', async () => {
    const mockPersistedData = [
      {
        projectId: 'project-123',
        minute: '10',
        source: 'scan',
      },
    ];

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockPersistedData
    );

    const result = await getVulnerabilitiesRefreshCycle('project-123');

    expect(result).toBe(10);
  });

  describe('groupByFileName', () => {
    it('should group vulnerabilities by fileName', () => {
      const vulnerabilities: Level0Vulnerability[] = [
        {
          labelForMapping: 'file1.js',
          language: '',
          label: 'file1.js',
          fileName: 'file1.js',
          level: 0,
          traceId: '',
          lineNumber: 0,
          popupMessage: {
            firstDetected_date: '',
            lastDetected_date: '',
            status: '',
            link: '',
          },
          Substatus_keycode: '',
          severity: '',
          filePath: '',
          howToFix: {
            recommendation: { text: '' },
            custom_recommendation: { text: '' },
            owasp: '',
            cwe: '',
            rule_references: { text: '' },
            custom_rule_references: { text: '' },
          },
          events: {
            data: [
              {
                label: 'Events',
                isRoot: true,
                child: [],
              },
            ],
          },
          tags: [],
          fileFullPath: '',
        },
      ];

      const grouped = groupByFileName(vulnerabilities);

      expect(grouped['file1.js']).toEqual([
        {
          labelForMapping: 'file1.js',
          language: '',
          label: 'file1.js',
          fileName: 'file1.js',
          level: 0,
          traceId: '',
          lineNumber: 0,
          popupMessage: {
            firstDetected_date: '',
            lastDetected_date: '',
            status: '',
            link: '',
          },
          Substatus_keycode: '',
          severity: '',
          filePath: '',
          howToFix: {
            recommendation: { text: '' },
            custom_recommendation: { text: '' },
            owasp: '',
            cwe: '',
            rule_references: { text: '' },
            custom_rule_references: { text: '' },
          },
          events: {
            data: [
              {
                label: 'Events',
                isRoot: true,
                child: [],
              },
            ],
          },
          tags: [],
          fileFullPath: '',
        },
      ]);
    });

    it('should return an empty object when the input is an empty array', () => {
      const grouped = groupByFileName([]);
      expect(grouped).toEqual({});
    });

    it('should group vulnerabilities correctly when all have the same fileName', () => {
      const vulnerabilities: Level0Vulnerability[] = [
        {
          labelForMapping: 'file1.js',
          language: '',
          label: 'file1.js',
          fileName: 'file1.js',
          level: 0,
          traceId: '',
          lineNumber: 0,
          popupMessage: {
            firstDetected_date: '',
            lastDetected_date: '',
            status: '',
            link: '',
          },
          Substatus_keycode: '',
          severity: '',
          filePath: '',
          howToFix: {
            recommendation: { text: '' },
            custom_recommendation: { text: '' },
            owasp: '',
            cwe: '',
            rule_references: { text: '' },
            custom_rule_references: { text: '' },
          },
          events: {
            data: [
              {
                label: 'Events',
                isRoot: true,
                child: [],
              },
            ],
          },
          tags: [],
          fileFullPath: '',
        },
        {
          labelForMapping: 'file2.js',
          language: '',
          label: 'file2.js',
          fileName: 'file2.js',
          level: 0,
          traceId: '',
          lineNumber: 0,
          popupMessage: {
            firstDetected_date: '',
            lastDetected_date: '',
            status: '',
            link: '',
          },
          Substatus_keycode: '',
          severity: '',
          filePath: '',
          howToFix: {
            recommendation: { text: '' },
            custom_recommendation: { text: '' },
            owasp: '',
            cwe: '',
            rule_references: { text: '' },
            custom_rule_references: { text: '' },
          },
          events: {
            data: [
              {
                label: 'Events',
                isRoot: true,
                child: [],
              },
            ],
          },
          tags: [],
          fileFullPath: '',
        },
      ];

      const grouped = groupByFileName(vulnerabilities);

      expect(grouped['file1.js']).toEqual([
        {
          labelForMapping: 'file1.js',
          language: '',
          label: 'file1.js',
          fileName: 'file1.js',
          level: 0,
          traceId: '',
          lineNumber: 0,
          popupMessage: {
            firstDetected_date: '',
            lastDetected_date: '',
            status: '',
            link: '',
          },
          Substatus_keycode: '',
          severity: '',
          filePath: '',
          howToFix: {
            recommendation: { text: '' },
            custom_recommendation: { text: '' },
            owasp: '',
            cwe: '',
            rule_references: { text: '' },
            custom_rule_references: { text: '' },
          },
          events: {
            data: [
              {
                label: 'Events',
                isRoot: true,
                child: [],
              },
            ],
          },
          tags: [],
          fileFullPath: '',
        },
      ]);
      expect(grouped['file2.js']).toEqual([
        {
          labelForMapping: 'file2.js',
          language: '',
          label: 'file2.js',
          fileName: 'file2.js',
          level: 0,
          traceId: '',
          lineNumber: 0,
          popupMessage: {
            firstDetected_date: '',
            lastDetected_date: '',
            status: '',
            link: '',
          },
          Substatus_keycode: '',
          severity: '',
          filePath: '',
          howToFix: {
            recommendation: { text: '' },
            custom_recommendation: { text: '' },
            owasp: '',
            cwe: '',
            rule_references: { text: '' },
            custom_rule_references: { text: '' },
          },
          events: {
            data: [
              {
                label: 'Events',
                isRoot: true,
                child: [],
              },
            ],
          },
          tags: [],
          fileFullPath: '',
        },
      ]);
    });
  });
});
