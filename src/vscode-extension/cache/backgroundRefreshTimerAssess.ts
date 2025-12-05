import { localeI18ln } from '../../l10n';
import {
  DateTime,
  getCacheFilterData,
  getVulnerabilitiesRefreshCycle,
} from '../utils/commonUtil';
import {
  ASSESS_KEYS,
  SETTING_KEYS,
  TOKEN,
  WEBVIEW_COMMANDS,
} from '../utils/constants/commands';
import { PersistenceInstance } from '../utils/persistanceState';
import {
  clearCacheByProjectId,
  commonRefreshAssessLibrariesCache,
} from './cacheManager';
import { ShowInformationPopup } from '../commands/ui-commands/messageHandler';
import { window } from 'vscode';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';
import {
  AssessFilter,
  commonResponse,
  ConfiguredProject,
  LogLevel,
  PersistedDTO,
  ScaFiltersType,
} from '../../common/types';
import { loggerInstance } from '../logging/logger';
import { AssessRequest } from '../api/model/api.interface';
import { LocaleMemoryCacheInstance } from '../utils/localeMemoryCache';
import { randomUUID } from 'crypto';

//to set inteval based on the recycle time
let interval: ReturnType<typeof setInterval> | undefined;
export async function startBackgroundTimerAssess(
  projectId: string
): Promise<void> {
  const startTime: string = DateTime();
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];
  const project = persistedData.find(
    (project: ConfiguredProject) =>
      project?.projectId === projectId && project?.source === 'assess'
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
    project?.projectId as string,
    false
  );
  interval = setInterval(
    async () => {
      try {
        const persist = await getCacheFilterData();
        const libFilters = (await LocaleMemoryCacheInstance.getItem(
          TOKEN.ASSESS,
          ASSESS_KEYS.SCA_FILTERS
        )) as ScaFiltersType | undefined;
        if (persist.code === 400 || libFilters === undefined) {
          return persist;
        }

        if (persist.code === 400 || libFilters === undefined) {
          return persist;
        }

        const persistData = persist.responseData as AssessFilter;
        const params = {
          apiKey: persistData.apiKey,
          contrastURL: persistData.contrastURL,
          userName: persistData.userName,
          serviceKey: persistData.serviceKey,
          organizationId: persistData.organizationId,
          source: persistData.source,
        };

        const addParams: AssessRequest = {
          orgId: persistData.organizationId ?? '',
          appId: persistData.appId ?? '',
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          servers: persistData.servers || [],
          appVersionTags: persistData.appVersionTags ?? '',

          severities: persistData.severities ?? '',
          status: persistData.status ?? '',
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          startDate: !persistData.startDate?.dateTime
            ? new Date(persistData.startDate?.dateTime as string).getTime()
            : 0,
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          endDate: !persistData.endDate?.dateTime
            ? new Date(persistData.endDate?.dateTime as string).getTime()
            : 0,
          agentSessionId: persistData.agentSessionId ?? '',
        };

        ShowInformationPopup(
          localeI18ln.getTranslation('apiResponse.cacheStarted')
        );

        const resultAssess = await commonRefreshAssessLibrariesCache(
          libFilters,
          addParams,
          params
        );

        if (
          resultAssess !== undefined &&
          resultAssess.code === 200 &&
          resultAssess.responseData !== null &&
          resultAssess.responseData !== undefined
        ) {
          const { assess, library } =
            resultAssess.responseData as commonResponse;
          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY,
            data: assess ?? null,
          });
          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.SCA_GET_ALL_FILES_VULNERABILITY,
            data: library ?? null,
          });

          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.SCA_AUTO_REFRESH,
            data: randomUUID(),
          });

          window.showInformationMessage(
            `${localeI18ln.getTranslation('persistResponse.assessAutoRefreshSuccess')} ${formatDate(new Date())}`
          );
          const logData = `Start Time: ${startTime} | End Time: ${DateTime()} | Message: Auto-Refresh - Vulnerability Sync Process Completed`;
          void loggerInstance?.logMessage(LogLevel.INFO, logData);
        }
      } catch (err) {
        if (err instanceof Error) {
          const logData = `Start Time: ${startTime} | End Time: ${DateTime()} | Message: Auto-Refresh - ${err.message} \n`;
          void loggerInstance?.logMessage(LogLevel.ERROR, logData);
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

export async function stopBackgroundTimerAssess(): Promise<void> {
  if (interval !== undefined) {
    clearInterval(interval);
  }
}

export async function resetBackgroundTimerAssess(
  projectId: string
): Promise<void> {
  if (interval !== undefined) {
    clearInterval(interval);
  }

  await clearCacheByProjectId('assess-' + projectId);

  await startBackgroundTimerAssess('assess-' + projectId);
}
