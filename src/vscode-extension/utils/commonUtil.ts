/* eslint-disable @typescript-eslint/no-explicit-any */
import { localeI18ln } from '../../l10n';
import {
  ArtifactLocation,
  Level0Entry,
  Level0Vulnerability,
  Level1Entry,
  Level1Vulnerability,
  LibParsedVulnerability,
  LibraryNode,
  LibraryVulnerability,
  ProjectSource,
  SourceJson,
  Vulnerability,
} from '../api/model/api.interface';
import { PersistenceInstance } from '../utils/persistanceState';
import { SETTING_KEYS, TOKEN } from './constants/commands';
import {
  ApiResponse,
  AssessFilter,
  ConfiguredProject,
  FilterSeverity,
  FilterStatus,
  FilterType,
  LogLevel,
  PersistedDTO,
  PrimaryConfig,
} from '../../common/types';
import path from 'path';
import { resolveFailure, resolveSuccess } from './errorHandling';
import { GetAssessFilter } from '../persistence/PersistenceConfigSetting';
import { currentWorkspaceProjectManager, featureController } from './helper';
import { loggerInstance } from '../logging/logger';

export async function getVulnerabilitiesRefreshCycle(
  projectId: string,
  isScan: boolean = true
): Promise<number> {
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];

  const scanType = isScan ? 'scan' : 'assess';

  const project = persistedData?.find(
    (project: ConfiguredProject) =>
      project.projectId === projectId && project.source === scanType
  );
  if (project === null || project === undefined) {
    throw new Error(localeI18ln.getTranslation('apiResponse.projectNotFound'));
  }

  return Number(project?.minute);
}
export function constructFilters(data: FilterType): Record<string, string> {
  const status = getKeyByValue(data.status, true)?.join(',');
  const severity = getKeyByValue(data.severity, true)?.join(',');

  return {
    status,
    severity,
  };
}

export function formatString(
  template: string,
  ...args: (string | number)[]
): string {
  return template.replace(/{(\d+)}/g, (match, index: number) => {
    return typeof args[index] !== 'undefined' ? String(args[index]) : match;
  });
}

export function setDateAndTime(
  dateStr: string,
  timeStr: string,
  date: Date
): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  date.setFullYear(year, month - 1, day); // Month is zero-based, so subtract 1
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds);
  return date;
}
export function getKeyByValue(
  obj: FilterStatus | FilterSeverity,
  value: boolean
) {
  return Object.entries(obj).reduce((acc: string[], [key, val]) => {
    if (val === value) {
      acc.push(key);
    }
    return acc;
  }, []);
}

type PropertyMapping = { [key: string]: string };
const propertyMapping: PropertyMapping = {
  name: 'vulnerabilityName',
  id: 'vulnerabilityId',
  severity: 'vulnerabilitySeverity',
  'message.text': 'detailedMessage',
};

export function getNestedValue(data: SourceJson, path: string): SourceJson {
  const keys = path.split('.');
  for (const key of keys) {
    if (key.length > 1000) {
      throw new Error('Input key too long');
    }
    // Match the pattern with a safer regex (non-capturing groups and stricter validation)
    const match = key.match(/^\w+\[\d+\]$/);
    if (match) {
      // Split the string manually to extract key and index
      const [arrayKey, index] = key.split(/[\[\]]/);
      data = data?.[arrayKey]?.[parseInt(index, 10) as number];
    } else {
      data = data?.[key];
    }
  }
  return data;
}

export function getAllArtifactUris(sourceItem: SourceJson): Level0Entry[] {
  const uris: Level0Entry[] = [];
  const codeFlows = sourceItem.codeFlows;
  for (const codeFlow of codeFlows) {
    for (const threadFlow of codeFlow.threadFlows) {
      for (const location of threadFlow.locations) {
        let filePath =
          location.location?.physicalLocation?.artifactLocation?.uri;
        const pathParts =
          location.location?.physicalLocation?.artifactLocation?.uri.split('/');
        const startIndex = pathParts.indexOf(onlyGetOpenedFolderName());
        if (startIndex >= 0) {
          filePath = pathParts.slice(startIndex + 1).join(path.sep);
        }

        filePath = path.normalize(filePath);

        const persistedData = PersistenceInstance.getByKey(
          TOKEN.SETTING,
          SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
        ) as ConfiguredProject[];

        const project = persistedData?.find(
          (project: ConfiguredProject) =>
            project.projectId === sourceItem.projectId &&
            project.source === 'scan'
        );

        const item: Level0Entry = {
          level: 0,
          label: location.message?.text,
          popupMessage: {
            message: codeFlow.message?.text,
            advise: location.importance,
            lastDetected_date: sourceItem.lastSeenTime,
            status: sourceItem.status,
            link: `${project?.contrastURL}/Contrast/static/ng/index.html#/${sourceItem.organizationId}/scans/${sourceItem.projectId}/vulnerabilities/${sourceItem.id}`,
          },
          severity: sourceItem.severity,
          language: sourceItem.language,
          scanId: sourceItem.scanId,
          name: sourceItem.name,
          id: sourceItem.id,
          organizationId: sourceItem.organizationId,
          projectId: sourceItem.projectId,
          ruleId: sourceItem.ruleId,
          lineNumber: location.location?.physicalLocation?.region?.startLine,
          filePath: filePath,
          labelFilePath:
            location.location?.physicalLocation?.artifactLocation?.uri,
        };
        uris.push(item);
      }
    }
  }
  return uris;
}

export function mapSourceToDestination(
  sourceArray: SourceJson[],
  mapping: PropertyMapping
): SourceJson[] {
  return sourceArray.map((sourceItem) => {
    const destinationItem: ArtifactLocation = {} as ArtifactLocation;
    for (const [srcPath, destKey] of Object.entries(mapping)) {
      const value = getNestedValue(sourceItem, srcPath);
      if (value !== undefined) {
        destinationItem[destKey] = value;
      }
    }
    const artifacts = getAllArtifactUris(sourceItem);
    destinationItem['artifactLocations'] =
      artifacts.length > 0 ? [{ ...artifacts[0] }] : [];
    return destinationItem;
  });
}

export function processJsonData(data: Vulnerability[]): SourceJson[] {
  const vulnerabilities = data;
  return mapSourceToDestination(vulnerabilities, propertyMapping);
}

export function parseSourceJson(data: Vulnerability[]) {
  const destinationJson = processJsonData(data);
  return getScanedResultFinalJson(destinationJson);
}

export function getScanedResultFinalJson(data: SourceJson[]): ProjectSource {
  let finalJson: ProjectSource = {
    level: 0,
    label: '',
    issuesCount: 0,
    filesCount: 0,
    child: [],
  };
  const children: Level1Entry[] = [];
  let totalCount = 0;
  data.forEach((artifacts) => {
    artifacts.artifactLocations.forEach((item: Level0Entry) => {
      let filegroup = children?.find(
        (group) => group.filePath === item.filePath
      );
      if (!filegroup) {
        const filePath = item.filePath;

        filegroup = {
          level: 1,
          filePath: filePath,
          label: item.labelFilePath ?? '',
          issuesCount: 0,
          fileType: item.language,
          child: [],
        };
        children.push(filegroup);
      }
      filegroup.issuesCount += 1;
      totalCount += 1;
      item.label = artifacts.detailedMessage;
      filegroup.child.push(item);
    });
  });
  finalJson = {
    level: 2,
    label: formatString(
      localeI18ln.getTranslation('apiResponse.foundIssues') as string,
      totalCount,
      children.length
    ),
    issuesCount: totalCount,
    filesCount: children.length,
    child: children,
  };

  return finalJson;
}

export function filterCriticalVulnerabilities(
  data: ProjectSource,
  severity: string
): ProjectSource {
  return {
    ...data,
    child: data.child
      .map((fileEntry) => ({
        ...fileEntry,
        child: fileEntry.child.filter(
          (vulnerability) => vulnerability.severity === severity
        ),
      }))
      .filter((fileEntry) => fileEntry.child.length > 0),
  };
}

export function filterCriticalVulnerabilitiesLineNumber(
  data: ProjectSource,
  severity: string,
  fileName: string,
  lineNumber: number
): ProjectSource {
  return {
    ...data,
    child: data.child
      .map((fileEntry) => ({
        ...fileEntry,
        child: fileEntry.child.filter(
          (vulnerability) =>
            vulnerability.severity === severity &&
            vulnerability.lineNumber === lineNumber &&
            vulnerability.filePath === fileName
        ),
      }))
      .filter((fileEntry) => fileEntry.child.length > 0),
  };
}

export function onlyGetOpenedFolderName() {
  const projectName = currentWorkspaceProjectManager.getSlot();
  return projectName && projectName !== 'none' ? projectName : undefined;
}

export async function getOpenedFolderName(): Promise<string | undefined> {
  const feature = featureController.getSlot();
  const projectName = currentWorkspaceProjectManager.getSlot();

  if (feature === 'none') {
    return undefined;
  }
  if (feature === 'scan') {
    return projectName && projectName !== 'none' ? projectName : undefined;
  }
  if (feature === 'assess') {
    const assessFilter = await GetAssessFilter();
    if (
      assessFilter === null ||
      assessFilter === undefined ||
      assessFilter.responseData === null ||
      assessFilter.status === 'failure'
    ) {
      return '';
    }
    const { projectName } = assessFilter.responseData as AssessFilter;

    return projectName && projectName !== 'none' ? projectName : undefined;
  }
}

export function extractLastNumber(str: string): number {
  // Ensure the input isn't too long to mitigate risks of DoS
  if (str.length > 9999) {
    throw new Error('Input too long');
  }
  // Match the last digits in a non-capturing manner
  const match = str.match(/\d{1,9999}$/);

  return match ? parseInt(match[0], 10) : 0;
}

export const DateTime = (): string => new Date().toISOString();

export function groupByFileName(
  vulnerabilities: Level0Vulnerability[]
): Record<string, Level0Vulnerability[]> {
  return vulnerabilities.reduce(
    (acc, item) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!acc[item.labelForMapping]) {
        acc[item.labelForMapping] = [];
      }
      acc[item.labelForMapping].push(item);
      return acc;
    },
    {} as Record<string, Level0Vulnerability[]>
  );
}

export function validateParams(
  params: PrimaryConfig
): { validParams: PrimaryConfig } | ApiResponse {
  const { apiKey, contrastURL, userName, serviceKey, organizationId, source } =
    params;

  if (
    !apiKey ||
    !contrastURL ||
    !userName ||
    !serviceKey ||
    !organizationId ||
    !source
  ) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.missingOneOrMoreError'),
      400
    );
  }

  return {
    validParams: {
      apiKey,
      contrastURL,
      userName,
      serviceKey,
      organizationId,
      source,
    },
  };
}

export const handleErrorResponse = (message: string, status: number) => {
  return resolveFailure(localeI18ln.getTranslation(message), status);
};

export function moveUnmappedVulnerabilities(
  level1Vulnerabilities: Level1Vulnerability[],
  word: string
) {
  level1Vulnerabilities.map((item: Level1Vulnerability, index) => {
    if (item.label.toLowerCase() === word.toLowerCase()) {
      level1Vulnerabilities.splice(index, 1);
      level1Vulnerabilities.push(item);
    }
  });
  return level1Vulnerabilities;
}

export async function getCacheFilterData(): Promise<ApiResponse> {
  const persist = await GetAssessFilter();

  if (
    persist === undefined ||
    persist === null ||
    persist.responseData === null ||
    persist.responseData === undefined
  ) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  return resolveSuccess('success', 200, persist.responseData);
}

export function getParseLibVulData(
  data: LibraryVulnerability[],
  configParams: ConfiguredProject,
  appId: string
) {
  const startTime: string = DateTime();
  const childNodeVulnerabilities: LibraryNode[] = [];
  const noVulnChildren: LibraryNode[] = [];

  data.forEach((item) => {
    const hasVulns = item.vulns.length > 0;
    const parentMatch: string = `${item.file_name}:${item.hash}`;

    if (hasVulns) {
      const node: LibraryNode = {
        level: 1,
        isUnmapped: false,
        parentMatch: parentMatch,
        label: item.file_name,
        cveCount: item.vulns.length,
        restrictedLicenses: item.licenseViolation,
        restrictedLibraries: item.restricted,
        outdatedLibrary: true,
        overview: {
          file_name: item.file_name,
          version: item.version,
          release_date:
            item.release_date &&
            new Date(Number(item.release_date)).toISOString().split('T')[0],
          hash: item.hash,
          licenses: item.licenses,
          grade: item.grade,
          score: item.score,
          total_vulnerabilities: item.vulns.length,
          policy_violations: item.loc,
          apps_using: item.apps.length,
          classes_used: usageCounts(appId, item.library_class_usage_counts),
          class_count: item.class_count,
          app_language: item.app_language,
        },
        howToFix: {
          minUpgrade: {
            ...item?.remediationGuidance?.minUpgrade,
            releaseDate:
              item?.remediationGuidance?.minUpgrade?.releaseDate &&
              new Date(
                Number(item?.remediationGuidance?.minUpgrade?.releaseDate)
              )
                .toISOString()
                .split('T')[0],
          },
          maxUpgrade: {
            ...item.remediationGuidance?.maxUpgrade,
            releaseDate:
              item?.remediationGuidance?.maxUpgrade?.releaseDate &&
              new Date(Number(item.remediationGuidance.maxUpgrade.releaseDate))
                .toISOString()
                .split('T')[0],
          },
        },
        usage: {
          total: 0,
          classes_used: usageCounts(appId, item.library_class_usage_counts),
          class_count: item.class_count,
          observations: [],
        },
        path: [],
        tags: item.tags,
        redirectionUrl: libRedirectUrl(configParams, appId),
        child: item.vulns.map((val) => ({
          level: 0,
          label: val.name,
          parentMatch: parentMatch,
          overview: {
            severity: val.cvss_3_severity_code,
            firstSeen: '',
            nvdPublished: '',
            nvdModified: '',
            cveRecordLink: `https://www.cve.org/CVERecord?id=${val.name}`,
            nvdRecordLink: `https://nvd.nist.gov/vuln/detail/${val.name}`,
            severityAndMetrics: [],
            vector: {
              label: '',
              vectors: [],
            },
            cisa: val.cisa,
            epss_percentile: val.epss_percentile,
            epss_score: val.epss_score,
            cvss_3_severity_value: val.cvss_3_severity_value,
            description: val.description,
          },
          redirectionUrl: libRedirectUrl(configParams, appId),
        })),
      };

      childNodeVulnerabilities.push(node);
    } else {
      const childNode: LibraryNode = {
        level: 1,
        isUnmapped: true,
        label: item.file_name,
        parentMatch: parentMatch,
        overview: {
          file_name: item.file_name,
          version: item.version,
          release_date:
            item.release_date &&
            new Date(Number(item.release_date)).toISOString().split('T')[0],
          hash: item.hash,
          licenses: item.licenses,
          grade: item.grade,
          score: item.score,
          total_vulnerabilities: 0,
          policy_violations: item.loc,
          apps_using: item.apps.length,
          classes_used: usageCounts(appId, item.library_class_usage_counts),
          class_count: item.class_count,
          app_language: item.app_language,
        },
        restrictedLicenses: item.licenseViolation,
        restrictedLibraries: item.restricted,
        outdatedLibrary: true,
        usage: {
          total: 0,
          classes_used: usageCounts(appId, item.library_class_usage_counts),
          class_count: item.class_count,
          observations: [],
        },
        tags: item.tags,
        redirectionUrl: libRedirectUrl(configParams, appId),
        child: [],
        path: [],
        cveCount: 0,
        howToFix: {
          minUpgrade: {
            ...item?.remediationGuidance?.minUpgrade,
            releaseDate:
              item?.remediationGuidance?.minUpgrade?.releaseDate &&
              new Date(
                Number(item?.remediationGuidance?.minUpgrade?.releaseDate)
              )
                .toISOString()
                .split('T')[0],
          },
          maxUpgrade: {
            ...item.remediationGuidance?.maxUpgrade,
            releaseDate:
              item?.remediationGuidance?.maxUpgrade?.releaseDate &&
              new Date(Number(item.remediationGuidance.maxUpgrade.releaseDate))
                .toISOString()
                .split('T')[0],
          },
        },
      };

      noVulnChildren.push(childNode);
    }
  });

  // If there are any items without vulns, push the special "unmapped" node
  if (noVulnChildren.length > 0) {
    childNodeVulnerabilities.push({
      level: 1,
      label: "Unmapped CVE's",
      count: noVulnChildren.length,
      child: noVulnChildren,
      isRootUnmapped: true,
    } as any);
  }

  const totalCveCount = data.reduce((sum, item) => sum + item.vulns.length, 0);

  const libraryCount = childNodeVulnerabilities.length + noVulnChildren.length;

  const libraryVulnerability: LibParsedVulnerability = {
    level: 2,
    label: `Found ${totalCveCount} CVE's from ${noVulnChildren.length > 0 ? libraryCount - 1 : libraryCount} libraries`,
    cveCount: totalCveCount,
    libraryCount: libraryCount,
    child: childNodeVulnerabilities,
  };
  const logData = `Start Time: ${startTime} | End Time: ${DateTime()} | Message: ${libraryVulnerability.label} \n`;
  void loggerInstance?.logMessage(LogLevel.INFO, logData);
  return libraryVulnerability;
}

export function libRedirectUrl(
  configParams: ConfiguredProject,
  appId: string
): string {
  return `${configParams.contrastURL}/Contrast/static/ng/index.html#/${configParams.organizationId}/applications/${appId}/libs`;
}

function usageCounts(appId: string, libraryUsage: any[]) {
  const usageId = libraryUsage.find((val: any) => {
    if (val.appId === appId) {
      return val.usageCount;
    }
  });
  return usageId !== undefined ? usageId.usageCount : 0;
}
