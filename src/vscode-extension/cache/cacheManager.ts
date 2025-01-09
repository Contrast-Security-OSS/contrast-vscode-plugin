import { getScanResults } from '../api/services/apiService';
import { PersistenceInstance } from '../utils/persistanceState';
import { SETTING_KEYS, TOKEN } from '../utils/constants/commands';
import { resolveFailure } from '../utils/errorHandling';
import {
  ApiResponse,
  ConfiguredProject,
  PersistedDTO,
} from '../../common/types';
import {
  startBackgroundTimer,
  stopBackgroundTimer,
} from './backgroundRefreshTimer';
import { getOpenedFolderName } from '../utils/commonUtil';
import { localeI18ln } from '../../l10n';
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
  const projectName = getOpenedFolderName();
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];
  const project = persistedData?.find(
    (project: ConfiguredProject) => project.projectName === projectName
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

export async function getDataFromCache(): Promise<ApiResponse> {
  const projectName = getOpenedFolderName();
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[] | undefined;

  const project = persistedData?.find(
    (project: ConfiguredProject) => project.projectName === projectName
  ) as ConfiguredProject | undefined;

  if (project === undefined || project === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }
  const data = await memoryCache.get(project.projectId);

  if (data === null || data === undefined) {
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
