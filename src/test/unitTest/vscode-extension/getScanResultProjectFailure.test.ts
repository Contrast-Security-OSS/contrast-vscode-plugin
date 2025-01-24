import { l10n } from '../../../l10n';
import { resolveFailure } from '../../../vscode-extension/utils/errorHandling';
import { PersistenceInstance } from '../../../vscode-extension/utils/persistanceState';
import { GetAllConfiguredProjects } from '../../../vscode-extension/persistence/PersistenceConfigSetting';
import { configuredProject1, configuredProject2 } from '../../mocks/testMock';

jest.mock('axios');
jest.mock('../../../vscode-extension/utils/errorHandling');
jest.mock('../../../vscode-extension/utils/persistanceState');
jest.mock('../../../vscode-extension/logging/cacheLogger');
jest.mock('../../../vscode-extension/cache/backgroundRefreshTimer');
jest.mock('../../../l10n');

const mockedResolveFailure = resolveFailure as jest.MockedFunction<
  typeof resolveFailure
>;

const locale = new l10n('en');

jest.mock('../../../vscode-extension/utils/persistanceState', () => ({
  PersistenceInstance: {
    set: jest.fn(),
    getByKey: jest.fn(),
  },
}));

jest.mock('../../../vscode-extension/utils/encryptDecrypt', () => ({
  encrypt: jest.fn((key) => `encrypted-${key}`),
}));

jest.mock(
  '../../../vscode-extension/persistence/PersistenceConfigSetting',
  () => {
    return {
      GetAllConfiguredProjects: jest.fn(),
    };
  }
);

describe('getScanResultProject', () => {
  it('should return project not found if the project does not exist', async () => {
    const mockProjectData = [configuredProject1, configuredProject2];
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const mockResponse: any = {
      responseData: mockProjectData,
      code: 200,
      status: 'success',
      message: 'Projects fetched successfully',
    };
    (
      GetAllConfiguredProjects as jest.MockedFunction<
        typeof GetAllConfiguredProjects
      >
    ).mockResolvedValueOnce(mockResponse);

    (PersistenceInstance.getByKey as jest.Mock).mockReturnValue(
      mockProjectData
    );

    mockedResolveFailure.mockReturnValue({
      message: locale.getTranslation('apiResponse.projectNotFound') as string,
      code: 400,
      status: 'failure',
      responseData: {},
    });
  });
});
