import {
  addMarkByOrgId,
  addTagsByOrgId,
  getAssessVulnerabilities,
  getProjectById,
  getScanResults,
  getVulnerabilityEvents,
  getVulnerabilityHttps,
} from '../api/services/apiService';
import { PersistenceInstance } from '../utils/persistanceState';
import { SETTING_KEYS, TOKEN } from '../utils/constants/commands';
import { resolveFailure } from '../utils/errorHandling';
import {
  ApiResponse,
  AssessFilter,
  ConfiguredProject,
  PersistedDTO,
  PrimaryConfig,
} from '../../common/types';
import {
  startBackgroundTimer,
  stopBackgroundTimer,
} from './backgroundRefreshTimer';
import { getCacheFilterData, getOpenedFolderName } from '../utils/commonUtil';
import { localeI18ln } from '../../l10n';
import {
  AssessRequest,
  ChildData,
  Datas,
  EventItem,
  EventLine,
  Events,
  HttpRequest,
  Level1Vulnerability,
  updateParams,
} from '../api/model/api.interface';
import {
  startBackgroundTimerAssess,
  stopBackgroundTimerAssess,
} from './backgroundRefreshTimerAssess';
import {
  ShowErrorPopup,
  ShowInformationPopup,
} from '../commands/ui-commands/messageHandler';

const cacheManager = require('cache-manager');

// Initialize an in-memory cache with a time-to-live (TTL) of 5 minutes (300 seconds)
const memoryCache = cacheManager.caching({
  store: 'memory',
  max: 100,
  ttl: 86400,
});

// Function to refresh the cache with new data
export async function refreshCache(
  projectId: string
): Promise<ApiResponse | undefined> {
  const data = await getScanResults(projectId);
  if (data.code !== 200) {
    await memoryCache.reset();
    return undefined;
  } else {
    await memoryCache.set(projectId, data);
    return data;
  }
}

export async function getDataOnlyFromCache(): Promise<ApiResponse> {
  const projectName = await getOpenedFolderName();
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];
  const project = persistedData?.find(
    (project: ConfiguredProject) =>
      project.projectName === projectName && project.source === 'scan'
  );
  if (project === undefined || project === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }
  const data = await memoryCache.get(project.projectId);

  if (data === null || data === undefined) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.vulnerabilityNotFound'),
      400
    );
  }

  return data;
}

export async function getDataFromCache(isManual = false): Promise<ApiResponse> {
  const projectName = await getOpenedFolderName();
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[] | undefined;

  const project = persistedData?.find(
    (project: ConfiguredProject) =>
      project.projectName === projectName && project.source === 'scan'
  ) as ConfiguredProject | undefined;

  if (project === undefined || project === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  const isProjectActive = await getProjectById(project, false);

  if (!isProjectActive) {
    ShowErrorPopup(
      localeI18ln.getTranslation('apiResponse.ARCHIVED') as string
    );
    await stopBackgroundTimer();
    await clearCacheByProjectId(project.projectId as string);

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.ARCHIVED'),
      400
    );
  }

  const data = await memoryCache.get(project.projectId);

  const applications = data?.applications ?? [];
  if (
    applications.filter((x: Record<string, string>) => x.archived)?.length > 0
  ) {
    ShowInformationPopup(localeI18ln.getTranslation('apiResponse.ARCHIVED'));
    await stopBackgroundTimerAssess();
    await memoryCache.reset();

    applications.map(async (app: Record<string, string>) => {
      await clearCacheByProjectId(app.appId);
    });

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.ARCHIVED'),
      400
    );
  }

  if (data === null || data === undefined || isManual) {
    await stopBackgroundTimer();
    await memoryCache.reset();

    // If cache miss, fetch and set data
    await refreshCache(project.projectId as string);
    const cacheInBytesLength = getCacheSize(project.projectId as string);
    if (cacheInBytesLength / (1024 * 1024) > 10) {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.configureFilter'),
        400
      );
    }

    await startBackgroundTimer(project.projectId as string);

    return memoryCache.get(project.projectId);
  }
  return data;
}

export async function clearCacheByProjectId(projectId: string): Promise<void> {
  memoryCache.del(projectId);
}

export async function disposeCache(): Promise<void> {
  memoryCache.reset();
}

export function getCacheSize(projectId: string): number {
  const cache = memoryCache.get(projectId);
  return Buffer.byteLength(JSON.stringify(cache));
}

export async function getAdviceFromCache(scanId: string): Promise<string> {
  const cache = memoryCache.get(scanId);
  if (cache !== null) {
    return cache;
  }
  return '';
}

export async function updateAdvice(
  scanId: String,
  advise: string
): Promise<void> {
  memoryCache.del(scanId);
  memoryCache.set(scanId, advise);
}

export async function getDataFromCacheAssess(
  requestParams: AssessRequest,
  params: PrimaryConfig,
  _isManual = false
): Promise<ApiResponse> {
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[] | undefined;

  const project = persistedData?.find(
    (project: ConfiguredProject) =>
      project.projectId === requestParams.appId && project.source === 'assess'
  ) as ConfiguredProject | undefined;

  if (project === undefined || project === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  const data = await memoryCache.get('assess-' + project.projectId);
  const applications = data?.applications ?? [];
  if (
    applications.filter((x: Record<string, string>) => x.archived)?.length > 0
  ) {
    ShowErrorPopup(
      localeI18ln.getTranslation('apiResponse.ASSESSARCHIVED') as string
    );
    await stopBackgroundTimerAssess();
    await memoryCache.reset();

    applications.map(async (app: Record<string, string>) => {
      await clearCacheByProjectId(app.appId);
    });

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.ASSESSARCHIVED'),
      400
    );
  }
  if (data === null || data === undefined) {
    await stopBackgroundTimerAssess();
    await memoryCache.reset();

    // If cache miss, fetch and set data
    await refreshCacheAssess(requestParams, params);
    const cacheInBytesLength = getCacheSize(
      ('assess-' + project.projectId) as string
    );
    if (cacheInBytesLength / (1024 * 1024) > 10) {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.configureFilter'),
        400
      );
    }

    await startBackgroundTimerAssess(project.projectId as string);

    return memoryCache.get('assess-' + project.projectId);
  }
  return data;
}

// Function to refresh the cache with new data
export async function refreshCacheAssess(
  requestParams: AssessRequest,
  params: PrimaryConfig
): Promise<ApiResponse | undefined> {
  const data = await getAssessVulnerabilities(requestParams, params);
  if (data.code !== 200) {
    await memoryCache.reset();
    return undefined;
  } else {
    await memoryCache.set('assess-' + requestParams.appId, data);
    return data;
  }
}

// Function to refresh the cache with new data
export async function updateAccessVulnerabilities(
  traceId: string
): Promise<ApiResponse | undefined> {
  const persist = await getCacheFilterData();

  if (persist.code === 400) {
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

  const dataResponse = await getVulnerabilityEvents(
    persistData.organizationId,
    traceId,
    params
  );

  const httpResponse = await getVulnerabilityHttps(
    persistData.organizationId,
    traceId,
    params
  );

  if (dataResponse.code === 200) {
    const cachedData = await memoryCache.get('assess-' + persistData.projectId);
    cachedData.responseData.child?.forEach((childItem: Level1Vulnerability) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      childItem.child?.forEach((nestedChild: any) => {
        if (nestedChild.traceId === traceId) {
          const eventResponseData = dataResponse.responseData as EventItem[];
          const httpsResponseData = httpResponse.responseData as HttpRequest;
          const eventDataArray: ChildData[] = [];

          const eventData: Datas[] = [
            {
              label: 'Events',
              isRoot: true,
              child: eventResponseData?.map((event: EventItem) => {
                const codeViewText = event?.codeView?.lines?.map(
                  (line: EventLine) => ({
                    label: line?.text,
                  })
                );

                const dataViewText = event?.dataView?.lines?.map(
                  (line: EventLine) => ({
                    label: line?.text,
                  })
                );

                eventDataArray.push(...codeViewText, ...dataViewText);

                return {
                  type: event.type,
                  label: event.description,
                  child: eventDataArray,
                };
              }),
            },
          ];

          const events: Events = {
            data: eventData,
          };

          const httpsData: HttpRequest = {
            text: httpsResponseData.text,
          };
          nestedChild.events = events;
          nestedChild.http_request = httpsData;
        }
      });
    });

    await memoryCache.set('assess-' + persistData.projectId, cachedData);

    const cachedTraces = await memoryCache.get('traces-vulnerability');
    let cachedValue = [];

    if (!Array.isArray(cachedTraces)) {
      cachedValue = [];
    } else {
      cachedValue = cachedTraces;
    }

    if (!cachedValue.includes(traceId)) {
      cachedValue.push(traceId);
      await memoryCache.set('traces-vulnerability', cachedValue);
    }

    return cachedData;
  }
}

export async function getDataOnlyFromCacheAssess(): Promise<ApiResponse> {
  const persist = await getCacheFilterData();

  if (persist.code === 400) {
    return persist;
  }

  const persistData = persist.responseData as AssessFilter;

  const data = await memoryCache.get('assess-' + persistData.projectId);

  if (data === null || data === undefined) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.vulnerabilityNotFound'),
      400
    );
  }

  return data;
}

export async function updateTagsByTraceId(
  traceId: string[],
  tags: string[],
  tags_remove: string[]
): Promise<ApiResponse | undefined> {
  const persist = await getCacheFilterData();

  if (persist.code === 400) {
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

  const response = await addTagsByOrgId(
    persistData.organizationId,
    traceId,
    tags,
    tags_remove,
    params
  );

  if (response.code === 200) {
    const cachedData = await memoryCache.get('assess-' + persistData.projectId);
    cachedData.responseData.child?.forEach((childItem: Level1Vulnerability) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      childItem.child?.forEach((nestedChild: any) => {
        if (nestedChild.traceId === traceId[0]) {
          const vulnerabilityTags = tags.map((tags: string, index: number) => ({
            id: index + 1,
            label: tags,
          }));
          nestedChild.tags = vulnerabilityTags;
        }
      });
    });

    await memoryCache.set('assess-' + persistData.projectId, cachedData);
    ShowInformationPopup(
      localeI18ln.getTranslation('apiResponse.vulnerabilityTagged')
    );
    return cachedData;
  } else {
    const errorTag = localeI18ln.getTranslation('apiResponse.failedToTag');
    ShowErrorPopup(
      errorTag !== null && errorTag !== undefined
        ? errorTag
        : 'Oops! Something went wrong.'
    );
  }
}

export async function updateMarkAsByTraceId(
  paramsData: updateParams
): Promise<ApiResponse | undefined> {
  const persist = await getCacheFilterData();

  if (persist.code === 400) {
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

  const addParams = {
    orgId: persistData.organizationId,
    traceId: paramsData.traceId,
    status: paramsData.status,
    note: paramsData.note,
    substatus: paramsData.substatus,
  };

  const response = await addMarkByOrgId(addParams, params);

  if (response.code === 200) {
    const cachedData = await memoryCache.get('assess-' + persistData.projectId);
    cachedData.responseData.child?.forEach((childItem: Level1Vulnerability) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      childItem.child?.forEach((nestedChild: any) => {
        if (nestedChild.traceId === addParams.traceId[0]) {
          nestedChild.popupMessage.status = paramsData.status;
          nestedChild.Substatus_keycode = paramsData.substatus;
        }
      });
    });

    await memoryCache.set('assess-' + persistData.projectId, cachedData);
    ShowInformationPopup(
      localeI18ln.getTranslation('apiResponse.markedVulnerability')
    );
    return cachedData;
  } else {
    const errorMark = localeI18ln.getTranslation('apiResponse.failedToMark');
    ShowErrorPopup(
      errorMark !== null && errorMark !== undefined
        ? errorMark
        : 'Oops! Something went wrong.'
    );
  }
}

export async function updateVulnerabilityTraceIDCache(): Promise<void> {
  const cachedTraces = await memoryCache.get('traces-vulnerability');

  if (cachedTraces !== null || cachedTraces !== undefined) {
    cachedTraces.forEach(async (cacheData: string) => {
      await updateAccessVulnerabilities(cacheData);
    });
  }
}
