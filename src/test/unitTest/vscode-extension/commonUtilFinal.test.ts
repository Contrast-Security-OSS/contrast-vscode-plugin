import path from 'path';
import { Uri } from 'vscode';
import {
  SourceJson,
  Vulnerability,
} from '../../../vscode-extension/api/model/api.interface';
import {
  getScanedResultFinalJson,
  getVulnerabilitiesRefreshCycle,
  getAllArtifactUris,
  mapSourceToDestination,
  processJsonData,
  extractLastNumber,
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

jest.mock(
  '../../../vscode-extension/commands/ui-commands/webviewHandler',
  () => ({
    ContrastPanelInstance: {
      postMessage: jest.fn(),
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

  // Test the `mapSourceToDestination` function
  describe('mapSourceToDestination', () => {
    it('should map source data to destination data correctly', () => {
      const sourceArray: SourceJson[] = [
        {
          id: 'vuln-1',
          name: 'Vulnerability 1',
          scanId: 'scan-1',
          projectId: 'project-123',
          ruleId: 'rule-1',
          severity: 'high',
          language: 'javascript',
          message: {
            summary: 'Summary message for Vulnerability 1',
            details: 'Details about the vulnerability 1',
          },
          codeFlows: [
            {
              message: { text: 'Code flow message' },
              threadFlows: [
                {
                  locations: [
                    {
                      location: {
                        physicalLocation: {
                          artifactLocation: {
                            uri: 'C:\\Projects\\WebGoat\\src\\app\\file1.js',
                          },
                        },
                        region: { startLine: 10 },
                      },
                      message: { text: 'Vulnerability in file1.js' },
                    },
                  ],
                },
              ],
            },
          ],
          status: 'open',
          firstCreatedTime: '2024-01-01T00:00:00Z',
          lastSeenTime: '2024-01-02T00:00:00Z',
          isNew: true,
          audit: [],
        },
      ];

      const mapping = {
        id: 'id',
        name: 'label',
        scanId: 'scanId',
        severity: 'severity',
        language: 'language',
      };

      const mockPersistedData = [
        { projectId: 'project-123', contrastURL: 'http://example.com' },
      ];
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockPersistedData
      );

      const result = mapSourceToDestination(sourceArray, mapping);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('vuln-1');
      expect(result[0].label).toBe('Vulnerability 1');
      expect(result[0].scanId).toBe('scan-1');
      expect(result[0].severity).toBe('high');
      expect(result[0].language).toBe('javascript');
      expect(result[0].artifactLocations).toHaveLength(1);
    });
  });

  describe('processJsonData', () => {
    it('should process vulnerability data and map it to source json', () => {
      const vulnerabilityData: Vulnerability[] = [
        {
          id: 'vuln-1',
          name: 'Vulnerability 1',
          scanId: 'scan-1',
          projectId: 'project-123',
          ruleId: 'rule-1',
          severity: 'high',
          language: 'javascript',
          message: {
            text: 'Details about the vulnerability 1',
          },
          codeFlows: [],
          locations: [
            {
              physicalLocation: {
                artifactLocation: { filepath: 'src/app/file1.js' },
                region: {
                  startLine: 0,
                  snippet: {
                    text: '',
                    rendered: {
                      text: '',
                    },
                  },
                  properties: {
                    ir: [],
                  },
                },
              },
              message: {
                text: '',
              },
            },
          ],
          status: 'open',
          firstCreatedTime: '2024-01-01T00:00:00Z',
          lastSeenTime: '2024-01-02T00:00:00Z',
          isNew: true,
          audit: [],
          organizationId: '',
          level: '',
        },
      ];

      const result = processJsonData(vulnerabilityData);

      expect(result).toHaveLength(1);
    });
  });

  describe('getScanedResultFinalJson', () => {
    it('should return the correct final JSON structure', () => {
      const sourceJsonData: SourceJson[] = [
        {
          id: 'vuln-1',
          label: 'Vulnerability 1',
          artifactLocations: [
            {
              filePath: 'src/app/file1.js',
              language: 'javascript',
              scanId: 'scan-1',
              name: 'Vulnerability 1',
              id: 'vuln-1',
              organizationId: 'org-1',
              projectId: 'project-123',
              ruleId: 'rule-1',
              severity: 'high',
              popupMessage: {
                message: 'Vuln message',
                url: 'http://example.com',
              },
            },
          ],
        },
      ];

      const result = getScanedResultFinalJson(sourceJsonData);

      expect(result).toHaveProperty('level', 2);
      expect(result).toHaveProperty('issuesCount', 1);
      expect(result).toHaveProperty('filesCount', 1);
      expect(result.child).toHaveLength(1);
      expect(result.child[0]).toHaveProperty('filePath', 'src/app/file1.js');
    });
  });

  describe('getAllArtifactUris', () => {
    it('should return artifact URIs correctly', () => {
      const sourceItem: SourceJson = {
        id: 'vuln-1',
        name: 'Vulnerability 1',
        scanId: 'scan-1',
        projectId: 'project-123',
        ruleId: 'rule-1',
        severity: 'high',
        language: 'javascript',
        message: { text: 'Vulnerability detected' },
        codeFlows: [
          {
            message: { text: 'Code flow message' },
            threadFlows: [
              {
                locations: [
                  {
                    location: {
                      physicalLocation: {
                        artifactLocation: {
                          uri: 'C:\\Projects\\WebGoat\\src\\app\\file1.js',
                        },
                      },
                      region: { startLine: 10 },
                    },
                    message: { text: 'Vulnerability in file1.js' },
                  },
                ],
              },
            ],
          },
        ],
        lastSeenTime: '2024-01-02T00:00:00Z',
        status: 'open',
        organizationId: 'org-1',
      };

      const mockPersistedData = [
        { projectId: 'project-123', contrastURL: 'http://example.com' },
      ];
      (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
        mockPersistedData
      );

      const result = getAllArtifactUris(sourceItem);

      expect(result).toHaveLength(1);
    });

    it('should handle missing locations gracefully', () => {
      const sourceItem: SourceJson = {
        id: 'vuln-1',
        name: 'Vulnerability 1',
        scanId: 'scan-1',
        projectId: 'project-123',
        ruleId: 'rule-1',
        severity: 'high',
        language: 'javascript',
        message: { text: 'Vulnerability detected' },
        codeFlows: [
          {
            message: { text: 'Code flow message' },
            threadFlows: [],
          },
        ],
        lastSeenTime: '2024-01-02T00:00:00Z',
        status: 'open',
        organizationId: 'org-1',
      };

      const result = getAllArtifactUris(sourceItem);

      expect(result).toHaveLength(0);
    });
  });

  describe('extractLastNumber', () => {
    it('should extract the last number from a string', () => {
      const input = 'abc123';
      const result = extractLastNumber(input);
      expect(result).toBe(123);
    });

    it('should return 0 if no number is found', () => {
      const input = 'abcdef';
      const result = extractLastNumber(input);
      expect(result).toBe(0);
    });

    it('should extract the last number when it is at the end of the string', () => {
      const input = 'abc123def456';
      const result = extractLastNumber(input);
      expect(result).toBe(456);
    });

    it('should extract the last number when it has leading non-digit characters', () => {
      const input = 'test123456';
      const result = extractLastNumber(input);
      expect(result).toBe(123456);
    });

    it('should return 0 if the string is empty', () => {
      const input = '';
      const result = extractLastNumber(input);
      expect(result).toBe(0);
    });

    it('should throw an error for overly long input', () => {
      const input = 'a'.repeat(10000);
      expect(() => extractLastNumber(input)).toThrow('Input too long');
    });

    it('should return 0 if there are trailing spaces after the number', () => {
      const input = 'abc123  ';
      const result = extractLastNumber(input);
      expect(result).toBe(0);
    });

    it('should handle numbers at the start of the string', () => {
      const input = '123abc';
      const result = extractLastNumber(input);
      expect(result).toBe(0);
    });

    it('should handle very large numbers', () => {
      const input = 'abc1234567890123456789';
      const result = extractLastNumber(input);
      expect(result).toBe(1234567890123456789);
    });

    it('should handle input that is just a number', () => {
      const input = '987654321';
      const result = extractLastNumber(input);
      expect(result).toBe(987654321);
    });
  });
});
