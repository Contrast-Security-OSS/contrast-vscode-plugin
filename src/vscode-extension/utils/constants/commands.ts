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

// Configuration Commands
export const CONTRAST_SECURITY = 'contrastSecurity';
export const CONTRAST_SECURITY_GLOBAL_SHARING = 'globalSharing';

//Theme Commands
export const CONTRAST_THEME = 'contrastTheme';

//Webview Commands

export enum WEBVIEW_SCREENS {
  SETTING = 'CONFIGURE_SETTING',
  SCAN = 'CONFIGURE_SCAN',
  ASSESS = 'CONFIGURE_ASSESS',
}

export enum WEBVIEW_COMMANDS {
  // Setting
  SETTING_ADD_PROJECT_TO_CONFIGURE = 'addProjectToConfig',
  SETTING_GET_CONFIGURE_PROJECTS = 'getOrgProjects',
  SETTING_GET_ALL_PROJECTS = 'getAllProjects',
  SETTING_GET_ALL_APPLICATIONS = 'getAllApplication', // New
  SETTING_UPDATE_CONFIGURE_PROJECT = 'updateOrgProject',
  SETTING_DELETE_CONFIGURE_PROJECT = 'deleteOrgProject',
  SETTING_CANCEL_STATE_WHILE_DELETE = 'cancelStateWhileDelete',
  SETTING_ACTIONS = 'settingActions',
  SCAN_OPEN_VULNERABILITY_FILE = 'openVulnerabilityFile',
  SCAN_GET_CURRENTFILE_VUL = 'getCurrentFileVul',
  SCAN_GET_ALL_FILES_VULNERABILITY = 'getAllFilesVulnerability',
  SCAN_RETRIEVEL_DETECT_ACROSS_IDS = 'scanRetrievelDetectAcrossIds',

  // Scan
  SCAN_ACTIVE_PROJECT_NAME = 'activeProjectName',
  SCAN_VALID_CONFIGURED_PROJECTS = 'validConfiguredProjects',
  SCAN_BACKGROUND_RUNNER = 'scanBackgroundRunner',
  SCAN_MANUAL_REFRESH_BACKGROUND_RUNNER = 'scanManulaRefreshBackgroundRunner',
  SCAN_UPDATE_FILTERS = 'updateFilters',
  SCAN_GET_FILTERS = 'getFilters',
  SCAN_MANUAL_REFRESH = 'manualRefresh',

  // Assess
  GET_CONFIGURED_APPLICATIONS = 'getConfiguredApplications',
  GET_SERVER_LIST_BY_ORG_ID = 'getServerListbyOrgId',
  GET_BUILD_NUMBER = 'getBuilNumber',
  GET_CUSTOM_SESSION_METADATA = 'getCustomSessionMetaData',
  GET_MOST_RECENT_METADATA = 'getMostRecentMetaData',
  COMMON_MESSAGE = 'commonMessage',
  ASSESS_UPDATE_FILTERS = 'assessUpdateFilters',
  ASSESS_GET_FILTERS = 'assessGetFilters',
  ASSESS_GET_ALL_FILES_VULNERABILITY = 'assessGetAllFilesVulnerability',
  ASSESS_GET_INITIAL_ALL_FILES_VULNERABILITY = 'assessGetInitialsAllFilesVulnerability',
  ASSESS_BACKGROUND_RUNNER = 'assessBackgroundRunner',
  ASSESS_REDIRECTION = 'assessRedirection',
  ASSESS_UPDATE_VULNERABILITY = 'assessUpdateVulnerability',
  ASSESS_MANUAL_REFRESH = 'assessManualRefresh',
  ASSESS_ADD_MARK = 'assessAddMark',
  ASSESS_ORG_TAGS = 'assessOrganizationTags',
  ASSESS_TAG_ALREADY_APPLIED = 'tagAlreadyApplied',
  ASSESS_TAG_ALREADY_AVAILABLE = 'tagAlreadyAvailable',
  ASSESS_VULNERABILITY_TAGGED = 'vulnerabilityTagged',
  ASSESS_TAG_LENGTH_EXCEEDED = 'tagLengthExceeded',
  ASSESS_TAG_OK_BEHAVIOUR = 'tagOkBehaviour',
  ASSESS_GET_CURRENTFILE_VUL = 'getAssessCurrentFileVul',
  ASSESS_OPEN_VULNERABILITY_FILE = 'openAssessVulnerabilityFile',
  ASSESS_MANUAL_REFRESH_BACKGROUND_RUNNER = 'assessManulaRefreshBackgroundRunner',
  ASSESS_REFRESH_BACKGROUND_RUNNER_ACROSS_IDS = 'assessRefreshBackgroundRunnerAcrossIds',
}

export enum EXTENTION_COMMANDS {
  SETTING_SCREEN = 1,
  SCAN_SCREEN = 2,
  ASSESS_SCREEN = 3,
  L10N = 'i10n',
  CURRENT_FILE = 'current_file',
  VULNERABILITY_REPORT = 'vulnerability_report',
  ASSESS_CURRENT_FILE = 'assess_current_file',
}

export enum TOKEN {
  SETTING = 'setting',
  SCAN = 'scan',
  ASSESS = 'Assess',
}

export enum SETTING_KEYS {
  CONFIGPROJECT = 'configuredProjects',
}

export enum SCAN_KEYS {
  FILTERS = 'filters',
}

export enum ASSESS_KEYS {
  FILTERS = 'filters',
}
