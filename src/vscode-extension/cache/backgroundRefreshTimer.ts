import { localeI18ln } from '../../l10n';
import { DateTime, getVulnerabilitiesRefreshCycle } from '../utils/commonUtil';
import {
  SETTING_KEYS,
  TOKEN,
  WEBVIEW_COMMANDS,
} from '../utils/constants/commands';
import { PersistenceInstance } from '../utils/persistanceState';
import {
  clearCacheByProjectId,
  getDataOnlyFromCache,
  refreshCache,
} from './cacheManager';
import { ShowInformationPopup } from '../commands/ui-commands/messageHandler';
import { window } from 'vscode';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';
import { ConfiguredProject, LogLevel, PersistedDTO } from '../../common/types';
import { loggerInstance } from '../logging/logger';

//to set inteval based on the recycle time
let interval: ReturnType<typeof setInterval> | undefined;
export async function startBackgroundTimer(projectId: string): Promise<void> {
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];
  const project = persistedData.find(
    (project: ConfiguredProject) => project?.projectId === projectId
  );
  if (project === null) {
    throw new Error('Project not found');
  }
  const formatDate = (date: Date) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const pad = (num: any) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  const refreshCycle = await getVulnerabilitiesRefreshCycle(
    project?.projectId as string
  );
  interval = setInterval(
    async () => {
      try {
        const project = persistedData.find(
          (project: ConfiguredProject) => project?.projectId === projectId
        );
        if (project !== null && project !== undefined) {
          ShowInformationPopup(
            localeI18ln.getTranslation('apiResponse.cacheStarted')
          );
        }
        const result = await refreshCache(projectId);
        if (result !== undefined) {
          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
            data: await getDataOnlyFromCache(),
          });
          window.showInformationMessage(
            `${localeI18ln.getTranslation('persistResponse.autoRefreshSucess')} ${formatDate(new Date())}`
          );
          const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Auto-Refresh - Vulnerability Sync Process Completed`;
          void loggerInstance.logMessage(LogLevel.INFO, logData);
        }
      } catch (err) {
        if (err instanceof Error) {
          const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Auto-Refresh - ${err.message} \n`;
          void loggerInstance.logMessage(LogLevel.ERROR, logData);
        }
        console.error(
          localeI18ln.getTranslation('apiResponse.failedToRefreshCache'),
          err,
          ShowInformationPopup(
            localeI18ln.getTranslation('apiResponse.failedToRefreshCache')
          )
        );
      }
    },
    refreshCycle * 60 * 1000
  );
}

export async function stopBackgroundTimer(): Promise<void> {
  if (interval !== undefined) {
    clearInterval(interval);
  }
}

export async function resetBackgroundTimer(projectId: string): Promise<void> {
  if (interval !== undefined) {
    clearInterval(interval);
  }

  await clearCacheByProjectId(projectId);

  await startBackgroundTimer(projectId);
}
