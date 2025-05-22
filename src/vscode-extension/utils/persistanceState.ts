import * as vscode from 'vscode';
import {
  AssessFilter,
  ConfiguredProject,
  FilterType,
  PersistedDTO,
} from '../../common/types';

class PersistenceState {
  localStorage!: vscode.Memento;

  registerContext(context: vscode.Memento) {
    this.localStorage = context;
  }

  async set(
    token: string,
    key: keyof PersistedDTO, // Restrict the key to properties of PersistedDTO
    payload: FilterType | ConfiguredProject[] | AssessFilter
  ): Promise<boolean> {
    const getTokenData: PersistedDTO = this.get(token) as PersistedDTO;

    if (getTokenData !== null) {
      // Ensure type safety while updating
      const internal: PersistedDTO = {
        ...getTokenData,
        [key]: payload as ConfiguredProject[] | FilterType, // Type assertion based on the key
      };

      await this.localStorage.update(token, internal);
      return true;
    }

    // Create a new store if no data exists
    const store: PersistedDTO = { [key]: payload } as PersistedDTO;
    await this.localStorage.update(token, store);
    return true;
  }

  get(token: string): PersistedDTO {
    return this.localStorage.get(token) as PersistedDTO;
  }

  getByKey(
    token: string,
    key: keyof PersistedDTO
  ): FilterType | ConfiguredProject[] | null | undefined {
    const getTokenData: PersistedDTO = this.get(token) as PersistedDTO;

    if (getTokenData !== null && getTokenData !== undefined) {
      return getTokenData[key];
    }
    return null;
  }

  async clear(token: string): Promise<void> {
    await this.localStorage.update(token, null);
  }
}

const PersistenceInstance = new PersistenceState();
export { PersistenceState, PersistenceInstance };
