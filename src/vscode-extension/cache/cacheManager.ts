import {
  addMarkByOrgId,
  addTagsByOrgId,
  getAssessVulnerabilities,
  getCVEOverview,
  getLibraryVulnerabilities,
  getProjectById,
  getScanResults,
  getUsageForLibVul,
  getVulnerabilityEvents,
  getVulnerabilityHttps,
  updateLibTags,
} from '../api/services/apiService';
import { PersistenceInstance } from '../utils/persistanceState';
import { SETTING_KEYS, TOKEN } from '../utils/constants/commands';
import { resolveFailure, resolveSuccess } from '../utils/errorHandling';
import {
  ApiResponse,
  AssessFilter,
  commonResponse,
  ConfiguredProject,
  PersistedDTO,
  PrimaryConfig,
  ScaFiltersType,
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
  CVENode,
  CVEOverviewResponse,
  Datas,
  EventItem,
  EventLine,
  Events,
  HttpRequest,
  Level1Vulnerability,
  LibraryNode,
  LibraryUsage,
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
export const memoryCache = cacheManager.caching({
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
    return data;
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

// Library Cache
export async function getDataFromCacheLibrary(
  requestBody: ScaFiltersType
): Promise<ApiResponse> {
  const data = await memoryCache.get('library-' + requestBody.appId);
  if (data === null || data === undefined) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.vulnerabilityNotFound'),
      400
    );
  }
  return resolveSuccess('Cache fetched Successfully', 200, data);
}

export const refreshLibraryVulnerabilities = async (
  requestBody: ScaFiltersType
): Promise<ApiResponse | undefined> => {
  const data = await getLibraryVulnerabilities(requestBody);

  if (data.code !== 200) {
    await memoryCache.reset();
    return data;
  } else {
    await memoryCache.set('library-' + requestBody.appId, data.responseData);
    return data;
  }
};

/* commonRefreshAssessLibrariesCache: A common method which retieve both assess and SCA run-time vulnerabilities concurrently and store it in the cache */
export const commonRefreshAssessLibrariesCache = async (
  requestBody: ScaFiltersType,
  requestParams: AssessRequest,
  params: PrimaryConfig
): Promise<ApiResponse | undefined> => {
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

  await stopBackgroundTimerAssess();
  await memoryCache.reset();
  const responseData = await Promise.allSettled([
    refreshCacheAssess(requestParams, params),
    refreshLibraryVulnerabilities(requestBody),
  ]);

  const result: commonResponse = {
    assess:
      responseData[0].status === 'fulfilled'
        ? (responseData[0].value ?? null)
        : null,
    library:
      responseData[1].status === 'fulfilled'
        ? (responseData[1].value ?? null)
        : null,
  };
  await startBackgroundTimerAssess(project.projectId as string);
  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.vulnerabilitesRetrieved'),
    200,
    result
  );
};

/* updateUsageDetails: Method to update the usage details in the cache for library vulnerabilities. */
export const updateUsageDetails = async (
  hashId: string,
  isUnmapped: boolean = false
) => {
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
  const response = await getUsageForLibVul(
    persistData.projectId,
    hashId,
    params
  );
  if (response.code === 200) {
    const libVul = await memoryCache.get('library-' + persistData.projectId);
    if (libVul !== undefined && Array.isArray(libVul?.child)) {
      libVul.child.forEach((element: LibraryNode) => {
        if (isUnmapped) {
          element?.child?.forEach((childNode: any) => {
            if (childNode?.overview?.hash === hashId) {
              childNode.usage = {
                ...childNode.usage,
                ...(response.responseData as LibraryUsage),
              };
            }
          });
        } else if (element?.overview?.hash === hashId) {
          element.usage = {
            ...element.usage,
            ...(response.responseData as LibraryUsage),
          };
        }
      });
      await memoryCache.set('library-' + persistData.projectId, libVul);
      return libVul;
    }
  }
};

export async function updateLibTagsByHashId(
  hashId: string,
  tags: Array<string>,
  tags_remove: Array<string>,
  isUnmapped: boolean = false
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
  const response = await updateLibTags(params, hashId, tags, tags_remove);
  if (response.code === 200) {
    const cachedData = await memoryCache.get(
      'library-' + persistData.projectId
    );
    cachedData.child?.forEach((childItem: LibraryNode) => {
      if (isUnmapped) {
        childItem?.child?.forEach((nestedChild: any) => {
          if (nestedChild?.overview?.hash === hashId) {
            nestedChild.tags = tags;
          }
        });
      } else if (childItem?.overview?.hash === hashId) {
        childItem.tags = tags;
      }
    });
    await memoryCache.set('library-' + persistData.projectId, cachedData);
    ShowInformationPopup(
      localeI18ln.getTranslation('apiResponse.libTagsUpdate')
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

export async function updateCVEOverview(
  cves: string
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

  const response = await getCVEOverview(cves, params);
  if (response.code === 200) {
    const cachedData = await memoryCache.get(
      'library-' + persistData.projectId
    );
    const { cve, apps, servers, impactStats } =
      response.responseData as CVEOverviewResponse;
    cachedData.child?.forEach((childItem: LibraryNode) => {
      childItem.child?.forEach((nestedChild: CVENode) => {
        if (nestedChild?.label === cves) {
          nestedChild.overview.firstSeen =
            new Date(Number(cve.firstSeen)).toISOString().split('T')[0] ?? '';
          nestedChild.overview.nvdModified =
            new Date(Number(cve.nvdModified)).toISOString().split('T')[0] ?? '';
          nestedChild.overview.nvdPublished =
            new Date(Number(cve.nvdPublished)).toISOString().split('T')[0] ??
            '';
          nestedChild.overview.severityAndMetrics = [
            {
              name: 'CVSS v3.1',
              score: cve?.cvssv3?.baseScore ?? 0,
              severity: cve?.cvssv3?.severity ?? '',
            },
            {
              name: 'Impact Score',
              score: cve?.cvssv3?.impactSubscore ?? 0,
              severity: '',
            },
            {
              name: 'Exploitability Score',
              score: cve?.cvssv3?.exploitabilitySubscore ?? 0,
              severity: '',
            },
            {
              name: 'EPSS',
              score: cve.epssScore ?? 0,
              severity: '',
            },
          ];
          nestedChild.overview.vector = {
            label: cve?.cvssv3?.vector ?? '',
            vectors: [
              {
                label: 'Attack vector (AV)',
                value: cve?.cvssv3?.attackVector ?? '',
              },
              {
                label: 'Attack complexity (AC)',
                value: cve?.cvssv3?.attackComplexity ?? '',
              },
              {
                label: 'Privileges required (PR)',
                value: cve?.cvssv3?.privilegesRequired ?? '',
              },
              {
                label: 'User Interaction (UI)',
                value: cve?.cvssv3?.userInteraction ?? '',
              },
              {
                label: 'Scope (S)',
                value: cve?.cvssv3?.scope ?? '',
              },
              {
                label: 'Confidentiality (C)',
                value: cve?.cvssv3?.confidentialityImpact ?? '',
              },
              {
                label: 'Integrity (I)',
                value: cve?.cvssv3?.integrityImpact ?? '',
              },
              {
                label: 'Availability (A)',
                value: cve?.cvssv3?.availabilityImpact ?? '',
              },
            ],
          };
          nestedChild.overview.organizationalImpact = [
            {
              name: 'Applications',
              impactedAppCount: impactStats?.impactedAppCount ?? 0,
              totalAppCount: impactStats?.totalAppCount ?? 0,
              appPercentage: impactStats?.appPercentage ?? 0,
            },
            {
              name: 'Servers',
              impactedServerCount: impactStats?.impactedServerCount ?? 0,
              totalServerCount: impactStats?.totalServerCount ?? 0,
              serverPercentage: impactStats?.serverPercentage ?? 0,
            },
          ];
          nestedChild.overview.applications = apps?.map((val: any) => {
            return val.name;
          });
          nestedChild.overview.servers = servers?.map((val: any) => {
            return val.name;
          });
        }
      });
    });

    await memoryCache.set('library-' + persistData.projectId, cachedData);
    return cachedData;
  }
}
