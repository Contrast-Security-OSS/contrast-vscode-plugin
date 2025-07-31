import { commands, workspace } from 'vscode';
import { ApiResponse, CommandRequest } from '../../../common/types';
import { getCurrentFileVul } from '../../api/services/apiService';
import {
  clearCacheByProjectId,
  getDataFromCache,
  getDataOnlyFromCache,
  refreshCache,
} from '../../cache/cacheManager';
import {
  GetFilters,
  UpdateFilters,
} from '../../persistence/PersistenceConfigSetting';
import { getOpenedFolderName } from '../commonUtil';
import { CONSTRAST_SCAN, WEBVIEW_COMMANDS } from '../constants/commands';
import { resolveFailure } from '../errorHandling';
import {
  ActiveFileHightlighting,
  closeActiveFileHightlighting,
  currentWorkspaceProjectManager,
  featureController,
  getProjectIdByName,
  getValidConfiguredWorkspaceProjects,
  interlockModeSwitch,
  isNotNull,
  libraryPathNavigator,
  scanRetrieveBlocker,
  slotInstance,
  tabBlocker,
} from '../helper';
import { openVulFile } from '../vulnerabilityDecorator';
import { localeI18ln } from '../../../l10n';
import {
  ShowErrorPopup,
  ShowInformationPopup,
} from '../../commands/ui-commands/messageHandler';
import { scanRetrievelDetectorAcrossIds } from '../multiInstanceConfigSync';
import { toggleContrastPanel } from '../toggleContrastPanel';
import { ContrastPanelInstance } from '../../commands/ui-commands/webviewHandler';
import { closeStatusBarItem } from '../statusBarSeverity';
import { stopBackgroundTimer } from '../../cache/backgroundRefreshTimer';

workspace.onDidChangeWorkspaceFolders(async (e) => {
  if (e.removed.length > 0) {
    e.removed.filter(async (item) => {
      const activeProjectName = currentWorkspaceProjectManager.getSlot();
      if (activeProjectName !== 'none' && item.name === activeProjectName) {
        const projectName = getProjectIdByName(activeProjectName);
        await closeActiveFileHightlighting();
        const promisesList = [];
        promisesList.push(
          ContrastPanelInstance.clearPrimaryScanFilter(),
          ContrastPanelInstance.clearScanPersistance(),
          stopBackgroundTimer(),
          closeStatusBarItem()
        );

        if (
          projectName !== null &&
          projectName !== undefined &&
          'projectId' in projectName
        ) {
          promisesList.push(
            clearCacheByProjectId(projectName?.projectId as string)
          );
        }
        await Promise.all(promisesList);
      }
    });
  }
  ContrastPanelInstance.postMessage({
    command: WEBVIEW_COMMANDS.SCAN_VALID_CONFIGURED_PROJECTS,
    data: (await getValidConfiguredWorkspaceProjects()).validProjects,
  });
});

async function executeVulnerabilityScan() {
  const isModeSwitched = await interlockModeSwitch('scan');
  const scanRetrieveBlockerDetect = scanRetrieveBlocker.getSlot();
  if (isModeSwitched && scanRetrieveBlockerDetect === false) {
    tabBlocker(false);
    featureController.setSlot('scan');
    ShowInformationPopup(
      localeI18ln.getTranslation('persistResponse.retrievingVulnerabilities')
    );
    let response: ApiResponse | null = null;
    await scanRetrievelDetectorAcrossIds.disable();
    const project = getProjectIdByName((await getOpenedFolderName()) as string);
    if (project) {
      await refreshCache(project?.projectId as string);
      response = await getDataFromCache(true);

      if (response !== undefined && response !== null) {
        if (response.code === 200) {
          ShowInformationPopup(response?.message);
        } else {
          ShowErrorPopup(response?.message);
        }
      }
    } else {
      ShowErrorPopup(
        localeI18ln.getTranslation('apiResponse.projectNotFound') as string
      );
    }
    await scanRetrievelDetectorAcrossIds.enable();
    await ActiveFileHightlighting('scan');
    commands.executeCommand(CONSTRAST_SCAN);
    toggleContrastPanel();
    tabBlocker(true);
    ContrastPanelInstance.activeRetrieveVulnerability();
    ContrastPanelInstance.postMessage({
      command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
      data: response,
    });
  }
  ContrastPanelInstance.postMessage({
    command: WEBVIEW_COMMANDS.SCAN_BACKGROUND_RUNNER,
    data: false,
  });
}

export const ScanCommandHandler = async (props: CommandRequest) => {
  const { command, payload } = props;
  switch (command) {
    case WEBVIEW_COMMANDS.SCAN_VALID_CONFIGURED_PROJECTS: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_VALID_CONFIGURED_PROJECTS,
        data: (await getValidConfiguredWorkspaceProjects()).validProjects,
      };
    }

    case WEBVIEW_COMMANDS.SCAN_BACKGROUND_RUNNER: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_BACKGROUND_RUNNER,
        data: true,
      };
    }

    case WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH_BACKGROUND_RUNNER: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH_BACKGROUND_RUNNER,
        data: true,
      };
    }

    case WEBVIEW_COMMANDS.SCAN_OPEN_VULNERABILITY_FILE: {
      slotInstance.setSlot(false);
      libraryPathNavigator.setSlot(false);
      const data = await openVulFile(payload, 'scan');
      slotInstance.setSlot(true);
      libraryPathNavigator.setSlot(true);
      return {
        command: WEBVIEW_COMMANDS.SCAN_OPEN_VULNERABILITY_FILE,
        data: data,
      };
    }

    case WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL,
        data: await getCurrentFileVul(),
      };
    }
    case WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
        data: await getDataOnlyFromCache(),
      };
    }

    case WEBVIEW_COMMANDS.SCAN_GET_FILTERS: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_GET_FILTERS,
        data: await GetFilters(),
      };
    }
    case WEBVIEW_COMMANDS.SCAN_ACTIVE_PROJECT_NAME: {
      const project = currentWorkspaceProjectManager.getSlot();
      return {
        command: WEBVIEW_COMMANDS.SCAN_ACTIVE_PROJECT_NAME,
        data: project !== 'none' ? project : null,
      };
    }
    case WEBVIEW_COMMANDS.SCAN_UPDATE_FILTERS: {
      const updateFilter = await UpdateFilters(payload);
      if (isNotNull(updateFilter) && updateFilter?.code === 200) {
        const projectName =
          (await getValidConfiguredWorkspaceProjects()).getProjectName(
            payload?.activeWorkspaceProjectName
          )?.name ?? 'none';

        await closeActiveFileHightlighting();
        await closeStatusBarItem();
        currentWorkspaceProjectManager.setSlot(projectName);
        // Clear the Redux store and remove highlighting

        // Notify the webview to clear existing data
        ContrastPanelInstance.postMessage({
          command: WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL,
          data: [],
        });

        ContrastPanelInstance.postMessage({
          command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
          data: [],
        });

        // Notify the active project name to the webview
        ContrastPanelInstance.postMessage({
          command: WEBVIEW_COMMANDS.SCAN_ACTIVE_PROJECT_NAME,
          data: payload?.activeWorkspaceProjectName,
        });

        // Get the project name and set it in the current workspace context

        await executeVulnerabilityScan();
      }

      return {
        command: WEBVIEW_COMMANDS.SCAN_UPDATE_FILTERS,
        data: updateFilter,
      };
    }

    case WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH: {
      let response: ApiResponse | undefined = undefined;
      const isModeSwitched = await interlockModeSwitch('scan');
      const project = getProjectIdByName(
        (await getOpenedFolderName()) as string
      );
      if (isModeSwitched) {
        featureController.setSlot('scan');
        if (project) {
          ShowInformationPopup(
            localeI18ln.getTranslation(
              'persistResponse.retrievingVulnerabilities'
            )
          );
          await scanRetrievelDetectorAcrossIds.disable();
          await refreshCache(project.projectId as string);
          response = await getDataFromCache(true);
          await scanRetrievelDetectorAcrossIds.enable();
          await ActiveFileHightlighting('scan');
        } else {
          response = await Promise.resolve(
            resolveFailure(
              localeI18ln.getTranslation(
                'persistResponse.projectNotConfigured'
              ),
              400
            )
          );
        }
      }
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH_BACKGROUND_RUNNER,
        data: false,
      });
      return {
        command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
        data: response,
      };
    }
    default:
      break;
  }
};
