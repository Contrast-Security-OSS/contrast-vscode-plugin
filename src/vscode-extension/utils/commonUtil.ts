import * as vscode from 'vscode';
import { localeI18ln } from '../../l10n';
import {
  ArtifactLocation,
  Level0Entry,
  Level1Entry,
  ProjectSource,
  SourceJson,
  Vulnerability,
} from '../api/model/api.interface';
import { PersistenceInstance } from '../utils/persistanceState';
import { SETTING_KEYS, TOKEN } from './constants/commands';
import {
  ConfiguredProject,
  FilterSeverity,
  FilterStatus,
  FilterType,
  PersistedDTO,
} from '../../common/types';
import path from 'path';

export async function getVulnerabilitiesRefreshCycle(
  projectId: string
): Promise<number> {
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];

  const project = persistedData?.find(
    (project: ConfiguredProject) => project.projectId === projectId
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
          location.location?.physicalLocation?.artifactLocation?.uri.split(
            '\\'
          );
        const startIndex = pathParts.indexOf(getOpenedFolderName());
        if (startIndex > 0) {
          filePath = pathParts.slice(startIndex + 1).join(path.sep);
          // filePath = filePath.replace("WebGoat.NET", "WebGoat.NET.zip");
        }

        filePath = path.normalize(filePath);

        const persistedData = PersistenceInstance.getByKey(
          TOKEN.SETTING,
          SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
        ) as ConfiguredProject[];

        const project = persistedData?.find(
          (project: ConfiguredProject) =>
            project.projectId === sourceItem.projectId
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
        let filePath = item.filePath;
        const pathParts = item.filePath.split('/');
        const startIndex = pathParts.indexOf(getOpenedFolderName() as string);
        if (startIndex > 0) {
          filePath = pathParts.slice(startIndex + 1).join(path.sep);
        }
        filePath = path.normalize(filePath);
        filegroup = {
          level: 1,
          filePath: filePath,
          label: filePath,
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

export function getOpenedFolderName(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders && workspaceFolders.length > 0) {
    // Get the name of the first opened folder
    const folderUri = workspaceFolders[0].uri;
    const folderName = folderUri.path?.split('/').pop(); // Extract the folder name from the URI path
    return folderName;
  }

  return undefined;
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

export const DateTime = new Date().toISOString();
