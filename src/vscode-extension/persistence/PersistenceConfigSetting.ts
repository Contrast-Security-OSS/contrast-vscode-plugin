import {
  ASSESS_KEYS,
  SCAN_KEYS,
  SETTING_KEYS,
  TOKEN,
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../utils/constants/commands';
import { decrypt, encrypt } from '../utils/encryptDecrypt';
import { resolveFailure, resolveSuccess } from '../utils/errorHandling';
import { PersistenceInstance } from '../utils/persistanceState';
import {
  ApiResponse,
  AssessFilter,
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
  getApplicationById,
  getOrganisationName,
  getProjectById,
} from '../api/services/apiService';
import { clearCacheByProjectId } from '../cache/cacheManager';
import { localeI18ln } from '../../l10n';
import { DateTime } from '../utils/commonUtil';
import { loggerInstance } from '../logging/logger';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';
import { closeActiveFileHightlighting, isNotNull } from '../utils/helper';
import { stopBackgroundTimerAssess } from '../cache/backgroundRefreshTimerAssess';
import { updateGlobalWebviewConfig } from '../utils/multiInstanceConfigSync';

async function AddProjectToConfig(
  payload: ConfiguredProject
): Promise<ApiResponse> {
  const isScan = payload.source === 'scan';
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
      const isVerified = isScan
        ? await getProjectById(payload)
        : (await getApplicationById(payload.projectId as string, payload))
              .code === 200
          ? true
          : false;

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
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: ${isScan ? 'Project' : 'Application'} Added Successfully \n`;
        void loggerInstance?.logMessage(LogLevel.INFO, logData);
        return Promise.resolve(
          resolveSuccess(
            localeI18ln.getTranslation(
              `persistResponse.${isScan ? 'projectAddedSuccess' : 'applicationAddedSuccess'}`
            ),
            200,
            (await allConfigProjects).responseData
          )
        );
      } else {
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Add ${isScan ? 'Project' : 'Application'}  - Authentication failure \n`;
        void loggerInstance?.logMessage(LogLevel.ERROR, logData);
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
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Add ${isScan ? 'Project' : 'Application'}  - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
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
      void loggerInstance?.logMessage(LogLevel.ERROR, `${error.message} \n`);
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
  const isScan = payload.source === 'scan';
  try {
    const persistedData = PersistenceInstance.getByKey(
      TOKEN.SETTING,
      SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
    ) as ConfiguredProject[];

    if (persistedData === null || persistedData.length === 0) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update ${isScan ? 'Project - Project' : 'Application - Application'} Updated Successfully \n`;
      void loggerInstance?.logMessage(LogLevel.INFO, logData);
      return resolveSuccess(
        localeI18ln.getTranslation(
          `persistResponse.${isScan ? 'projectUpdatedSuccess' : 'applicationUpdatedSuccess'}`
        ),
        200,
        []
      );
    }

    const existingProject = persistedData.find(
      (item: ConfiguredProject) => item.id === id
    );

    await updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.SCAN,
      'sharedProjectName',
      existingProject?.projectName ?? ''
    );

    const getOrgName = await getOrganisationName(payload);
    if (getOrgName === null) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update ${isScan ? 'Project' : 'Application'} - Organization ID not found \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
      return resolveFailure(
        localeI18ln.getTranslation('persistResponse.organizationNotFound'),
        400
      );
    }

    const isVerified = isScan
      ? await getProjectById(payload)
      : (await getApplicationById(payload.projectId as string, payload))
            .code === 200
        ? true
        : false;

    if (!isVerified) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update ${isScan ? 'Project' : 'Application'} - Authentication failure \n`;
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

    await PersistenceInstance.set(
      TOKEN.SETTING,
      SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO,
      updatedData
    );
    if (
      existingProject &&
      existingProject !== undefined &&
      existingProject !== null
    ) {
      // Scan Things
      if (
        existingProject.source === 'scan' &&
        (existingProject.source !== payload.source ||
          existingProject.contrastURL !== payload.contrastURL ||
          existingProject.userName !== payload.userName ||
          existingProject.organizationId !== payload.organizationId ||
          existingProject.projectName !== payload.projectName ||
          existingProject.projectId !== payload.projectId)
      ) {
        await updateGlobalWebviewConfig(
          WEBVIEW_SCREENS.SCAN,
          'clearScanThings'
        );
        await updateGlobalWebviewConfig(WEBVIEW_SCREENS.SCAN, 'reloadProjects');
      }

      // Assess Things
      const getActiveApplication = await GetAssessFilter();
      if (
        existingProject.source === 'assess' &&
        (existingProject.source !== payload.source ||
          existingProject.contrastURL !== payload.contrastURL ||
          existingProject.userName !== payload.userName ||
          existingProject.organizationId !== payload.organizationId ||
          existingProject.projectName !== payload.projectName ||
          existingProject.projectId !== payload.projectId)
      ) {
        if (
          isNotNull(getActiveApplication) &&
          isNotNull(getActiveApplication.responseData)
        ) {
          const { projectId, id } =
            getActiveApplication.responseData as ConfiguredProject;
          if (
            existingProject?.id === id &&
            existingProject.projectId === projectId
          ) {
            await updateGlobalWebviewConfig(
              WEBVIEW_SCREENS.SETTING,
              'clearAssessThings'
            );
            await ContrastPanelInstance.clearAssessPersistance();
            await ContrastPanelInstance.clearPrimaryAssessFilter();
            await ContrastPanelInstance.resetAssessVulnerabilityRecords();
            await stopBackgroundTimerAssess();
          }
        }
        await updateGlobalWebviewConfig(
          WEBVIEW_SCREENS.SETTING,
          'reloadApplications'
        );
      }
    }

    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update ${isScan ? 'Project - Project' : 'Application - Application'} updated successfully \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);
    return resolveSuccess(
      localeI18ln.getTranslation(
        `persistResponse.${isScan ? 'projectUpdatedSuccess' : 'applicationUpdatedSuccess'}`
      ),
      200,
      updatedData
    );
  } catch (error) {
    console.error('error', error);
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update ${isScan ? 'Project' : 'Application'} - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    }
    return resolveFailure(
      localeI18ln.getTranslation('persistResponse.errorOccurred'),
      400
    );
  }
}

async function DeleteConfiguredProjectById(
  id: string,
  payload?: ConfiguredProject
): Promise<ApiResponse | undefined> {
  const isScan = payload?.source === 'scan';
  try {
    const persistedData = PersistenceInstance.getByKey(
      TOKEN.SETTING,
      SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
    ) as ConfiguredProject[];
    if (persistedData?.length > 0) {
      const popupPromise = ShowInformationPopupWithOptions(
        localeI18ln.getTranslation(
          `persistResponse.${isScan ? 'deletePreConfirm' : 'deletePreConfirmApplication'}`
        ) as string
      );

      const timeoutPromise = new Promise(
        (resolve) => setTimeout(() => resolve('dismissed'), 15000) // 5 seconds (adjust if needed)
      );

      const popup = await Promise.race([popupPromise, timeoutPromise]);
      if (popup === 'Yes') {
        const updatedDatas = persistedData.filter(
          (item: ConfiguredProject) => item.id !== id
        );
        const deletedProject: ConfiguredProject[] = persistedData.filter(
          (item: ConfiguredProject) => item.id === id
        );
        let isScanDelete: boolean = false;

        if (deletedProject.length > 0) {
          if (deletedProject[0].source === 'scan') {
            isScanDelete = true;
            await closeActiveFileHightlighting();
            await Promise.all([
              updateGlobalWebviewConfig(
                WEBVIEW_SCREENS.SCAN,
                'deleteProject',
                deletedProject[0].projectName ?? ''
              ),
            ]);
          }
          if (deletedProject[0].source === 'assess') {
            await clearCacheByProjectId(deletedProject[0].projectId as string);
          }
        }

        await PersistenceInstance.set(
          TOKEN.SETTING,
          SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO,
          updatedDatas
        );
        if (isScanDelete) {
          await updateGlobalWebviewConfig(
            WEBVIEW_SCREENS.SCAN,
            'reloadProjects'
          );
        }
        ContrastPanelInstance.postMessage({
          command: WEBVIEW_COMMANDS.SETTING_CANCEL_STATE_WHILE_DELETE,
          data: null,
        });
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Delete ${isScan ? 'Project - Project' : 'Application - Application'}  deleted successfully. \n`;
        void loggerInstance?.logMessage(LogLevel.INFO, logData);
        return Promise.resolve(
          resolveSuccess(
            localeI18ln.getTranslation(
              `persistResponse.${isScan ? 'projectDeletedSuccess' : 'applicationDeletedSuccess'}`
            ),
            200,
            true
          )
        );
      } else {
        ContrastPanelInstance.postMessage({
          command: WEBVIEW_COMMANDS.SETTING_CANCEL_STATE_WHILE_DELETE,
          data: null,
        });
      }
    } else {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Delete ${isScan ? 'Project' : 'Application'} - No Data in the Organisation Table. \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
      return Promise.reject(
        resolveSuccess(
          localeI18ln.getTranslation(
            `persistResponse.${isScan ? 'projectDeletionFailed' : 'applicationDeletionFailed'}`
          ),
          200,
          false
        )
      );
    }
  } catch (error) {
    console.error('error', error);
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Delete ${isScan ? 'Project' : 'Application'} - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    }
    ShowInformationPopup(
      localeI18ln.getTranslation(
        `persistResponse.${isScan ? 'projectDeletionFailed' : 'applicationDeletionFailed'}`
      )
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
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
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
      void loggerInstance?.logMessage(LogLevel.INFO, logData);
      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          payload
        )
      );
    } else {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update Filter - Filters updated successfully \n`;
      void loggerInstance?.logMessage(LogLevel.INFO, logData);
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
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    }
    return Promise.reject(
      resolveFailure(
        localeI18ln.getTranslation('persistResponse.errorOccurred'),
        400
      )
    );
  }
}

async function GetAssessFilter(): Promise<ApiResponse> {
  try {
    // PersistenceInstance.clear(TOKEN.SCAN);
    const persistedData = PersistenceInstance.getByKey(
      TOKEN.ASSESS,
      ASSESS_KEYS.FILTERS as keyof PersistedDTO
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
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Assess Filter Data - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    }
    return Promise.reject(
      resolveFailure(
        localeI18ln.getTranslation('persistResponse.errorOccurred'),
        400
      )
    );
  }
}

async function UpdateAssessFilter(payload: AssessFilter): Promise<ApiResponse> {
  try {
    const persistedData = PersistenceInstance.set(
      TOKEN.ASSESS,
      ASSESS_KEYS.FILTERS as keyof PersistedDTO,
      payload
    );
    if (persistedData !== null) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update  Filter - Filters updated successfully \n`;
      void loggerInstance?.logMessage(LogLevel.INFO, logData);
      return Promise.resolve(
        resolveSuccess(
          localeI18ln.getTranslation('persistResponse.filterUpdatedSuccess'),
          200,
          payload
        )
      );
    } else {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Update  Filter -  Filters updated successfully \n`;
      void loggerInstance?.logMessage(LogLevel.INFO, logData);
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
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message:  Update Filter - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
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

  // Assess
  GetAssessFilter,
  UpdateAssessFilter,
};
