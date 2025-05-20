import { ConfigurationTarget, workspace } from 'vscode';
import {
  CONTRAST_SECURITY,
  CONTRAST_SECURITY_GLOBAL_SHARING,
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from './constants/commands';
import {
  broadcastProjectNameManager,
  closeActiveFileHightlighting,
  currentWorkspaceProjectManager,
  getProjectIdByName,
  getValidConfiguredWorkspaceProjects,
  isNotNull,
  scanRetrieveBlocker,
} from './helper';
import {
  GetAllConfiguredProjects,
  GetAssessFilter,
} from '../persistence/PersistenceConfigSetting';
import { ContrastPanelInstance } from '../commands/ui-commands/webviewHandler';
import { stopBackgroundTimerAssess } from '../cache/backgroundRefreshTimerAssess';
import { stopBackgroundTimer } from '../cache/backgroundRefreshTimer';
import { clearCacheByProjectId } from '../cache/cacheManager';
import { closeStatusBarItem } from './statusBarSeverity';
// import { PersistenceInstance } from './persistanceState';

// Start listening for config changes

const settingActionsBehaviour = {
  enable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.SETTING,
      WEBVIEW_COMMANDS.SETTING_ACTIONS,
      'false'
    ),

  disable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.SETTING,
      WEBVIEW_COMMANDS.SETTING_ACTIONS,
      'true'
    ),
};

const scanRetrievelDetectorAcrossIds = {
  enable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.SCAN,
      WEBVIEW_COMMANDS.SCAN_RETRIEVEL_DETECT_ACROSS_IDS,
      'false'
    ),

  disable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.SCAN,
      WEBVIEW_COMMANDS.SCAN_RETRIEVEL_DETECT_ACROSS_IDS,
      'true'
    ),
};

const scanRetrievelBlocker = {
  enable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.SCAN,
      'scanRetrievelBlocker',
      'false'
    ),

  disable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.SCAN,
      'scanRetrievelBlocker',
      'true'
    ),
};

const scanClearActions = () => {
  const promisesList = [];
  const currentSlot = currentWorkspaceProjectManager.getSlot();
  const broadcastSlot = broadcastProjectNameManager.getSlot();

  if (currentSlot !== 'none' && currentSlot === broadcastSlot) {
    promisesList.push(
      closeActiveFileHightlighting(),
      ContrastPanelInstance.clearPrimaryScanFilter(),
      ContrastPanelInstance.clearScanPersistance(),
      stopBackgroundTimer(),
      closeStatusBarItem()
    );

    const projectName = getProjectIdByName(currentSlot);

    if (
      projectName !== null &&
      projectName !== undefined &&
      'projectId' in projectName
    ) {
      promisesList.push(
        clearCacheByProjectId(projectName?.projectId as string)
      );
    }
  }
  return promisesList;
};

const assessBackgroundVulBehaviour = {
  enable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.ASSESS,
      WEBVIEW_COMMANDS.ASSESS_REFRESH_BACKGROUND_RUNNER_ACROSS_IDS,
      'false'
    ),

  disable: async () =>
    updateGlobalWebviewConfig(
      WEBVIEW_SCREENS.ASSESS,
      WEBVIEW_COMMANDS.ASSESS_REFRESH_BACKGROUND_RUNNER_ACROSS_IDS,
      'true'
    ),
};

const reloadAssessApplications = async () => {
  ContrastPanelInstance.postMessage({
    command: WEBVIEW_COMMANDS.GET_CONFIGURED_APPLICATIONS,
    data: await GetAllConfiguredProjects(),
  });
};

const reloadScanProjects = async () => {
  ContrastPanelInstance.postMessage({
    command: WEBVIEW_COMMANDS.SCAN_VALID_CONFIGURED_PROJECTS,
    data: (await getValidConfiguredWorkspaceProjects()).validProjects,
  });
};

// Handler function
const handleSettingCommand = async (
  scanMethod: string,
  receiveData: string
) => {
  switch (scanMethod) {
    case WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE:
      await reloadScanProjects();
      await reloadAssessApplications();
      break;

    case WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT: {
      const projects = await GetAllConfiguredProjects();
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
        data: projects,
      });
      break;
    }

    case WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT:
      try {
        if (receiveData === 'assess') {
          await Promise.all([
            ContrastPanelInstance.clearAssessPersistance(),
            ContrastPanelInstance.clearPrimaryAssessFilter(),
            ContrastPanelInstance.resetAssessVulnerabilityRecords(),
            await stopBackgroundTimerAssess(),
          ]);
        } else if (receiveData === 'assessApplicationReload') {
          await reloadAssessApplications();
        }
      } catch (error) {
        console.error('Error fetching active application:', error);
      }
      break;

    case WEBVIEW_COMMANDS.SETTING_ACTIONS:
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.SETTING_ACTIONS,
        data: receiveData === 'true',
      });
      break;

    case 'clearAssessThings':
      await Promise.all([
        closeActiveFileHightlighting(),
        closeStatusBarItem(),
        ContrastPanelInstance.resetAssessVulnerabilityRecords(),
        ContrastPanelInstance.clearPrimaryAssessFilter(),
        stopBackgroundTimerAssess(),
        ContrastPanelInstance.clearAssessPersistance(),
      ]);
      break;

    case 'reloadApplications':
      await reloadAssessApplications();
      break;

    default:
      console.warn(`Unknown scan method: ${scanMethod}`);
  }
};

const handleScanCommand = async (assessMethod: string, receiveData: string) => {
  switch (assessMethod) {
    case WEBVIEW_COMMANDS.SCAN_RETRIEVEL_DETECT_ACROSS_IDS:
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.SCAN_RETRIEVEL_DETECT_ACROSS_IDS,
        data: receiveData === 'true',
      });
      break;

    case 'scanRetrievelBlocker':
      scanRetrieveBlocker.setSlot(receiveData === 'true');
      break;

    case 'clearScanThings': {
      const promiseList = await scanClearActions();
      await Promise.all(promiseList);
    }

    case 'reloadProjects':
      await reloadScanProjects();
      break;

    case 'sharedProjectName':
      {
        broadcastProjectNameManager.setSlot(receiveData);
      }
      break;

    case 'deleteProject':
      {
        broadcastProjectNameManager.setSlot(receiveData);
        const promiseList = await scanClearActions();
        await Promise.all(promiseList);
      }
      break;
  }
};

const handleAssessCommand = async (
  assessMethod: string,
  receiveData: string
) => {
  switch (assessMethod) {
    case WEBVIEW_COMMANDS.ASSESS_REFRESH_BACKGROUND_RUNNER_ACROSS_IDS:
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.ASSESS_REFRESH_BACKGROUND_RUNNER_ACROSS_IDS,
        data: receiveData === 'true',
      });
      break;
    case 'loadAssessFilter':
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.ASSESS_GET_FILTERS,
        data: await GetAssessFilter(),
      });
      break;
  }
};

// Update global webview configuration
const updateGlobalWebviewConfig = async (
  screen: string,
  method: string,
  data?: string
) => {
  try {
    const timestamp = Date.now();
    const uniqueIdentifier = `${screen}:${method}:${timestamp}:${data}`;

    await workspace
      .getConfiguration(CONTRAST_SECURITY)
      .update(
        CONTRAST_SECURITY_GLOBAL_SHARING,
        uniqueIdentifier,
        ConfigurationTarget.Global
      );
    await new Promise((resolve) => setTimeout(resolve, 400));
  } catch (error) {
    console.error('Error updating global webview config:', error);
  }
};

// Watch for global config changes
const watchGlobalConfigChanges = () => {
  return workspace.onDidChangeConfiguration(async (event) => {
    if (
      event.affectsConfiguration(
        `${CONTRAST_SECURITY}.${CONTRAST_SECURITY_GLOBAL_SHARING}`
      )
    ) {
      try {
        const updatedValue = workspace
          .getConfiguration(CONTRAST_SECURITY)
          .get<string>(CONTRAST_SECURITY_GLOBAL_SHARING);

        if (updatedValue === undefined || !isNotNull(updatedValue)) {
          return;
        }

        const parsedValues = updatedValue.split(':');

        if (parsedValues.length >= 2) {
          const [screen, method, , data] = parsedValues;
          switch (screen) {
            case WEBVIEW_SCREENS.SETTING:
              await handleSettingCommand(method, data);
              break;
            case WEBVIEW_SCREENS.SCAN:
              await handleScanCommand(method, data);
              break;
            case WEBVIEW_SCREENS.ASSESS:
              await handleAssessCommand(method, data);
              break;
          }
        } else {
          console.warn('Invalid parsed values:', parsedValues);
        }
      } catch (error) {
        console.error('Error processing config change:', error);
      }
    }
  });
};

const globalConfigChangeListener = watchGlobalConfigChanges();

export {
  updateGlobalWebviewConfig,
  globalConfigChangeListener,
  handleSettingCommand,
  settingActionsBehaviour,
  assessBackgroundVulBehaviour,
  scanRetrievelDetectorAcrossIds,
  scanRetrievelBlocker,
};
