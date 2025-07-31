import {
  ContrastAssessLocale,
  ContrastScanLocale,
  ContrastSettingsLocale,
  DateRangeOption,
  FilterOption,
  FilterType,
  ProjectVulnerability,
  SessionMetaDataForRadio,
  SeverityOptionsType,
  StatusOptionsType,
  TimeSlotOption,
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
    note: 'Please enter the URL in the format',
  },
  userName: {
    translate: 'User Name',
    placeholder: 'Enter User Name',
    note: 'Please enter the Email-ID',
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
  projectName: {
    translate: 'Project Name',
    placeholder: 'No project found',
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
  { type: 'FIXED', label: 'Fixed' },
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
    FIXED: false,
  },
};

// ----------------- Assess constant Datas --------------------------

const AssessLocale: ContrastAssessLocale = {
  translate: 'Contrast Assess',
  filters: {
    translate: 'Filters',
    assess: {
      translate: 'Filters',
      formFields: {
        application: {
          translate: 'Application Name',
          placeholder: 'No Application Found',
        },
        server: {
          noServerFound: {
            translate: 'Servers',
            placeholder: 'No Servers Found',
          },
          selectServer: {
            translate: 'Servers',
            placeholder: 'Select Servers',
          },
        },
        buildNumber: {
          noBuildNumberFound: {
            translate: 'Build Number',
            placeholder: 'No Build Number Found',
          },
          selectBuildNumber: {
            translate: 'Build Number',
            placeholder: 'Select Build Number',
          },
        },
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
        Filter: {
          translate: 'Filter',
          options: [
            {
              name: 'From',
              translate: 'From',
            },
            {
              name: 'To',
              translate: 'To',
            },
          ],
        },
        session_metadata: {
          translate: 'Session Metadata',
          options: [
            {
              name: 'none-radio',
              translate: 'None',
            },
            {
              name: 'custom-session-radio',
              translate: 'Custom Session',
            },
            {
              name: 'most-recent-session-radio',
              translate: 'Most recent session',
            },
          ],
        },
        environments: {
          noEnvironmentFound: {
            translate: 'Environments',
            placeholder: 'No Environments Found',
          },
          selectEnvironment: {
            translate: 'Environments',
            placeholder: 'Select Environments',
          },
        },
        tags: {
          noTagFound: {
            translate: 'Tags',
            placeholder: 'No Tags Found',
          },
          selectTag: {
            translate: 'Tags',
            placeholder: 'Select Tags',
          },
        },
      },
    },
    library: {
      translate: 'Library',
      formFields: {
        application: {
          translate: 'Application Name',
          placeholder: 'No Application Found',
        },
        environments: {
          translate: 'Environments',
          placeholder: 'Select Environments',
        },
        servers: {
          translate: 'Servers',
          placeholder: 'Select Servers',
        },
        quickView: {
          translate: 'Quick View',
          placeholder: 'Select Quick View',
        },
        libraryUsage: {
          translate: 'Library Usage',
          placeholder: 'Select Library Usage',
        },
        libraryLicenceType: {
          translate: 'Library Licence Type',
          placeholder: 'Select Library Licence Type',
        },
        tag: {
          translate: 'Tags',
          placeholder: 'Select Tags',
        },
        severity: {
          translate: 'Severity',
          placeholder: 'Select Severity',
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
      },
    },
  },
  currentFile: {
    translate: 'Current File',
  },
  vulnerabilityReport: {
    translate: 'Vulnerability Report',
    htmlElements: {
      translate:
        '<h1>No vulnerabilities found:</h1><ol><li>Navigate to the Contrast - Assess menu</li><li>Select the necessary filters in the vulnerability tab, Click on save button and click Run Button.</li><li>View the results in the Vulnerabilities Report tab.</li></ol><p>After retrieving vulnerabilities, return to this screen.</p><p>',
    },
    tabs: {
      overView: {
        translate: 'Overview',
        formFields: {
          whatHappened: {
            translate: 'What happened?',
          },
          whatsTheRisk: {
            translate: "What's the risk?",
          },
          firstDetectedDate: {
            translate: 'First Detected Date',
          },
          lastDetectedDate: {
            translate: 'Last Detected Date',
          },
        },
      },
      howToFix: {
        translate: 'How To Fix',
      },
      events: {
        translate: 'Events',
      },
      httpRequest: {
        translate: 'Http Request',
      },
      tags: {
        translate: 'tags',
        formFields: {
          applyExistingTag: {
            translate: 'Apply existing tag',
          },
          createAndApplyNewTag: {
            translate: 'Create and apply a new tag ',
          },
          appliedTag: {
            translate: 'Applied tag',
          },
          tag: {
            translate: 'Tag',
            placeholder: 'Nothing to show',
          },
        },
      },
      markAs: {
        translate: 'Mark as',
        formFields: {
          markAs: {
            translate: 'Mark as',
          },
          Reason: {
            translate: 'Reason',
          },
          addComment: {
            translate: 'Add Comment',
          },
          justification: {
            translate: 'Justification',
          },
        },
      },
    },
  },
  buttons: {
    refresh: {
      translate: 'Refresh',
    },
    clear: {
      translate: 'Clear',
    },
    run: {
      translate: 'Run',
    },
    ok: {
      translate: 'Ok',
    },
    create: {
      translate: 'Clear',
    },
    save: {
      translate: 'Save',
    },
  },
  tooltips: {
    refresh: {
      translate: 'Refresh',
    },
    clear: {
      translate: 'Clear',
    },
    run: {
      translate: 'Run',
    },
    ok: {
      translate: 'Ok',
    },
    create: {
      translate: 'Clear',
    },
    refreshServersAndBuildNumbers: {
      translate: 'Refresh environments, servers, tags, and build numbers',
    },
    clearsServersAndBuildNumbers: {
      translate: 'Clear environments, servers, tags, and build numbers',
    },
    clearsAllAppliedFilters: {
      translate: 'Clears all applied filters',
    },
    fetchVulnerabilities: {
      translate: 'Fetch vulnerabilities',
    },
    assessRun: {
      translate:
        'Search for vulnerabilities and its libraries with these filter settings',
    },
    vulnerabilitySave: {
      translate: 'Saves current selected filter',
    },
    vulnerabilityClear: {
      translate: 'Restores to default value',
    },
    libraryRefresh: {
      translate:
        'Refresh’s Servers, Quick View, Library Usage, Library Licence type and Tags',
    },
    libraryClear: {
      translate:
        'Clear’s Servers, Quick View, Library Usage, Library Licence type and Tags',
    },
  },
  librariesReport: {
    translate: 'Library Report',
    htmlElements: {
      translate:
        '<h1>No Libraries found:</h1><ol><li>Navigate to the Contrast - Assess menu</li><li>Select the necessary filters in the library tab, Click on the save button and click Run Button.</li><li>View the results in the Libraries Report tab.</li></ol><p>After retrieving Runtime Libraries, return to this screen.</p><p>',
    },
    tabs: {
      overView: {
        translate: 'Overview',
        formFields: {
          library: {
            released: {
              translate: 'Released',
            },
            identifier: {
              translate: 'Identifier',
            },
            license: {
              translate: 'License',
            },
            vulnerability: {
              translate: 'Vulnerability',
            },
            policyViolations: {
              translate: 'Policy Violations',
            },
            appsUsing: {
              translate: 'Apps Using',
            },
            classesUsed: {
              translate: 'Classes Used',
            },
            whatHappened: {
              translate: 'What happened?',
              placeholder: 'This library has known CVEs.',
            },
            whatTheRisk: {
              translate: "What's the risk?",
            },
          },
          cve: {
            firstSeen: {
              translate: 'First seen in Contrast',
            },
            nvdPublished: {
              translate: 'NVD Published',
            },
            nvdLastModified: {
              translate: 'NVD Last Modified',
            },
            nvdLatestInformation: {
              translate: 'See NVD for latest information',
            },
            cveOrg: {
              translate: 'See in cve.org ',
            },
            severityAndMetrics: {
              translate: 'Severity and Metrics',
            },
            vector: {
              translate: 'Vector',
            },
            description: {
              translate: 'Description',
            },
            organizationalImpact: {
              translate: 'Organizational Impact',
            },
          },
        },
      },

      howToFix: {
        translate: 'How To Fix',
        placeholder: 'No recommended fixes.',
        minimumUpgrade: {
          translate: 'Minimum upgrade',
          placeholder: 'We recommend upgrading to',
        },
        latestStable: {
          translate: 'Latest stable',
          placeholder: 'We recommend upgrading to',
        },
      },
      usage: {
        translate: 'Usage',
        formFields: {
          classesLoaded: {
            translate: 'Classes Loaded',
          },
          firstObserved: {
            translate: 'First Seen',
          },
          lastObserved: {
            translate: 'Last Seen',
          },
          noSearchResults: {
            translate: 'No search results',
          },
        },
      },
      path: {
        translate: 'Path',
        noDataFoundLable: 'No Path found',
        noDataFoundContent:
          'Note: Please check the corresponding manifest files for the selected library.',
      },
      tags: {
        translate: 'Tags',
      },
    },
  },
};

const dateRangeFilters: DateRangeOption[] = [
  {
    filterId: 1,
    label: 'All',
  },
  {
    filterId: 2,
    label: 'Last Hour',
  },
  {
    filterId: 3,
    label: 'Last Day',
  },
  {
    filterId: 4,
    label: 'Last Week',
  },
  {
    filterId: 5,
    label: 'Last Month',
  },
  {
    filterId: 6,
    label: 'Last Year',
  },
  {
    filterId: 7,
    label: 'Custom',
  },
];

const availableTimeSlots: TimeSlotOption[] = Array.from({ length: 24 }).map(
  (item, index) => ({ slotId: index, label: `${index}` })
);

const sessionMetaDatas: SessionMetaDataForRadio[] = [
  { id: 'none-radio', value: '1', label: 'None', isDisabled: false },
  {
    id: 'custom-session-radio',
    value: '2',
    label: 'Custom Session',
    isDisabled: true,
  },
  {
    id: 'most-recent-session-radio',
    value: '3',
    label: 'Most recent session',
    isDisabled: true,
  },
];

const mainFilters: FilterOption[] = [
  { keycode: 'Reported', label: 'Reported' },
  { keycode: 'Suspicious', label: 'Suspicious' },
  { keycode: 'Confirmed', label: 'Confirmed' },
  { keycode: 'NotAProblem', label: 'Not A Problem' },
  { keycode: 'Remediated', label: 'Remediated' },
  { keycode: 'Fixed', label: 'Fixed' },
];

const notAProblemSubfilters: FilterOption[] = [
  { keycode: 'EC', label: 'Attack is defended by an external control' },
  { keycode: 'FP', label: 'False Positive' },
  { keycode: 'SC', label: 'Goes through an internal security control' },
  { keycode: 'OT', label: 'Other' },
  { keycode: 'URL', label: 'URL is only accessible by trusted power users' },
];

export {
  settingLocale,
  organizationLocale,
  allProjectVul,
  FilterData,
  FilterLocale,
  SeverityOptions,
  StatusOptions,
  FilterTabsLocale,
  AssessLocale,
  dateRangeFilters,
  availableTimeSlots,
  sessionMetaDatas,
  mainFilters,
  notAProblemSubfilters,
};
