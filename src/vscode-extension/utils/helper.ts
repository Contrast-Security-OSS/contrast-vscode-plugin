import { commands, RelativePattern, Uri, window, workspace } from 'vscode';
import { getOpenedFolderName } from './commonUtil';
import {
  ASSESS_KEYS,
  SCAN_KEYS,
  SETTING_KEYS,
  TAB_BLOCKER,
  TOKEN,
  WEBVIEW_COMMANDS,
} from './constants/commands';
import { PersistenceInstance } from './persistanceState';
import {
  AssessFilter,
  ConfiguredProject,
  CustomFileVulnerability,
  PersistedDTO,
  ScaFiltersTypes,
  ValidProjectType,
} from '../../common/types';
import path from 'path';
import { GetAssessFilter } from '../persistence/PersistenceConfigSetting';
import { decoratorAction, openVulFile } from './vulnerabilityDecorator';
import { disposeCache } from '../cache/cacheManager';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';
import { stopBackgroundTimer } from '../cache/backgroundRefreshTimer';
import { FilterData } from '../../webview/utils/constant';
import { stopBackgroundTimerAssess } from '../cache/backgroundRefreshTimerAssess';
import { localeI18ln } from '../../l10n';
import {
  getAssessVulnerabilitybyFile,
  getVulnerabilitybyFile,
} from '../api/services/apiService';
import { LocaleMemoryCacheInstance } from './localeMemoryCache';

interface FinalFilter {
  servers?: number | string;
  appVersionTags?: string;
  severities?: string;
  status?: string;
  startDate?: number;
  endDate?: number;
  agentSessionId?: string;
  metadataFilters?: string;
  activeSessionMetadata?: string;
  applicationTags?: string | string[];
  environments?: string | string[];
}

function createSlots(): {
  getSlot: () => boolean;
  setSlot: (slot: boolean) => void;
} {
  let slot: boolean = true;

  return {
    getSlot: () => slot,
    setSlot: (newSlot) => {
      slot = newSlot;
    },
  };
}

function createAlphaSlots(): {
  getSlot: () => string;
  setSlot: (slot: string) => void;
  default: string;
} {
  let slot: string = 'none';

  return {
    getSlot: () => slot,
    setSlot: (newSlot) => {
      slot = newSlot;
    },
    default: 'none',
  };
}

const slotInstance = createSlots();
const aboutSlotInstance = createSlots();
const loopBreaker = createSlots();
const scanRetrieveBlocker = createSlots();
scanRetrieveBlocker.setSlot(false);
const featureController = createAlphaSlots();
const currentWorkspaceProjectManager = createAlphaSlots();
const broadcastProjectNameManager = createAlphaSlots();
const broadcastApplicationNameManager = createAlphaSlots();
const libraryPathNavigator = createSlots();

async function getFilePathuri(fileName: string) {
  const pathParts = fileName.split(path.sep);
  const startIndex = pathParts.indexOf((await getOpenedFolderName()) as string);
  if (startIndex >= 0) {
    fileName = pathParts.slice(startIndex + 1).join(path.sep);
    return fileName;
  }
  return undefined;
}

const getProjectIdByName = (
  projectName: string,
  source: 'scan' | 'assess' = 'scan'
) => {
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];

  const project = persistedData.find(
    (project: ConfiguredProject) =>
      project.projectName === projectName && project.source === source
  );

  return project;
};

const tabBlocker = (enable: boolean = true) => {
  commands.executeCommand('setContext', TAB_BLOCKER, enable);
};

const getAllAssessFilters = async (): Promise<FinalFilter | undefined> => {
  const payload: FinalFilter = {
    severities: 'CRITICAL,HIGH,MEDIUM',
    status: 'REPORTED,CONFIRMED,SUSPICIOUS',
  };

  const alterStatus = (status: string) => {
    let str = status;
    if (str.includes('NOT_A_PROBLEM')) {
      str = str.replace('NOT_A_PROBLEM', 'NotAProblem');
    }
    return str;
  };

  const getWorkspaceFilter = await GetAssessFilter();
  if (
    getWorkspaceFilter !== null &&
    getWorkspaceFilter !== undefined &&
    getWorkspaceFilter.responseData !== null &&
    getWorkspaceFilter.responseData !== undefined
  ) {
    const isIn = (item: keyof AssessFilter) =>
      item in (getWorkspaceFilter.responseData as AssessFilter);

    const isNotNull = (item: unknown) => item !== null && item !== undefined;
    const {
      servers,
      appVersionTags,
      severities,
      status,
      startDate,
      endDate,
      agentSessionId,
      metadataFilters,
    } = getWorkspaceFilter.responseData as AssessFilter;

    if (isIn('servers') && isNotNull(servers)) {
      const server = (servers as Array<string>)[0];
      payload.servers = +server;
    }
    if (isIn('appVersionTags') && isNotNull(appVersionTags)) {
      const appVersionTag = (appVersionTags as Array<string>)[0];
      payload.appVersionTags = appVersionTag;
    }
    if (isIn('severities') && isNotNull(severities) && severities.length > 0) {
      payload.severities = severities;
    } else {
      delete payload['severities'];
    }

    if (isIn('status') && isNotNull(status) && status.length > 0) {
      payload.status = alterStatus(status);
    } else {
      delete payload['status'];
    }

    if (isIn('startDate') && isNotNull(startDate?.timeStamp)) {
      payload.startDate = startDate.timeStamp;
    }

    if (isIn('endDate') && isNotNull(endDate?.timeStamp)) {
      payload.endDate = endDate.timeStamp;
    }

    if (isIn('agentSessionId') && isNotNull(agentSessionId)) {
      payload.agentSessionId = agentSessionId;
    }

    if (isIn('metadataFilters') && isNotNull(metadataFilters)) {
      payload.metadataFilters = JSON.stringify(metadataFilters);
    }

    return payload;
  }
};

const isNotNull = (e: unknown): boolean => e !== undefined && e !== null;

async function clearHighlightedActiveFile(type: 'scan' | 'assess') {
  const activeTextEditor = window.activeTextEditor;
  if (activeTextEditor !== null && activeTextEditor !== undefined) {
    const filePath = await getFilePathuri(activeTextEditor.document.fileName);
    if (filePath !== null) {
      await openVulFile({ level: 1, child: [], filePath }, type);
    }
  }
}

async function interlockModeSwitch(type: 'assess' | 'scan') {
  const activeFeature = featureController.getSlot();
  switch (type) {
    case 'scan': {
      if (activeFeature === 'assess') {
        const confirm = await window.showWarningMessage(
          localeI18ln.getTranslation(
            'persistResponse.scanInterlockWarning'
          ) as string,
          'Yes',
          'No'
        );
        if (confirm === 'Yes') {
          await Promise.all([
            LocaleMemoryCacheInstance.clearStore(TOKEN.ASSESS),
            clearHighlightedActiveFile('assess'),
            stopBackgroundTimerAssess(),
            disposeCache(),
            ContrastPanelInstance.clearAssessPersistance(),
            ContrastPanelInstance.clearPrimaryAssessFilter(),
            ContrastPanelInstance.resetAssessVulnerabilityRecords(),
            ContrastPanelInstance.clearPrimaryScaFilter(),
          ]);
        }
        return confirm === 'Yes';
      }
      return true;
    }
    case 'assess': {
      if (activeFeature === 'scan') {
        const confirm = await window.showWarningMessage(
          localeI18ln.getTranslation(
            'persistResponse.assessInterlockWarning'
          ) as string,
          'Yes',
          'No'
        );
        if (confirm === 'Yes') {
          await Promise.all([
            clearHighlightedActiveFile('scan'),
            stopBackgroundTimer(),
            disposeCache(),
            LocaleMemoryCacheInstance.setItem(
              TOKEN.SCAN,
              SCAN_KEYS.FILTERS as keyof PersistedDTO,
              FilterData
            ),
          ]);
          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.ASSESS_GET_FILTERS,
            data: FilterData,
          });
          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL,
            data: null,
          });
          ContrastPanelInstance.postMessage({
            command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
            data: null,
          });
        }
        return confirm === 'Yes';
      }
      return true;
    }
  }
}

async function ActiveFileHightlighting(source: 'assess' | 'scan' = 'assess') {
  const activeTextEditor = window.activeTextEditor;
  if (activeTextEditor) {
    const filePath = await getFilePathuri(activeTextEditor.document.fileName);
    if (isNotNull(filePath)) {
      if (source === 'assess') {
        const substring = filePath?.substring(filePath.lastIndexOf('/') + 1);
        const fileVulnerability = await getAssessVulnerabilitybyFile(substring);
        if (
          isNotNull(fileVulnerability) &&
          isNotNull(fileVulnerability?.responseData) &&
          fileVulnerability.code === 200
        ) {
          await openVulFile(
            fileVulnerability.responseData as CustomFileVulnerability,
            'assess'
          );
        } else {
          await openVulFile({ level: 1, child: [], filePath }, 'assess');
        }
      }
      if (source === 'scan') {
        const fileVulnerability = await getVulnerabilitybyFile(filePath);
        if (fileVulnerability.code === 200) {
          await openVulFile(
            fileVulnerability.responseData as CustomFileVulnerability,
            'scan'
          );
        } else {
          await openVulFile({ level: 1, child: [], filePath }, 'scan');
        }
      }
    }
  }
}

async function closeActiveFileHightlighting() {
  const activeTextEditor = window.activeTextEditor;
  if (activeTextEditor) {
    await decoratorAction(
      Uri.file(activeTextEditor.document.fileName),
      [],
      false
    );
  }
}

async function isScanSourceConfiguredProject(
  projectName: string
): Promise<boolean> {
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[] | undefined;

  if (persistedData === undefined || persistedData === null) {
    return false;
  }

  return persistedData.some(
    (item) => item.projectName === projectName && item.source === 'scan'
  );
}

async function getValidConfiguredWorkspaceProjects(): Promise<{
  validProjects: ValidProjectType[];
  getProjectName: (e: string) => ValidProjectType | undefined;
}> {
  const folders = workspace?.workspaceFolders;
  const validProjects: ValidProjectType[] = [];

  if (folders && folders.length > 0) {
    for (const folder of folders) {
      if (await isScanSourceConfiguredProject(folder.name)) {
        validProjects.push({
          id: folder.name,
          name: folder.name,
        });
      }
    }
  }

  return {
    validProjects: validProjects,
    getProjectName: (id: string) => {
      return validProjects.find((item) => item.id === id);
    },
  };
}

const findFolderInWorkspace = (project: string) => {
  return workspace.workspaceFolders?.find((folder) => folder.name === project);
};

const getHighlightPath = async (
  filePath: string
): Promise<string | RelativePattern> => {
  const feature = featureController.getSlot();
  const project = currentWorkspaceProjectManager.getSlot();
  if (!feature || feature === 'none') {
    return '';
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

    const projectFolder = findFolderInWorkspace(projectName);

    if (!projectFolder) {
      return '';
    }
    return new RelativePattern(projectFolder.uri.fsPath, `**/${filePath}`);
    return `**/${filePath}`;
  }

  if (feature === 'scan') {
    if (!project || project === 'none') {
      return '';
    }

    const projectFolder = findFolderInWorkspace(project);

    if (!projectFolder) {
      return '';
    }

    return new RelativePattern(projectFolder.uri.fsPath, filePath);
  }

  return '';
};
const getScaFilterFromCache = async () =>
  (await LocaleMemoryCacheInstance.getItem(
    TOKEN.ASSESS,
    ASSESS_KEYS.SCA_FILTERS
  )) as ScaFiltersTypes;

export {
  slotInstance,
  getFilePathuri,
  getProjectIdByName,
  aboutSlotInstance,
  tabBlocker,
  loopBreaker,
  getAllAssessFilters,
  isNotNull,
  featureController,
  interlockModeSwitch,
  ActiveFileHightlighting,
  scanRetrieveBlocker,
  closeActiveFileHightlighting,
  currentWorkspaceProjectManager,
  broadcastProjectNameManager,
  broadcastApplicationNameManager,
  isScanSourceConfiguredProject,
  getValidConfiguredWorkspaceProjects,
  getHighlightPath,
  getScaFilterFromCache,
  findFolderInWorkspace,
  libraryPathNavigator,
};
