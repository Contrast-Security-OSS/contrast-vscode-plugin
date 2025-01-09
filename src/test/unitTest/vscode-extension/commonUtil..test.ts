import { getVulnerabilitiesRefreshCycle } from '../../../vscode-extension/utils/commonUtil';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';

jest.mock('../../../vscode-extension/utils/persistanceState');

describe('getVulnerabilitiesRefreshCycle', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the refresh cycle for the project when found', async () => {
    const mockPersistedData = [
      {
        projectId: 'project-123',
        minute: '15',
      },
      {
        projectId: 'project-456',
        minute: '30',
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
      },
    ];

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockPersistedData
    );

    const result = await getVulnerabilitiesRefreshCycle('project-123');

    expect(result).toBe(10);
  });
});
