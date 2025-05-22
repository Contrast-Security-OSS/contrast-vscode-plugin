import {
  ConfiguredProject,
  FileVulnerability,
  Vulnerability,
} from '../../common/types';

const configuredProject1: ConfiguredProject = {
  id: '01',
  source: 'scan',
  contrastURL: 'https://xyz.com',
  userName: 'xyz@xyz.com',
  serviceKey: 'ABCDEFGHIJ',
  apiKey: 'PQRS1234TUV5678',
  organizationId: '123-XYZ-456-ABC-789',
  minute: '1440',
  projectName: 'Test Project',
  projectId: '456-ABC-789-XYZ',
};
const configuredProject2: ConfiguredProject = {
  id: '02',
  source: 'scan',
  contrastURL: 'https://abc.com',
  userName: 'abc@abc.com',
  serviceKey: 'KLMNOPQRST',
  apiKey: 'PQRS1234TUV5678',
  organizationId: '456-XYZ-892-ABC-789',
  minute: '1440',
  projectName: 'Test Project 2',
  projectId: '789-EFG-456-XYZ',
};

const childNode: Vulnerability = {
  level: 0,
  label: 'Replace this use of console.log',
  lineNumber: 123,
  popupMessage: {
    message: 'Incorrect way using fragments',
    lastDetected_date: '02-may-2007',
    status: 'pending',
    link: null,
  },
  severity: 'low',
};

const parentNode: FileVulnerability = {
  level: 1,
  label: 'app.component.ts',
  issuesCount: 2,
  filePath: 'src/app/app.component.ts',
  fileType: '.ts',
  child: [
    {
      level: 0,
      label: 'Define a constant instead of duplicating',
      lineNumber: 123,
      popupMessage: {
        message: "fix the image size 123x23 'FIX'",
        lastDetected_date: '01-may-2007',
        status: 'completed',
        link: 'https://google.com',
      },
      severity: 'high',
    },
    {
      level: 0,
      label: 'Replace this use of console.log ',
      lineNumber: 123,
      popupMessage: {
        message: 'Incorrect way using fragments',
        lastDetected_date: '02-may-2007',
        status: 'pending',
        link: null,
      },
      severity: 'low',
    },
  ],
};

export { configuredProject1, configuredProject2, childNode, parentNode };
