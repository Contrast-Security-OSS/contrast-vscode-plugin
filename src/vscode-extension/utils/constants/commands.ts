export const CONSTRAST_SETTING = 'contrast.setting';
export const CONSTRAST_ABOUT = 'contrast.about';
export const CONSTRAST_SCAN = 'contrast.scan';
export const CONSTRAST_ASSESS = 'contrast.assess';

export const CONSTRAST_PANEL: string = 'Contrast.Panel';
export const CONSTRAST_ACTIVITYBAR = 'Contrast.activityBar';

export const CONSTRAST_REPORT_VULNERABILITIES_OPEN =
  'contrast.report.vulnerability.open';
export const CONTRAST_RETRIEVE_VULNERABILITIES = 'contrast.retrieveVul';
export const CONTRAST_STATUSBAR_CLICK = 'contrast.statusBarOnClick';

export const TAB_BLOCKER = 'contrast.tab.blocker';

//Theme Commands
export const CONTRAST_THEME = 'contrastTheme';

//Webview Commands

export enum WEBVIEW_SCREENS {
  SETTING = 'CONFIGURE_SETTING',
  SCAN = 'CONFIGURE_SCAN',
}

export enum WEBVIEW_COMMANDS {
  // setting
  SETTING_ADD_PROJECT_TO_CONFIGURE = 'addProjectToConfig',
  SETTING_GET_CONFIGURE_PROJECTS = 'getOrgProjects',
  SETTING_GET_ALL_PROJECTS = 'getAllProjects',
  SETTING_UPDATE_CONFIGURE_PROJECT = 'updateOrgProject',
  SETTING_DELETE_CONFIGURE_PROJECT = 'deleteOrgProject',
  SCAN_OPEN_VULNERABILITY_FILE = 'openVulnerabilityFile',
  SCAN_GET_CURRENTFILE_VUL = 'getCurrentFileVul',
  SCAN_GET_ALL_FILES_VULNERABILITY = 'getAllFilesVulnerability',

  // Scan
  SCAN_UPDATE_FILTERS = 'updateFilters',
  SCAN_GET_FILTERS = 'getFilters',
  SCAN_MANUAL_REFRESH = 'manualRefresh',
}

export enum EXTENTION_COMMANDS {
  SETTING_SCREEN = 1,
  SCAN_SCREEN = 2,
  L10N = 'i10n',
  CURRENT_FILE = 'current_file',
  VULNERABILITY_REPORT = 'vulnerability_report',
}

export enum TOKEN {
  SETTING = 'setting',
  SCAN = 'scan',
}

export enum SETTING_KEYS {
  CONFIGPROJECT = 'configuredProjects',
}

export enum SCAN_KEYS {
  FILTERS = 'filters',
}
