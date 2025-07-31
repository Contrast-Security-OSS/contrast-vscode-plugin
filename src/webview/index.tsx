import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../styles/style.scss';
import ContrastStore from './utils/redux/store';
import { setLocale } from './utils/redux/slices/localeSlice';
import { Provider } from 'react-redux';
import { setScreen } from './utils/redux/slices/screenSlice';
import {
  CONTRAST_THEME,
  EXTENTION_COMMANDS,
  WEBVIEW_COMMANDS,
} from '../vscode-extension/utils/constants/commands';
import {
  addConfigureProject,
  getAllConfiguredProjects,
  getAllProjectList,
  updateConfiguredProjectDelete,
  updateConfigureProject,
  getAllApplicationList,
  setCancelStateWhileDelete,
  setSettingActions,
} from './utils/redux/slices/projectsSlice';
import {
  getAllFilesVulnerability,
  getCurrentFileVulnerability,
} from './utils/redux/slices/vulReport';
import {
  getFilters,
  setActiveCurrentFile,
  setActiveProjectName,
  setScanBackgroundRunner,
  setScanManualRefreshBackgroundRunner,
  setScanRetrievelDetectAcrossIds,
  setValidWorkspaceProjects,
  setVulnerabilityReport,
} from './utils/redux/slices/ScanFilter';
import {
  getBuildNumber,
  getCustomSessionMetaData,
  getMostRecentMetaData,
  getServerListbyOrgId,
  getConfiguredApplications,
  getAssessFilters,
  getAssessAllFilesVulnerability,
  setBackgroundRunner,
  setMarkAsOkBehaviour,
  getOrganizationTags,
  setTagsOkBehaviour,
  getAssessCurrentFileVulnerability,
  setManualRefreshBackgroundRunner,
  setAssessActiveCurrentFile,
  setRefreshBackgroundRunnerAcrossIds,
  getEnvironmentsList,
  getQuickViewList,
  getLibraryUsageList,
  getLibraryLicenceList,
  getScaFilters,
  getServersList,
  getTagList,
  getScaSeverities,
  getScaStaus,
  getAssessEnvironmentsList,
  getAssessTagsList,
  getScaAllFilesVulnerability,
  getScaOrganizationTags,
  setScaTagsOkBehaviour,
  getScaAutoRefresh,
} from './utils/redux/slices/assessFilter';
import { setContrastTheme } from './utils/redux/slices/contrastTheme';

const root: HTMLElement | null = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}
const DOM = createRoot(root);

DOM.render(
  <Provider store={ContrastStore}>
    <App />
  </Provider>
);

const handleMessage = (event: MessageEvent): void => {
  const { command, data } = event.data;
  switch (command) {
    case EXTENTION_COMMANDS.SETTING_SCREEN:
      {
        ContrastStore.dispatch(setScreen(EXTENTION_COMMANDS.SETTING_SCREEN));
      }
      break;
    case EXTENTION_COMMANDS.SCAN_SCREEN:
      {
        ContrastStore.dispatch(setScreen(EXTENTION_COMMANDS.SCAN_SCREEN));
      }
      break;
    case EXTENTION_COMMANDS.ASSESS_SCREEN:
      {
        ContrastStore.dispatch(setScreen(EXTENTION_COMMANDS.ASSESS_SCREEN));
      }
      break;
    case EXTENTION_COMMANDS.L10N:
      {
        ContrastStore.dispatch(setLocale(data));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS:
      {
        ContrastStore.dispatch(getAllConfiguredProjects(data));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS:
      {
        ContrastStore.dispatch(getAllProjectList(data));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_GET_ALL_APPLICATIONS: // New
      {
        ContrastStore.dispatch(getAllApplicationList(data));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT:
      {
        ContrastStore.dispatch(updateConfiguredProjectDelete(data));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_CANCEL_STATE_WHILE_DELETE:
      {
        ContrastStore.dispatch(setCancelStateWhileDelete(false));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_ACTIONS:
      {
        ContrastStore.dispatch(setSettingActions(data));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE:
      {
        ContrastStore.dispatch(addConfigureProject(data));
      }
      break;
    case WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT:
      {
        ContrastStore.dispatch(updateConfigureProject(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL:
      {
        ContrastStore.dispatch(getCurrentFileVulnerability(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY:
      {
        ContrastStore.dispatch(getAllFilesVulnerability(data));
      }
      break;

    // Scan
    case WEBVIEW_COMMANDS.SCAN_ACTIVE_PROJECT_NAME:
      {
        ContrastStore.dispatch(setActiveProjectName(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCAN_VALID_CONFIGURED_PROJECTS:
      {
        ContrastStore.dispatch(setValidWorkspaceProjects(data));
      }
      break;

    case WEBVIEW_COMMANDS.SCAN_BACKGROUND_RUNNER:
      {
        ContrastStore.dispatch(setScanBackgroundRunner(data));
      }
      break;

    case WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH_BACKGROUND_RUNNER:
      {
        ContrastStore.dispatch(setScanManualRefreshBackgroundRunner(data));
      }
      break;

    case WEBVIEW_COMMANDS.SCAN_UPDATE_FILTERS:
      {
        ContrastStore.dispatch(getFilters(data));
      }
      break;

    case WEBVIEW_COMMANDS.SCAN_GET_FILTERS:
      {
        ContrastStore.dispatch(getFilters(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH:
      {
        ContrastStore.dispatch(getAllFilesVulnerability(data));
      }
      break;
    case EXTENTION_COMMANDS.CURRENT_FILE:
      {
        ContrastStore.dispatch(setActiveCurrentFile(data));
      }
      break;
    case EXTENTION_COMMANDS.VULNERABILITY_REPORT:
      {
        ContrastStore.dispatch(setVulnerabilityReport(data));
      }
      break;
    case CONTRAST_THEME:
      {
        ContrastStore.dispatch(setContrastTheme(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCAN_RETRIEVEL_DETECT_ACROSS_IDS:
      {
        ContrastStore.dispatch(setScanRetrievelDetectAcrossIds(data));
      }
      break;

    // Assess
    case WEBVIEW_COMMANDS.GET_CONFIGURED_APPLICATIONS:
      {
        ContrastStore.dispatch(getConfiguredApplications(data));
      }
      break;
    case WEBVIEW_COMMANDS.GET_SERVER_LIST_BY_ORG_ID:
      {
        ContrastStore.dispatch(getServerListbyOrgId(data));
      }
      break;
    case WEBVIEW_COMMANDS.GET_BUILD_NUMBER:
      {
        ContrastStore.dispatch(getBuildNumber(data));
      }
      break;
    case WEBVIEW_COMMANDS.GET_ASSESS_ENVIRONMENTS:
      {
        ContrastStore.dispatch(getAssessEnvironmentsList(data));
      }
      break;
    case WEBVIEW_COMMANDS.GET_ASSESS_TAGS:
      {
        ContrastStore.dispatch(getAssessTagsList(data));
      }
      break;
    case WEBVIEW_COMMANDS.GET_CUSTOM_SESSION_METADATA:
      {
        ContrastStore.dispatch(getCustomSessionMetaData(data));
      }
      break;
    case WEBVIEW_COMMANDS.GET_MOST_RECENT_METADATA:
      {
        ContrastStore.dispatch(getMostRecentMetaData(data));
      }
      break;

    case WEBVIEW_COMMANDS.ASSESS_GET_FILTERS:
      {
        ContrastStore.dispatch(getAssessFilters(data));
      }
      break;

    case WEBVIEW_COMMANDS.ASSESS_UPDATE_FILTERS:
      {
        ContrastStore.dispatch(getAssessFilters(data));
      }
      break;
    case WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY:
      {
        ContrastStore.dispatch(getAssessAllFilesVulnerability(data));
      }
      break;
    case WEBVIEW_COMMANDS.ASSESS_GET_INITIAL_ALL_FILES_VULNERABILITY:
      {
        if (data !== null) {
          ContrastStore.dispatch(getAssessAllFilesVulnerability(data));
        }
      }
      break;
    case WEBVIEW_COMMANDS.ASSESS_BACKGROUND_RUNNER:
      {
        ContrastStore.dispatch(setBackgroundRunner(data));
      }
      break;

    case WEBVIEW_COMMANDS.ASSESS_UPDATE_VULNERABILITY: {
      if (data !== null) {
        ContrastStore.dispatch(getAssessAllFilesVulnerability(data));
      }
    }
    case WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH:
      {
        if (data !== null) {
          ContrastStore.dispatch(getAssessAllFilesVulnerability(data));
        }
      }
      break;
      break;
    case WEBVIEW_COMMANDS.ASSESS_ADD_MARK:
      {
        ContrastStore.dispatch(setMarkAsOkBehaviour(false));
        if (data !== null) {
          ContrastStore.dispatch(getAssessAllFilesVulnerability(data));
        }
      }
      break;
    case WEBVIEW_COMMANDS.ASSESS_ORG_TAGS:
      {
        ContrastStore.dispatch(getOrganizationTags(data));
      }
      break;
    case WEBVIEW_COMMANDS.ASSESS_TAG_OK_BEHAVIOUR:
      {
        ContrastStore.dispatch(setTagsOkBehaviour(false));
        if (data !== null) {
          ContrastStore.dispatch(getAssessAllFilesVulnerability(data));
        }
      }
      break;
    case WEBVIEW_COMMANDS.ASSESS_GET_CURRENTFILE_VUL:
      {
        ContrastStore.dispatch(getAssessCurrentFileVulnerability(data));
      }
      break;
    case WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH_BACKGROUND_RUNNER:
      {
        ContrastStore.dispatch(setManualRefreshBackgroundRunner(data));
      }
      break;
    case EXTENTION_COMMANDS.ASSESS_CURRENT_FILE:
      {
        ContrastStore.dispatch(setAssessActiveCurrentFile(data));
      }
      break;

    case WEBVIEW_COMMANDS.ASSESS_REFRESH_BACKGROUND_RUNNER_ACROSS_IDS:
      {
        ContrastStore.dispatch(setRefreshBackgroundRunnerAcrossIds(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_ENVIRONMENTS_LIST:
      {
        ContrastStore.dispatch(getEnvironmentsList(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_SERVERS_LIST:
      {
        ContrastStore.dispatch(getServersList(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_QUICKVIEW_LIST:
      {
        ContrastStore.dispatch(getQuickViewList(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_LIBRARY_USAGE_LIST:
      {
        ContrastStore.dispatch(getLibraryUsageList(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_LIBRARY_LICENSES_LIST:
      {
        ContrastStore.dispatch(getLibraryLicenceList(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_TAG_LIST:
      {
        ContrastStore.dispatch(getTagList(data));
      }
      break;

    case WEBVIEW_COMMANDS.SCA_GET_FILTERS:
      {
        ContrastStore.dispatch(getScaFilters(data));
      }
      break;

    case WEBVIEW_COMMANDS.SCA_SEVERITIES:
      {
        ContrastStore.dispatch(getScaSeverities(data));
      }
      break;

    case WEBVIEW_COMMANDS.SCA_STATUS:
      {
        ContrastStore.dispatch(getScaStaus(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_GET_ALL_FILES_VULNERABILITY:
      {
        ContrastStore.dispatch(getScaAllFilesVulnerability(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_UPDATE_VULNERABILITY_USAGE:
      {
        ContrastStore.dispatch(getScaAllFilesVulnerability(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_ORG_TAGS:
      {
        ContrastStore.dispatch(getScaOrganizationTags(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_TAG_OK_BEHAVIOUR:
      {
        ContrastStore.dispatch(setScaTagsOkBehaviour(false));
        if (data !== null) {
          ContrastStore.dispatch(getScaAllFilesVulnerability(data));
        }
      }
      break;
    case WEBVIEW_COMMANDS.SCA_UPDATE_CVE_OVERVIEW:
      {
        ContrastStore.dispatch(getScaOrganizationTags(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_UPDATE_CVE_PATH:
      {
        if (data !== null) {
          ContrastStore.dispatch(getScaAllFilesVulnerability(data));
        }
      }
      break;

    case WEBVIEW_COMMANDS.SCA_AUTO_REFRESH:
      {
        ContrastStore.dispatch(getScaAutoRefresh(data));
      }
      break;
    case WEBVIEW_COMMANDS.SCA_GET_INITIAL_ALL_FILES_VULNERABILITY:
      {
        if (data !== null) {
          ContrastStore.dispatch(getScaAllFilesVulnerability(data));
        }
      }
      break;
    default:
  }
};

// Add the event listener for messages
window.addEventListener('message', handleMessage);
