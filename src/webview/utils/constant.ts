import {
  ContrastScanLocale,
  ContrastSettingsLocale,
  FilterType,
  ProjectVulnerability,
  SeverityOptionsType,
  StatusOptionsType,
  TranslateType,
} from '../../common/types';

const settingLocale: {
  errorMessages: ContrastSettingsLocale['errorMessages'];
} & ContrastSettingsLocale['formFields'] &
  ContrastSettingsLocale['others'] & {
    buttons: ContrastSettingsLocale['buttons'];
  } = {
  source: {
    translate: 'Source',
    options: [
      {
        name: 'scan',
        translate: 'Scan',
      },
      {
        name: 'assess',
        translate: 'Assess',
      },
    ],
  },
  contrastURL: {
    translate: 'Contrast URL',
    placeholder: 'Enter Contrast URL',
  },
  userName: {
    translate: 'User Name',
    placeholder: 'Enter User Name',
  },
  serviceKey: {
    translate: 'Service Key',
    placeholder: 'Enter Service Key',
  },
  apiKey: {
    translate: 'API Key',
    placeholder: 'Enter API Key',
  },
  organizationId: {
    translate: 'Organization ID',
    placeholder: 'Enter Organization ID',
  },
  projectName: {
    translate: 'Project Name',
  },
  vulnerabilityRefreshCycle: {
    translate: 'Vulnerability Refresh Cycle',
  },
  minute: {
    translate: 'minute',
  },
  buttons: {
    add: {
      translate: 'Add',
    },
    cancel: {
      translate: 'Cancel',
    },
    update: {
      translate: 'Upate',
    },
    retrieve: {
      translate: 'Retrieve',
    },
  },

  errorMessages: {
    contrastURL: {
      required: { translate: 'Contrast URL is required' },
      invalid: {
        translate: 'Invalid URL: Please enter a valid Contrast Security URL',
      },
    },
    userName: {
      required: { translate: 'User Name is required' },
      invalid: {
        translate: 'Invalid User Name: Please enter a valid email address',
      },
    },
    apiKey: {
      required: { translate: ' API Key is required' },
    },
    organizationId: {
      required: { translate: 'Organization ID is required' },
    },
    serviceKey: {
      required: { translate: 'Service Key is required' },
    },
    minute: {
      required: {
        translate: 'Vulnerability Refresh Cycle is required',
      },
    },
  },
};

const organizationLocale = {
  organization: {
    organizationName: {
      translate: 'Organization',
    },
    projectName: {
      translate: 'Name',
    },
    type: {
      translate: 'Type',
    },
  },
  tooltips: {
    edit: {
      translate: 'Edit',
    },
    delete: {
      translate: 'Delete',
    },
  },
};

const allProjectVul: ProjectVulnerability[] = [
  {
    level: 2,
    label: 'Found 6 issues in 3 file',
    issuesCount: 10,
    filesCount: 3,
    child: [
      {
        level: 1,
        label: 'app.component.ts',
        issuesCount: 2,
        filePath: 'src/app/app.component.ts',
        fileType: '.ts',
        child: [
          {
            level: 0,
            label: 'Define a constant instead of duplicating',
            lineNumber: 12,
            popupMessage: {
              message: "fix the image size 123x23 'FIX'",
              lastDetected_date: '01-may-2007',
              status: 'completed',
              link: 'http://google.com',
            },
            severity: 'high',
          },
          {
            level: 0,
            label: 'Replace this use of console.log ',
            lineNumber: 12,
            popupMessage: {
              message: 'Incorrect way using fragments',
              lastDetected_date: '02-may-2007',
              status: 'pending',
              link: null,
            },
            severity: 'low',
          },
        ],
      },
      {
        level: 1,
        label: 'home.component.ts',
        issuesCount: 2,
        filePath: 'src/app/home.component.ts',
        fileType: '.ts',
        child: [
          {
            level: 0,
            label: 'Define a type for Project',
            lineNumber: 12,
            popupMessage: {
              message: "fix the image size 123x23 'FIX'",
              lastDetected_date: '01-may-2007',
              status: 'completed',
              link: 'http://google.com',
            },
            severity: 'high',
          },
          {
            level: 0,
            label: "Cannot find name 'allProsjectVul'",
            lineNumber: 12,
            popupMessage: {
              message: 'Incorrect way using fragments',
              lastDetected_date: '02-may-2007',
              status: 'pending',
              link: null,
            },
            severity: 'low',
          },
        ],
      },
    ],
  },
];

// --------------------- Filters ----------------------------
const FilterLocale: ContrastScanLocale['filter'] = {
  severity: {
    translate: 'Severity',
    options: [
      {
        name: 'critical',
        translate: 'Critical',
      },
      {
        name: 'high',
        translate: 'High',
      },
      {
        name: 'medium',
        translate: 'Medium',
      },
      {
        name: 'low',
        translate: 'Low',
      },
      {
        name: 'note',
        translate: 'Note',
      },
    ],
  },
  status: {
    translate: 'Status',
    options: [
      {
        name: 'reported',
        translate: 'Reported',
      },
      {
        name: 'confirmed',
        translate: 'Confirmed',
      },
      {
        name: 'suspicious',
        translate: 'Suspicious',
      },
      {
        name: 'notAproblem',
        translate: 'Not a problem',
      },
      {
        name: 'remediated',
        translate: 'Remediated',
      },
      {
        name: 'remediatedAutoVerified',
        translate: 'Remediated Auto Verified',
      },
      {
        name: 'reopened',
        translate: 'Reopened',
      },
    ],
  },
  buttons: {
    run: {
      translate: 'Run',
    },
    clear: {
      translate: 'Clear',
    },
  },
};

const FilterTabsLocale: TranslateType[] = [
  { translate: 'Filter' },
  { translate: 'Current File' },
  { translate: 'Vulnerability Report' },
];

const SeverityOptions: SeverityOptionsType = [
  { type: 'CRITICAL', label: 'Critical' },
  { type: 'HIGH', label: 'High' },
  { type: 'MEDIUM', label: 'Medium' },
  { type: 'LOW', label: 'Low' },
  { type: 'NOTE', label: 'Note' },
];
const StatusOptions: StatusOptionsType = [
  { type: 'REPORTED', label: 'Reported' },
  { type: 'CONFIRMED', label: 'Confirmed' },
  { type: 'SUSPICIOUS', label: 'Suspicious' },
  { type: 'NOT_A_PROBLEM', label: 'Not a problem' },
  { type: 'REMEDIATED', label: 'Remediated' },
  { type: 'REMEDIATED_AUTO_VERIFIED', label: 'Remediated Auto Verified' },
  { type: 'REOPENED', label: 'Reopened' },
];

const FilterData: FilterType = {
  severity: {
    CRITICAL: true,
    HIGH: true,
    MEDIUM: true,
    LOW: false,
    NOTE: false,
  },
  status: {
    REPORTED: true,
    CONFIRMED: true,
    SUSPICIOUS: true,
    NOT_A_PROBLEM: false,
    REMEDIATED: false,
    REMEDIATED_AUTO_VERIFIED: false,
    REOPENED: false,
  },
};
export {
  settingLocale,
  organizationLocale,
  allProjectVul,
  FilterData,
  FilterLocale,
  SeverityOptions,
  StatusOptions,
  FilterTabsLocale,
};
