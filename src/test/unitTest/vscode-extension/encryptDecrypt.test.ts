/* eslint-disable @typescript-eslint/no-explicit-any */
import { SecretService } from '../../../vscode-extension/utils/encryptDecrypt';
import * as vscode from 'vscode';

describe('SecretService', () => {
  let mockSecretStorage: jest.Mocked<vscode.SecretStorage>;
  let service: SecretService;

  beforeEach(() => {
    mockSecretStorage = {
      store: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      onDidChange: jest.fn() as any, // required by the interface, but not used
    };
    service = new SecretService(mockSecretStorage);
  });

  test('storeSecret should call secretStorage.store with key and value', async () => {
    await service.storeSecret('testKey', 'testValue');
    expect(mockSecretStorage.store).toHaveBeenCalledWith(
      'testKey',
      'testValue'
    );
  });

  test('getSecret should call secretStorage.get and return the value', async () => {
    mockSecretStorage.get.mockResolvedValue('storedValue');

    const result = await service.getSecret('testKey');
    expect(mockSecretStorage.get).toHaveBeenCalledWith('testKey');
    expect(result).toBe('storedValue');
  });

  test('getSecret should return undefined if key not found', async () => {
    mockSecretStorage.get.mockResolvedValue(undefined);

    const result = await service.getSecret('missingKey');
    expect(mockSecretStorage.get).toHaveBeenCalledWith('missingKey');
    expect(result).toBeUndefined();
  });

  test('deleteSecret should call secretStorage.delete with key', async () => {
    await service.deleteSecret('testKey');
    expect(mockSecretStorage.delete).toHaveBeenCalledWith('testKey');
  });
});
