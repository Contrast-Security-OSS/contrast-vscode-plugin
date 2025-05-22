import React, {
  ChangeEventHandler,
  MouseEventHandler,
  ReactElement,
} from 'react';
import { EXTENTION_COMMANDS } from '../vscode-extension/utils/constants/commands';
import {
  Events,
  Level0Entry,
  Level1Entry,
  ListOfTagsResponse,
  ProjectSource,
  ResponseCustomSession,
} from '../vscode-extension/api/model/api.interface';
import { TooltipProps } from '@mui/material';

// Custom Components

export interface InputProps {
  type: string;
  placeholder: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  name: string;
  value: string;
  id?: string;
}

export interface ButtonProps {
  title: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  color?: string;
  className?: string;
  isDisable?: boolean;
  id?: string;
  tooltip?: string;
}

// ---------------- supported locally language -----------------

export enum LOCAL_LANG {
  ENGLISH = 'en',
  JAPAN = 'ja',
}

// ---------------- localization ---------------------------------

export type TranslateType = {
  translate: string;
  placeholder?: string;
  note?: string;
};
type OptionLocaleType = Array<{ name: string; translate: string }>;

export type ContrastSettingsLocale = {
  formFields: {
    source?: {
      translate: string;
      options: [
        {
          name: string;
          translate: string;
        },
        {
          name: string;
          translate: string;
        },
      ];
    };
    contrastURL?: TranslateType;
    userName?: TranslateType;
    serviceKey?: TranslateType;
    apiKey?: TranslateType;
    organizationId?: TranslateType;
    projectName?: TranslateType;
    applicationName?: TranslateType;
    vulnerabilityRefreshCycle?: TranslateType;
  };
  organization?: {
    organizationName: TranslateType;
    projectName: TranslateType;
    type: TranslateType;
  };
  tooltips: {
    edit: TranslateType;
    delete: TranslateType;
  };
  buttons?: {
    add: TranslateType;
    cancel: TranslateType;
    update: TranslateType;
    retrieve: TranslateType;
  };
  others?: {
    minute?: TranslateType;
  };
  errorMessages: {
    contrastURL: {
      required: TranslateType;
      invalid: TranslateType;
    };
    userName: {
      required: TranslateType;
      invalid: TranslateType;
    };
    serviceKey: { required: TranslateType };
    apiKey: { required: TranslateType };
    organizationId: { required: TranslateType };
    minute: { required: TranslateType };
  };
};
export type ContrastScanLocale = {
  translate: string;
  filter: {
    translate?: string;
    projectName?: TranslateType;
    severity: {
      translate: string;
      options?: OptionLocaleType;
    };
    status: {
      translate: string;
      options?: OptionLocaleType;
    };
    buttons: {
      run: TranslateType;
      clear: TranslateType;
    };
  };
  currentFile: TranslateType;
  vulnerabilityReport: {
    translate: string;
    htmlElements: TranslateType;
  };
  tooltips: {
    refresh: TranslateType;
  };
};

export type ContrastAssessLocale = {
  translate?: string;
  retrieveVul?: {
    translate?: string;
    formFields: {
      application?: TranslateType;
      server?: {
        noServerFound?: TranslateType;
        selectServer?: TranslateType;
      };
      buildNumber?: {
        noBuildNumberFound?: TranslateType;
        selectBuildNumber?: TranslateType;
      };
      severity?: {
        translate: string;
        options?: OptionLocaleType;
      };
      status?: {
        translate: string;
        options?: OptionLocaleType;
      };
      Filter?: {
        translate: string;
        options?: OptionLocaleType;
      };
      session_metadata?: {
        translate: string;
        options?: OptionLocaleType;
      };
    };
  };
  currentFile?: {
    translate: string;
  };
  vulnerabilityReport?: {
    translate: string;
    htmlElements?: TranslateType;
    tabs?: {
      overView?: {
        translate?: string;
        formFields?: {
          whatHappened: TranslateType;
          whatsTheRisk: TranslateType;
          firstDetectedDate: TranslateType;
          lastDetectedDate: TranslateType;
        };
      };
      howToFix?: TranslateType;
      events?: TranslateType;
      httpRequest?: TranslateType;
      tags?: {
        translate?: string;
        formFields?: {
          applyExistingTag: TranslateType;
          createAndApplyNewTag: TranslateType;
          appliedTag: TranslateType;
          tag: TranslateType;
        };
      };
      markAs?: {
        translate?: string;
        formFields?: {
          markAs: TranslateType;
          Reason: TranslateType;
          addComment: TranslateType;
          justification: TranslateType;
        };
      };
    };
  };
  buttons?: {
    refresh?: TranslateType;
    clear?: TranslateType;
    run?: TranslateType;
    ok?: TranslateType;
    create?: TranslateType;
  };
  tooltips?: {
    refresh?: TranslateType;
    clear?: TranslateType;
    run?: TranslateType;
    ok?: TranslateType;
    redirect?: TranslateType;
    create?: TranslateType;
    delete?: TranslateType;
    refreshServersAndBuildNumbers: TranslateType;
    clearsServersAndBuildNumbers: TranslateType;
    clearsAllAppliedFilters: TranslateType;
    fetchVulnerabilities: TranslateType;
  };
};
export interface LocalizationJSON {
  contrastSettings: ContrastSettingsLocale;
  contrastScan: ContrastScanLocale;
  contrastAssess: ContrastAssessLocale;
}

export type LocaleJson = ContrastScanLocale | ContrastSettingsLocale;

// -----------------  Api Request & Response ----------------------------
export type ProjectList = {
  id: string;
  organizationId: string;
  name: string;
  archived: boolean;
  language: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  note: number;
  lastScanTime: string; // ISO timestamp
  completedScans: number;
  lastScanId: string;
  createdBy: string; // Can be an empty string
  vulnerableLanguages: string[]; // Array of strings
  parentId: string | null; // Can be null
  branch: string; // Can be an empty string
  dynamicScoring: boolean;
  tags: string[]; // Array of strings
  metadata: Record<string, string>; // Can be an empty object
};

export type ResponseData =
  | boolean
  | Record<string, string>
  | Array<Record<string, string>>
  | []
  | null
  | CustomFileVulnerability
  | ConfiguredProject[]
  | ProjectVulnerability
  | FilterType
  | PackageInformation
  | ProjectList
  | Level1Entry
  | Vulnerability[]
  | ProjectVulnerability[]
  | Level1Entry[]
  | ProjectSource
  | Level0Entry[]
  | string
  | ProjectSource[]
  | ResponseCustomSession[]
  | ListOfTagsResponse[]
  | AssessFilter
  | Events[];

export interface SucessResponse {
  status: 'success';
  code: number;
  message: string;
  responseData: ResponseData;
}

export interface FailureResponse {
  status: 'failure';
  code: number;
  message: string;
  responseData: ResponseData;
}

export type ApiResponse = SucessResponse | FailureResponse;

// ----------------- Contrast Common types and Interface-----------------

export type ScreenId =
  | EXTENTION_COMMANDS.SCAN_SCREEN
  | EXTENTION_COMMANDS.SETTING_SCREEN
  | EXTENTION_COMMANDS.ASSESS_SCREEN;

export type CommandRequest = {
  command: string;
  screen: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
};

export type CommandResponse = {
  command: string | number;
  data?: ApiResponse | LocaleJson | null | {};
};

// -------------------- Redux Store ------------------------------------
export type LocaleState = {
  data: LocaleJson | null;
};

export type ScanState = {
  filters: ApiResponse | null;
  activeProjectName: string | null;
  validWorkspaceProjects: ValidProjectType[] | null;
  backgroundVulnRunner: boolean;
  manualRefreshBackgroundVulnRunner: boolean;
  activeCurrentFile: null | boolean;
  activeVulnerabilityReport: null | boolean;
  scanRetrievelDetectAcrossIds: boolean;
};

export type ProjectState = {
  configuredProjects: ApiResponse | null;
  allProjectList: ApiResponse | null;
  allApplicationList: ApiResponse | null;
  configuredProjectDelete: ApiResponse | null;
  addConfigureProject: ApiResponse | null;
  updateConfigureProject: ApiResponse | null;
  cancelStateWhileDelete: boolean;
  settingActions: boolean;
};

export type ScreenState = {
  data: string | null | number;
};

export type VulReport = {
  currentFile: ApiResponse | null;
  allFiles: ApiResponse | null;
};

export type ReducerTypes = {
  i10ln: LocaleState;
  screen: ScreenState;
  project: ProjectState;
  vulnerability: VulReport;
  scan: ScanState;
  assessFilter: AssessFilterState;
  theme: Record<string, number | null>;
};
// -------------------- React webview types and Interfaces -------------------

type MappedType<T, U> = {
  [p in keyof T]: U;
};

// Setting Screen :

export interface PrimaryConfig {
  apiKey: string;
  contrastURL: string;
  userName: string;
  serviceKey: string;
  organizationId: string;
  source: string;
}

export interface ConfigInputValidation {
  valid: Boolean;
  touched: Boolean;
  message?: String;
}

export interface SecondaryConfig {
  projectName: string;
  projectId?: string;
  minute: number | string;
}

export type ConfiguredProject = PrimaryConfig &
  SecondaryConfig & { id?: string | number; organizationName?: string };

export type SecondaryConfigValidation = MappedType<
  SecondaryConfig,
  ConfigInputValidation
>;

export type PrimaryConfigValidation = MappedType<
  PrimaryConfig,
  ConfigInputValidation
>;

export type ContrastSettingsLocales = ContrastSettingsLocale['formFields'] &
  ContrastSettingsLocale['others'] & {
    buttons: ContrastSettingsLocale['buttons'];
  } & { errorMessages: ContrastSettingsLocale['errorMessages'] };

export type ContrastOrganizationLocales = {
  organization: ContrastSettingsLocale['organization'];
  tooltips: ContrastSettingsLocale['tooltips'];
};

// -------------------------------- Scan Screen ----------------------------------------

export interface ValidProjectType {
  id: string;
  name: string;
}

export interface TabViewerProps {
  tabId: number; // Correct typing for tabId prop
}

export interface PopupMessage {
  message?: string;
  lastDetected_date?: string;
  firstDetected_date?: string;
  status?: string;
  link?: string | null;
  advise?: string;
}

export interface Vulnerability {
  id?: string;
  level: number;
  label: string;
  lineNumber: number;
  popupMessage: PopupMessage;
  severity: string;
  overview?: VulnerabilityOverview;
}

export interface FileVulnerability {
  level?: number;
  label?: string;
  issuesCount?: number;
  filePath?: string;
  fileType?: string;
  child?: Vulnerability[];
}

export interface ProjectVulnerability {
  level: number;
  label: string;
  issuesCount: number;
  filesCount: number;
  child: FileVulnerability[];
}

export type CustomFileVulnerability = FileVulnerability & {
  fileName?: string;
  popupMessage?: PopupMessage;
  lineNumber?: number;
  severity?: string;
  scrollToLine?: boolean;
  id?: string;
  filesCount?: number;
  overview?: VulnerabilityOverview;
};

// ------------------- Filter -------------------------------
//   ----------------Filter ---------------------

interface OptionsT<T> {
  type: T;
  label: string;
}
export type SeverityOptionsType = OptionsT<keyof FilterSeverity>[];
export type StatusOptionsType = OptionsT<keyof FilterStatus>[];

export interface FilterSeverity {
  CRITICAL: boolean;
  HIGH: boolean;
  MEDIUM: boolean;
  LOW: boolean;
  NOTE: boolean;
}

export interface FilterStatus {
  REPORTED: boolean;
  CONFIRMED: boolean;
  SUSPICIOUS: boolean;
  NOT_A_PROBLEM: boolean;
  REMEDIATED: boolean;
  REMEDIATED_AUTO_VERIFIED?: boolean;
  REOPENED?: boolean;
  FIXED?: boolean;
}

export interface FilterType {
  severity: FilterSeverity;
  status: FilterStatus;
}

// -------------Logger----------------------------
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

// -------------------- Package Information -----------------------
export type PackageInformation = {
  IDEVersion: string;
  aboutPage: {
    title: string;
    content: string;
  };
  description: string;
  displayName: string;
  name: string;
  osWithVersion: string;
  platform: string;
  version: string;
};

// --------------------   Material Types --------------------

export type IEvent = (e: {
  value: string | string[];
  children: React.ReactNode;
  additionalProps?: string | object;
}) => void;

export interface IDropDown {
  value: string | string[];
  children: React.ReactElement[] | React.ReactElement; // This is correct
  onChange?: IEvent | undefined;
  id?: string;
  placeHolder?: string;
  isDisabled?: boolean;
  hasSearchBox?: boolean;
  noDataFoundMessage?: string;
  isMultiSelect?: boolean;
  tooltipPlacement?: TooltipProps['placement'];
  isClearable?: boolean;
}

export interface IOption {
  value: string | string[];
  children: React.ReactNode; // Allow ReactNode instead of string
  onClick?: IEvent;
  style?: React.CSSProperties;
  id?: string;
  additionalProps?: string | object;
  isChecked?: boolean;
  isMulti?: boolean;
  tooltipPlacement?: TooltipProps['placement'];
}

export type TabProps = {
  title: string;
  isActive?: boolean;
  onClick?: () => void;
};

export type TabGroupProps = {
  onTabChange: (tabIndex: number) => void;
  children: ReactElement | ReactElement[];
};

// -------------Pesistance-------------------------
export type PersistedDTO =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { [key: string]: any }
  | { configuredProjects?: ConfiguredProject[] }
  | { filters?: FilterType }
  | { assessFilters?: AssessFilter };

// -------------About-------------------------
interface AboutPage {
  title: string;
  content: string;
}

export interface PackageInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  aboutPage: AboutPage;
  osWithVersion: string;
  IDEVersion: string;
  platform: string;
}

// ------------------------ Assess Feature Types --------------------------

export type PassLocalLang = LocaleJson | null;
export interface DateRangeOption {
  filterId: number;
  label: string;
}

export interface TimeSlotOption {
  slotId: number;
  label: string;
}

export interface DateTimeFilter {
  range: string;
  fromDateTime: DateTimeValue | null;
  toDateTime: DateTimeValue | null;
}

export interface Server {
  server_id: number;
  name: string;
}

export interface BuildNumber {
  keycode: string;
  label: string;
}

export interface DateTimeValue {
  date: string | null;
  time: string | null;
}

export interface SessionMetaDataForRadio {
  id: string;
  value: string;
  label: string;
  isDisabled?: boolean;
}

export interface CustomSessionSystemValue {
  value?: string;
  count?: number;
}
export interface CustomSessionSystemProperty {
  id: string;
  label: string;
}

export type CustomSessionMetaData = CustomSessionSystemProperty & {
  values: CustomSessionSystemValue[] | [];
};

export type MostRecentMetaData = {
  agentSessionId: string;
};

export type AssessFilterState = {
  configuredApplications: ApiResponse | null;
  serverListbyOrgId: ApiResponse | null;
  buildNumber: ApiResponse | null;
  customSessionMetaData: ApiResponse | null;
  mostRecentMetaData: ApiResponse | null;
  filters: ApiResponse | null;
  allFiles: ApiResponse | null;
  backgroundVulnRunner: boolean;
  markAsBtnBehaviour: boolean;
  orgTags: ApiResponse | null;
  tagsOkBehaviour: boolean;
  currentFile: ApiResponse | null;
  manualRefreshBackgroundVulnRunner: boolean;
  activeCurrentFile: ApiResponse | null;
  refreshBackgroundVulnRunnerAcrossIds: boolean;
};

export interface VulnerabilityOverview {
  chapters?: Array<{ type?: string; introText: string; body: string }>;
  risk?: {
    text?: string;
  };
}

export interface VulnerabilityHowToFix {
  recommendation?: {
    text: string;
  };
  custom_recommendation?: {
    text: string;
  };
  owasp?: string;
  cwe?: string;
  rule_references?: {
    text: string;
  };
  custom_rule_references?: {
    text: string;
  };
}
export interface vulnerabilityEventsTree {
  isRoot?: boolean;
  type?: string;
  label?: string;
  child?: vulnerabilityEventsTree[] | [] | null;
}
export interface VulnerabilityEvents {
  data: vulnerabilityEventsTree[];
}

export interface VulnerabilityHttpRequest {
  text: string;
}

export interface VulnerabilityTags {
  id: number;
  label: string;
}
export interface AssessVulnerability {
  id?: string;
  traceId?: string;
  level: number;
  label: string;
  lineNumber: number;
  popupMessage: PopupMessage;
  severity: string;
  Substatus_keycode: string;
  overview?: VulnerabilityOverview;
  howToFix?: VulnerabilityHowToFix;
  events?: VulnerabilityEvents;
  http_request?: VulnerabilityHttpRequest;
  tags: VulnerabilityTags[];
}

export interface AssessFileVulnerability {
  level?: number;
  label?: string;
  issuesCount?: number;
  filePath?: string;
  fileType?: string;
  child?: AssessVulnerability[];
}

export interface AssessProjectVulnerability {
  level: number;
  label: string;
  issuesCount: number;
  filesCount: number;
  child: AssessFileVulnerability[];
}

export interface AssessVulnerabilitiesType {
  orgId?: string;
  appId?: string;
  servers?: number | number[] | string | string[];
  appVersionTags?: string | string[];
  severities?: string;
  status?: string;
  startDate?: {
    date?: string;
    time?: string;
    timeStamp?: number;
    dateTime?: string;
  };
  endDate?: {
    date?: string;
    time?: string;
    timeStamp?: number;
    dateTime?: string;
  };
  agentSessionId?: string;
  metadataFilters?:
    | [
        {
          fieldID?: string;
          values?: string[];
        },
      ]
    | [];
  dateFilter?: string;
  activeSessionMetadata?: string;
}
export type AssessFilter = ConfiguredProject & AssessVulnerabilitiesType;

export type FilterOption = {
  keycode: string;
  label: string;
};
