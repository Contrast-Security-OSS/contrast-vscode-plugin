import {
  SCAN_KEYS,
  SETTING_KEYS,
  TOKEN,
  WEBVIEW_COMMANDS,
} from '../utils/constants/commands';
import { decrypt, encrypt } from '../utils/encryptDecrypt';
import { resolveFailure, resolveSuccess } from '../utils/errorHandling';
import { PersistenceInstance } from '../utils/persistanceState';
import {
  ApiResponse,
  ConfiguredProject,
  FilterType,
  LogLevel,
  PersistedDTO,
} from '../../common/types';
import { randomUUID } from 'crypto';
import {
  ShowInformationPopup,
  ShowInformationPopupWithOptions,
} from '../commands/ui-commands/messageHandler';
import {
  getOrganisationName,
  getProjectById,
} from '../api/services/apiService';
import { clearCacheByProjectId } from '../cache/cacheManager';
import { localeI18ln } from '../../l10n';
import { DateTime, getOpenedFolderName } from '../utils/commonUtil';
import { loggerInstance } from '../logging/logger';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';

async function AddProjectToConfig(
  payload: ConfiguredProject
): Promise<ApiResponse> {
  try {
    // Encrypt service_key and api_key before saving
    const getOrgName = await getOrganisationName(payload);
    if (getOrgName !== null) {
      const encryptedPayload = {
        id: randomUUID(),
        ...payload,
        serviceKey: encrypt(payload.serviceKey),
        apiKey: encrypt(payload.apiKey),
        organizationName: getOrgName,
      };
      const isVerified = await getProjectById(payload);
      if (isVerified) {
        const configuredProjects = PersistenceInstance.getByKey(
          TOKEN.SETTING,
          SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
        ) as ConfiguredProject[];

        if (configuredProjects !== null) {
          const all: ConfiguredProject[] = [
            ...configuredProjects,
            encryptedPayload,
          ];
          await PersistenceInstance.set(
            TOKEN.SETTING,
            SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO,
            all
          );
        } else {
          await PersistenceInstance.set(
            TOKEN.SETTING,
            SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO,
            [encryptedPayload]
          );
        }
        const allConfigProjects = GetAllConfiguredProjects();
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Project Added Successfully \n`;
        void loggerInstance?.logMessage(LogLevel.INFO, logData);
        return Promise.resolve(
          resolveSuccess(
            localeI18ln.getTranslation('persistResponse.projectAddedSuccess'),
            200,
            (await allConfigProjects).responseData
          )
        );
      } else {
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Add Project - Authentication failure \n`;
        void loggerInstance.logMessage(LogLevel.ERROR, logData);
        return Promise.resolve(
          resolveFailure(
            localeI18ln.getTranslation('apiResponse.badRequest'),
            400
          )
        );
      }
    }
    return Promise.resolve(
      resolveFailure(localeI18ln.getTranslation('apiResponse.badRequest'), 400)
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Add Project - ${error.message} \n`;
      void loggerInstance.logMessage(LogLevel.ERROR, logData);
    }
    console.error('Error in AddProjectToConfig:', error);
    return Promise.reject(
      resolveFailure(
        localeI18ln.getTranslation('persistResponse.errorOccurred'),
        500
      )
    );
  }
}

// Retrieves all persisted projects
async function GetAllConfiguredProjects(): Promise<ApiResponse> {
  try {
    const persistedData: ConfiguredProject[] | undefined =
      PersistenceInstance.getByKey(
        TOKEN.SETTING,
        SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
      ) as ConfiguredProject[] | undefined;

    if (persistedData !== undefined && persistedData?.length > 0) {
      const decryptedData: ConfiguredProject[] = persistedData.map(
        (project: ConfiguredProject) => {
          return {
            ...project,
            serviceKey: decrypt(project.serviceKey),
            apiKey: decrypt(project.apiKey),
          };
        }
      );

      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.fetchAllProjectsSuccess'),
          200,
          decryptedData
        )
      );
    } else {
      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.fetchAllProjectsSuccess'),
          200,
          []
        )
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      void loggerInstance.logMessage(LogLevel.ERROR, `${error.message} \n`);
    }
    return Promise.reject(
      resolveFailure(
        localeI18ln.getTranslation('persistResponse.errorOccurred'),
        400
      )
    );
  }
}

async function UpdateConfiguredProjectById(
  id: string,
  payload: ConfiguredProject
): Promise<ApiResponse> {
  try {
    const persistedData = PersistenceInstance.getByKey(
      TOKEN.SETTING,
      SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
    ) as ConfiguredProject[];

    if (persistedData === null || persistedData.length === 0) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Project - Project Updated Successfully \n`;
      void loggerInstance?.logMessage(LogLevel.INFO, logData);
      return resolveSuccess(
        localeI18ln.getTranslation('persistResponse.projectUpdatedSuccess'),
        200,
        []
      );
    }

    const getOrgName = await getOrganisationName(payload);
    if (getOrgName === null) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Project - Organization ID not found \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
      return resolveFailure(
        localeI18ln.getTranslation('persistResponse.organizationNotFound'),
        400
      );
    }

    const isVerified = await getProjectById(payload);
    if (!isVerified) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Project - Authentication failure \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.badRequest'),
        400
      );
    }

    const updatedData = persistedData.map((item: ConfiguredProject) => {
      if (item.id === id) {
        return {
          ...payload,
          id,
          serviceKey: encrypt(payload.serviceKey),
          apiKey: encrypt(payload.apiKey),
          organizationName: getOrgName,
        };
      }
      return item;
    });

    const existingProject = persistedData.find(
      (item: ConfiguredProject) => item.id === id
    );
    if (
      existingProject &&
      existingProject.projectName !== payload.projectName
    ) {
      await clearCacheByProjectId(existingProject.projectId as string);
    }

    await PersistenceInstance.set(
      TOKEN.SETTING,
      SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO,
      updatedData
    );
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Project - Project updated successfully \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);
    return resolveSuccess(
      localeI18ln.getTranslation('persistResponse.projectUpdatedSuccess'),
      200,
      updatedData
    );
  } catch (error) {
    console.error('error', error);
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Project - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    }
    return resolveFailure(
      localeI18ln.getTranslation('persistResponse.errorOccurred'),
      400
    );
  }
}

async function DeleteConfiguredProjectById(
  id: string
): Promise<ApiResponse | undefined> {
  try {
    const persistedData = PersistenceInstance.getByKey(
      TOKEN.SETTING,
      SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
    ) as ConfiguredProject[];
    if (persistedData?.length > 0) {
      if (
        (await ShowInformationPopupWithOptions(
          localeI18ln.getTranslation(
            'persistResponse.deletePreConfirm'
          ) as string
        )) === 'Yes'
      ) {
        const updatedDatas = persistedData.filter(
          (item: ConfiguredProject) => item.id !== id
        );
        const deletedProject: ConfiguredProject[] = persistedData.filter(
          (item: ConfiguredProject) => item.id === id
        );
        const getActiveProject = getOpenedFolderName();
        if (
          getActiveProject !== undefined &&
          getActiveProject === deletedProject[0].projectName
        ) {
          await clearCacheByProjectId(deletedProject[0].projectId as string);
          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
            data: [],
          });
        }
        await PersistenceInstance.set(
          TOKEN.SETTING,
          SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO,
          updatedDatas
        );
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Delete Project - Project deleted successfully. \n`;
        void loggerInstance.logMessage(LogLevel.INFO, logData);
        return Promise.resolve(
          resolveSuccess(
            localeI18ln.getTranslation('persistResponse.projectDeletedSuccess'),
            200,
            true
          )
        );
      }
    } else {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Delete Project - No Data in the Organisation Table. \n`;
      void loggerInstance.logMessage(LogLevel.ERROR, logData);
      return Promise.reject(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.projectDeletionFailed'),
          200,
          false
        )
      );
    }
  } catch (error) {
    console.error('error', error);
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Delete Project - ${error.message} \n`;
      void loggerInstance.logMessage(LogLevel.ERROR, logData);
    }
    ShowInformationPopup(
      localeI18ln.getTranslation('persistResponse.projectDeletionFailed')
    );
    return Promise.reject(
      resolveFailure(
        localeI18ln.getTranslation('persistResponse.errorOccurred'),
        400
      )
    );
  }
}

async function GetFilters(): Promise<ApiResponse> {
  try {
    // PersistenceInstance.clear(TOKEN.SCAN);
    const persistedData = PersistenceInstance.getByKey(
      TOKEN.SCAN,
      SCAN_KEYS.FILTERS as keyof PersistedDTO
    ) as FilterType;

    if (!Array.isArray(persistedData)) {
      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterRetrivedSucess'),
          200,
          persistedData
        )
      );
    } else {
      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterRetrivedSucess'),
          200,
          null
        )
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Filter Data - ${error.message} \n`;
      void loggerInstance.logMessage(LogLevel.ERROR, logData);
    }
    return Promise.reject(
      resolveFailure(
        localeI18ln.getTranslation('persistResponse.errorOccurred'),
        400
      )
    );
  }
}

async function UpdateFilters(payload: FilterType): Promise<ApiResponse> {
  try {
    const persistedData = PersistenceInstance.set(
      TOKEN.SCAN,
      SCAN_KEYS.FILTERS as keyof PersistedDTO,
      payload
    );
    if (persistedData !== null) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Filter - Filters updated successfully \n`;
      void loggerInstance.logMessage(LogLevel.INFO, logData);
      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          payload
        )
      );
    } else {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Filter - Filters updated successfully \n`;
      void loggerInstance.logMessage(LogLevel.INFO, logData);
      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          null
        )
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Filter - ${error.message} \n`;
      void loggerInstance.logMessage(LogLevel.ERROR, logData);
    }
    return Promise.reject(
      resolveFailure(
        localeI18ln.getTranslation('persistResponse.errorOccurred'),
        400
      )
    );
  }
}

export {
  // Setting
  GetAllConfiguredProjects,
  AddProjectToConfig,
  UpdateConfiguredProjectById,
  DeleteConfiguredProjectById,
  // Scan
  GetFilters,
  UpdateFilters,
};
