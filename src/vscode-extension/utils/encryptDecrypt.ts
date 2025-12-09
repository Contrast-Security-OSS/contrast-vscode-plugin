import * as vscode from 'vscode';

export class SecretService {
  //Intialize the secretStorage
  private secretStorage: vscode.SecretStorage;

  constructor(secretStorage: vscode.SecretStorage) {
    this.secretStorage = secretStorage;
  }

  // Store a secret
  async storeSecret(key: string, value: string): Promise<void> {
    await this.secretStorage.store(key, value);
  }

  // Get a secret
  async getSecret(key: string): Promise<string | undefined> {
    return await this.secretStorage.get(key);
  }

  // Delete a secret
  async deleteSecret(key: string): Promise<void> {
    await this.secretStorage.delete(key);
  }
}
