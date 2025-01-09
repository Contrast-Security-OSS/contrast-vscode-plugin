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
} from './utils/redux/slices/projectsSlice';
import {
  getAllFilesVulnerability,
  getCurrentFileVulnerability,
} from './utils/redux/slices/vulReport';
import {
  getFilters,
  setActiveCurrentFile,
  setVulnerabilityReport,
} from './utils/redux/slices/ScanFilter';
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
    case WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT:
      {
        ContrastStore.dispatch(updateConfiguredProjectDelete(data));
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
    default:
  }
};

// Add the event listener for messages
window.addEventListener('message', handleMessage);
