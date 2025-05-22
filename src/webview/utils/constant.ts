import {
  AssessProjectVulnerability,
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
  retrieveVul: {
    translate: 'Retrieve Vulnerability',
    formFields: {
      application: {
        translate: 'Application',
        placeholder: 'No Applications Found',
      },
      server: {
        noServerFound: {
          translate: 'Server',
          placeholder: 'No Servers Found',
        },
        selectServer: {
          translate: 'Server',
          placeholder: 'Select Server',
        },
      },
      buildNumber: {
        noBuildNumberFound: {
          translate: 'Build Number',
          placeholder: 'No Build Numbers Found',
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
    },
  },
  currentFile: {
    translate: 'Current File',
  },
  vulnerabilityReport: {
    translate: 'Vulnerability Report',
    htmlElements: {
      translate:
        "<h1>No vulnerabilities found for the project:</h1><ol><li>Go to the Contrast view in the Activity Bar.</li><li>Click the Retrieve Vulnerability button for the project.</li></ol><p>After retrieving vulnerabilities, return to this screen or else click on refresh icon to see the latest vulnerability report.</p><p>Tip: <span style='font-weight: 400;'>You can access this screen anytime via the Contrast Scan panel in the Activity Bar.</span></p>",
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
      translate: 'Refresh servers and buildNumbers',
    },
    clearsServersAndBuildNumbers: {
      translate: 'Clears servers and buildNumbers',
    },
    clearsAllAppliedFilters: {
      translate: 'Clears all applied filters',
    },
    fetchVulnerabilities: {
      translate: 'Fetch vulnerabilities',
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

const AssessTreeData: AssessProjectVulnerability = {
  level: 2,
  label: 'Found 10 issues in 5 files',
  issuesCount: 10,
  filesCount: 5,
  child: [
    {
      level: 1,
      label: 'SessionConfig.java',
      issuesCount: 2,
      filePath: 'SessionConfig.java',
      fileType: 'java',
      child: [
        {
          level: 0,
          traceId: 'QBFI-1K8P-EEQG-A0VU',
          label: "Application Disables 'secure' Flag on Cookies",
          lineNumber: 58,
          popupMessage: {
            lastDetected_date: '01-May-2007',
            status: 'REPORTED',
            link: 'http://mdn.com',
          },
          Substatus_keycode: 'SECURE_FLAG_MISSING',
          severity: 'Critical',
          overview: {
            chapters: [
              {
                type: 'location',
                introText: 'The code:',
                body: 'io.undertow.server.session.SessionCookieC',
              },
            ],
            risk: {
              text: "Setting the 'secure' flag on cookies prevents transmission over unencrypted channels.",
            },
          },
          howToFix: {
            recommendation: {
              text: 'Ensure that the javax.servlet.http.Cookie#setSecure() method is called with true.',
            },
            owasp: 'https://owasp.org/Top10/A05_2021-Security',
            cwe: 'https://cwe.mitre.org/data/definitions/614.html',
          },
          events: {
            data: [
              {
                label: 'Events',
                child: [
                  {
                    type: 'SECURE_FLAG_MISSING',
                    label: 'Rule Violation Detected',
                    child: [
                      {
                        label: 'cookie.setSecure(false)',
                        child: [],
                      },
                      {
                        label: 'Session created without secure flag',
                        child: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          http_request: {
            text: 'POST /WebGoat/login HTTP/1.1',
          },
          tags: [
            { id: 1, label: 'Security' },
            { id: 2, label: 'Critical' },
          ],
        },
      ],
    },
    {
      level: 1,
      label: 'DatabaseConfig.java',
      issuesCount: 2,
      filePath: 'DatabaseConfig.java',
      fileType: 'java',
      child: [
        {
          level: 0,
          traceId: 'QBFI-1K8P-EEQG-A1ZX',
          label: 'Application Uses Hardcoded Credentials',
          lineNumber: 102,
          popupMessage: {
            lastDetected_date: '15-June-2021',
            status: 'REPORTED',
            link: 'http://security.com',
          },
          Substatus_keycode: 'HARDCODED_CREDENTIALS',
          severity: 'High',
          overview: {
            chapters: [
              {
                type: 'location',
                introText: 'The code:',
                body: 'DatabaseConfig.java',
              },
            ],
            risk: {
              text: 'Hardcoded credentials can be extracted and exploited by attackers.',
            },
          },
          howToFix: {
            recommendation: {
              text: 'Store credentials securely in environment variables or a secrets manager.',
            },
            owasp: 'https://owasp.org/Top10/A03_2021-Injection',
            cwe: 'https://cwe.mitre.org/data/definitions/798.html',
          },
          events: {
            data: [
              {
                label: 'Events',
                child: [
                  {
                    type: 'HARDCODED_CREDENTIALS',
                    label: 'Rule Violation Detected',
                    child: [
                      { label: "password = 'admin123'", child: [] },
                      { label: "db_user = 'root'", child: [] },
                      { label: 'Plaintext credentials found', child: [] },
                    ],
                  },
                ],
              },
            ],
          },
          http_request: {
            text: 'GET /config/database HTTP/1.1',
          },
          tags: [
            { id: 3, label: 'Configuration' },
            { id: 4, label: 'Security Risk' },
          ],
        },
      ],
    },
    {
      level: 1,
      label: 'UserAuth.java',
      issuesCount: 2,
      filePath: 'UserAuth.java',
      fileType: 'java',
      child: [
        {
          level: 0,
          traceId: 'QBFI-1K8P-EEQG-B2YX',
          label: 'Weak Password Policy Detected',
          lineNumber: 78,
          popupMessage: {
            lastDetected_date: '20-Dec-2023',
            status: 'NEW',
            link: 'http://security-alert.com',
          },
          Substatus_keycode: 'WEAK_PASSWORD_POLICY',
          severity: 'Medium',
          overview: {
            chapters: [
              {
                type: 'location',
                introText: 'The code:',
                body: 'UserAuth.java',
              },
            ],
            risk: {
              text: 'Weak passwords make accounts vulnerable to brute-force attacks.',
            },
          },
          howToFix: {
            recommendation: {
              text: 'Enforce password complexity rules with uppercase, numbers, and special characters.',
            },
            owasp: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures',
            cwe: 'https://cwe.mitre.org/data/definitions/521.html',
          },
          events: {
            data: [
              {
                label: 'Events',
                child: [
                  {
                    type: 'WEAK_PASSWORD_POLICY',
                    label: 'Rule Violation Detected',
                    child: [
                      { label: 'password.length() < 6', child: [] },
                      { label: 'Missing special characters', child: [] },
                      { label: 'No uppercase letters', child: [] },
                    ],
                  },
                ],
              },
            ],
          },
          http_request: {
            text: 'POST /user/register HTTP/1.1',
          },
          tags: [
            { id: 5, label: 'Authentication' },
            { id: 6, label: 'Best Practices' },
          ],
        },
      ],
    },
    {
      level: 1,
      label: 'LoggingService.java',
      issuesCount: 2,
      filePath: 'LoggingService.java',
      fileType: 'java',
      child: [
        {
          level: 0,
          traceId: 'QBFI-1K8P-EEQG-C3ZY',
          label: 'Logging Sensitive Information',
          lineNumber: 35,
          popupMessage: {
            lastDetected_date: '10-Aug-2022',
            status: 'REPORTED',
            link: 'http://log-security.com',
          },
          Substatus_keycode: 'LOGGING_SENSITIVE_DATA',
          severity: 'High',
          overview: {
            chapters: [
              {
                type: 'location',
                introText: 'The code:',
                body: 'LoggingService.java',
              },
            ],
            risk: {
              text: 'Logging sensitive data can expose it in logs, leading to leaks.',
            },
          },
          howToFix: {
            recommendation: {
              text: 'Mask or remove sensitive data before logging.',
            },
            owasp: 'https://owasp.org/Top10/A06_2021-Insecure_Design',
            cwe: 'https://cwe.mitre.org/data/definitions/532.html',
          },
          events: {
            data: [
              {
                label: 'Events',
                child: [
                  {
                    type: 'LOGGING_SENSITIVE_DATA',
                    label: 'Rule Violation Detected',
                    child: [
                      { label: 'Logging user passwords', child: [] },
                      { label: 'Logging credit card numbers', child: [] },
                    ],
                  },
                ],
              },
            ],
          },
          http_request: {
            text: 'POST /logs/error HTTP/1.1',
          },
          tags: [
            { id: 7, label: 'Logging' },
            { id: 8, label: 'Security' },
          ],
        },
      ],
    },
  ],
};

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
  AssessTreeData,
  mainFilters,
  notAProblemSubfilters,
};
