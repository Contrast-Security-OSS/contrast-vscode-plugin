import React, {
  ChangeEventHandler,
  MouseEventHandler,
  ReactElement,
} from 'react';
import { EXTENTION_COMMANDS } from '../vscode-extension/utils/constants/commands';
import {
  Level0Entry,
  Level1Entry,
  ProjectSource,
} from '../vscode-extension/api/model/api.interface';

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
}

// ---------------- supported locally language -----------------

export enum LOCAL_LANG {
  ENGLISH = 'en',
  JAPAN = 'ja',
}

// ---------------- localization ---------------------------------

export type TranslateType = { translate: string; placeholder?: string };
type OptionLocaleType = Array<{ name: string; translate: string }>;
export interface LocalizationJSON {
  contrastSettings: {
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
  contrastScan: {
    translate: string;
    filter: {
      translate?: string;
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
}

export type ContrastSettingsLocale = LocalizationJSON['contrastSettings'];
export type ContrastScanLocale = LocalizationJSON['contrastScan'];
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
  | ProjectSource[];

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
  | EXTENTION_COMMANDS.SETTING_SCREEN;

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
  activeCurrentFile: null | boolean;
  activeVulnerabilityReport: null | boolean;
};

export type ProjectState = {
  configuredProjects: ApiResponse | null;
  allProjectList: ApiResponse | null;
  configuredProjectDelete: ApiResponse | null;
  addConfigureProject: ApiResponse | null;
  updateConfigureProject: ApiResponse | null;
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
export interface TabViewerProps {
  tabId: number; // Correct typing for tabId prop
}

export interface PopupMessage {
  message?: string;
  lastDetected_date?: string;
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
  REMEDIATED_AUTO_VERIFIED: boolean;
  REOPENED: boolean;
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

type IEvent = (e: { value: string; children: React.ReactNode }) => void;

export interface IDropDown {
  value: string;
  children: React.ReactElement[] | React.ReactElement; // This is correct
  onChange?: IEvent | undefined;
  id?: string;
}

export interface IOption {
  value: string;
  children: React.ReactNode; // Allow ReactNode instead of string
  onClick?: IEvent;
  style?: React.CSSProperties;
  id?: string;
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
  | { filters?: FilterType };

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
