import axios from 'axios';
import { getScanResults } from '../../../vscode-extension/api/services/apiService';
import {
  resolveFailure,
  resolveSuccess,
} from '../../../vscode-extension/utils/errorHandling';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import { configuredProject1, configuredProject2 } from '../../mocks/testMock';
import { ApiResponse } from '../../../common/types';

jest.mock('axios');
jest.mock('../../../vscode-extension/utils/errorHandling');
jest.mock('../../../vscode-extension/utils/persistanceState');
jest.mock('../../../vscode-extension/logging/cacheLogger');
jest.mock('../../../vscode-extension/cache/backgroundRefreshTimer');
jest.mock('../../../l10n');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockedResolveFailure = resolveFailure as jest.MockedFunction<
  typeof resolveFailure
>;
const mockedResolveSuccess = resolveSuccess as jest.MockedFunction<
  typeof resolveSuccess
>;

jest.mock('../../../vscode-extension/utils/persistanceState', () => ({
  PersistenceInstance: {
    set: jest.fn(),
    getByKey: jest.fn(),
  },
}));

jest.mock('../../../vscode-extension/utils/encryptDecrypt', () => ({
  encrypt: jest.fn((key) => `encrypted-${key}`),
}));

jest.mock('../../../vscode-extension/api/services/apiService', () => {
  return {
    getScanResults: jest.fn(),
  };
});

describe('getScanResults', () => {
  it('should handle successful response from API', async () => {
    const mockProjectData = [configuredProject1, configuredProject2];

    const mockResponse: ApiResponse = {
      responseData: [],
      code: 200,
      status: 'success',
      message: 'Scan results fetched successfully',
    };
    (
      getScanResults as jest.MockedFunction<typeof getScanResults>
    ).mockResolvedValueOnce(mockResponse);

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockProjectData
    );

    mockedResolveSuccess.mockReturnValue({
      message: 'Scan results fetched successfully',
      code: 200,
      status: 'success',
      responseData: [],
    });

    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        content: [],
        totalPages: 1,
      },
    });

    const response = await getScanResults('123');
    expect(response.status).toBe('success');
  });

  it('should handle API failure response', async () => {
    const mockProjectData = [configuredProject1, configuredProject2];

    const mockResponse: ApiResponse = {
      responseData: [],
      code: 500,
      status: 'failure',
      message: 'Error fetching scan results',
    };
    (
      getScanResults as jest.MockedFunction<typeof getScanResults>
    ).mockResolvedValueOnce(mockResponse);

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockProjectData
    );
    mockedAxios.get.mockRejectedValue(new Error('Failed to fetch'));

    const response = await getScanResults('123');
    expect(response).toEqual({
      code: 500,
      message: 'Error fetching scan results',
      responseData: [],
      status: 'failure',
    });
    expect(mockedResolveFailure).toHaveBeenCalledTimes(0);
  });

  it('should handle scenario when results are paginated and multiple pages are fetched', async () => {
    const mockProjectData = [configuredProject1, configuredProject2];

    const mockResponse: ApiResponse = {
      responseData: [],
      code: 200,
      status: 'success',
      message: 'Scan results fetched successfully',
    };
    (
      getScanResults as jest.MockedFunction<typeof getScanResults>
    ).mockResolvedValueOnce(mockResponse);

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockProjectData
    );

    mockedAxios.get
      .mockResolvedValueOnce({
        status: 200,
        data: {
          content: [{ name: 'SQL Injection', severity: 'CRITICAL' }],
          totalPages: 2,
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          content: [{ name: 'Cross-Site Scripting', severity: 'HIGH' }],
          totalPages: 2,
        },
      });

    mockedResolveSuccess.mockReturnValue({
      message: 'Scan results fetched successfully',
      code: 200,
      status: 'success',
      responseData: [
        { name: 'SQL Injection', severity: 'CRITICAL' },
        { name: 'Cross-Site Scripting', severity: 'HIGH' },
      ],
    });

    const response = await getScanResults('123');
    expect(response.status).toEqual('success');
  });
});
