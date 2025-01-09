import * as vscode from 'vscode';
import { PersistenceState } from '../../../vscode-extension/utils/persistanceState';
import {
  ConfiguredProject,
  FilterType,
  PersistedDTO,
} from '../../../common/types';

jest.mock('vscode', () => ({
  Memento: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    update: jest.fn(),
  })),
}));

describe('PersistenceState', () => {
  let memento: jest.Mocked<vscode.Memento>;
  let persistenceState: PersistenceState;

  beforeEach(() => {
    memento = {
      get: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<vscode.Memento>;

    persistenceState = new PersistenceState();
    persistenceState.registerContext(memento);
  });

  it('should register a new context with localStorage', () => {
    const context = {};
    persistenceState.registerContext(context as vscode.Memento);
    expect(persistenceState.localStorage).toBe(context);
  });

  it('should clear the token data', async () => {
    const token = 'token1';
    await persistenceState.clear(token);
    expect(memento.update).toHaveBeenCalledWith(token, null);
  });

  describe('set', () => {
    it('should create new data for the token if no existing data is found', async () => {
      const token = 'token1';
      const key = 'key1' as keyof PersistedDTO;
      const payload: FilterType = {
        severity: {
          CRITICAL: true,
          HIGH: false,
          MEDIUM: false,
          LOW: false,
          NOTE: false,
        },
        status: {
          REPORTED: true,
          CONFIRMED: false,
          SUSPICIOUS: false,
          NOT_A_PROBLEM: false,
          REMEDIATED: false,
          REMEDIATED_AUTO_VERIFIED: false,
          REOPENED: false,
        },
      };

      memento.get.mockReturnValueOnce(undefined);

      await persistenceState.set(token, key, payload);

      expect(memento.update).toHaveBeenCalledWith(token, { key1: payload });
    });

    it('should update an array of ConfiguredProject', async () => {
      const token = 'token1';
      const key = 'configuredProjects' as keyof PersistedDTO;
      const payload: ConfiguredProject[] = [
        {
          apiKey: 'apiKey1',
          contrastURL: 'url1',
          userName: 'user1',
          serviceKey: 'serviceKey1',
          organizationId: 'org1',
          source: 'source1',
          projectName: 'project1',
          projectId: '1',
          minute: 10,
        },
        {
          apiKey: 'apiKey2',
          contrastURL: 'url2',
          userName: 'user2',
          serviceKey: 'serviceKey2',
          organizationId: 'org2',
          source: 'source2',
          projectName: 'project2',
          projectId: '2',
          minute: 20,
        },
      ];

      const existingData: PersistedDTO = { configuredProjects: [] };
      memento.get.mockReturnValueOnce(existingData);

      await persistenceState.set(token, key, payload);

      expect(memento.update).toHaveBeenCalledWith(token, {
        configuredProjects: payload,
      });
    });

    it('should update data correctly for a new key if data exists for other keys', async () => {
      const token = 'token2';
      const key = 'configuredProjects' as keyof PersistedDTO;
      const payload: ConfiguredProject[] = [
        {
          apiKey: 'apiKey1',
          contrastURL: 'url1',
          userName: 'user1',
          serviceKey: 'serviceKey1',
          organizationId: 'org1',
          source: 'source1',
          projectName: 'project1',
          projectId: '1',
          minute: 10,
        },
      ];

      const existingData: PersistedDTO = {
        configuredProjects: [],
        key1: { severity: {} },
      };
      memento.get.mockReturnValueOnce(existingData);

      await persistenceState.set(token, key, payload);

      expect(memento.update).toHaveBeenCalledWith(token, {
        configuredProjects: payload,
        key1: { severity: {} },
      });
    });

    it('should create a new store if no data exists for any key', async () => {
      const token = 'token3';
      const key = 'configuredProjects' as keyof PersistedDTO;
      const payload: ConfiguredProject[] = [
        {
          apiKey: 'apiKey1',
          contrastURL: 'url1',
          userName: 'user1',
          serviceKey: 'serviceKey1',
          organizationId: 'org1',
          source: 'source1',
          projectName: 'project1',
          projectId: '1',
          minute: 10,
        },
      ];

      memento.get.mockReturnValueOnce(undefined);
      await persistenceState.set(token, key, payload);

      expect(memento.update).toHaveBeenCalledWith(token, {
        configuredProjects: payload,
      });
    });

    it('should update data correctly for a new key if data exists for other keys', async () => {
      const token = 'token2';
      const key = 'configuredProjects' as keyof PersistedDTO;
      const payload: ConfiguredProject[] = [
        {
          apiKey: 'apiKey1',
          contrastURL: 'url1',
          userName: 'user1',
          serviceKey: 'serviceKey1',
          organizationId: 'org1',
          source: 'source1',
          projectName: 'project1',
          projectId: '1',
          minute: 10,
        },
      ];

      const existingData: PersistedDTO = {
        configuredProjects: [],
        key1: { severity: {} },
      };
      memento.get.mockReturnValueOnce(existingData);

      await persistenceState.set(token, key, payload);

      expect(memento.update).toHaveBeenCalledWith(token, {
        configuredProjects: payload,
        key1: { severity: {} },
      });
    });
  });

  describe('get', () => {
    it('should return an empty array when no data is found for the token', () => {
      const token = 'token1';
      memento.get.mockReturnValueOnce(undefined);

      const result = persistenceState.get(token);

      expect(result).toEqual(undefined);
    });

    it('should return the stored data for the given token', () => {
      const token = 'token1';
      const storedData = [{ key1: { value: 'data' } }];
      memento.get.mockReturnValueOnce(storedData);

      const result = persistenceState.get(token);

      expect(result).toEqual(storedData);
    });
  });

  describe('getByKey', () => {
    it('should return an empty array if the token has no data or the key is not found', () => {
      const token = 'token1';
      const key = 'key1' as keyof PersistedDTO;
      memento.get.mockReturnValueOnce([{}]);

      const result = persistenceState.getByKey(token, key);

      expect(result).toEqual(undefined);
    });

    it('should return the specific data for the given key', () => {
      const token = 'token1';
      const key = 'key1' as keyof PersistedDTO;
      const storedData = { key1: [{ value: 'data' }] };
      memento.get.mockReturnValueOnce(storedData);
      const result = persistenceState.getByKey(token, key);

      expect(result).toEqual([{ value: 'data' }]);
    });
  });

  describe('clear', () => {
    it('should clear the token data', async () => {
      const token = 'token1';
      await persistenceState.clear(token);
      expect(memento.update).toHaveBeenCalledWith(token, null);
    });
    it('should not update localStorage if the token does not exist', async () => {
      const token = 'nonExistentToken';
      memento.get.mockReturnValueOnce(undefined);

      await persistenceState.clear(token);

      expect(memento.update).toHaveBeenCalledTimes(1);
    });
  });
});
