import {
  ConfiguredProject,
  FileVulnerability,
  Vulnerability,
} from '../../common/types';

const configuredProject1: ConfiguredProject = {
  source: 'scan',
  contrastURL: 'https://apptwo.contrast.com/Contrast/api/sast',
  userName: 'raju.kumar@security.com',
  serviceKey: '2OTZXMTYIYYYXG2K',
  apiKey: 'HLgcBCLpXwuXvOM9uBE64fIpd15xb90',
  organizationId: '2c3a73d6-78a0-46c7-944a-b07b94d557f0',
  minute: '1440',
  projectName: 'AnnettesRest14',
  projectId: '42a30a30-a34d-43ee-b347-8fd2dc5775fa',
};
const configuredProject2: ConfiguredProject = {
  source: 'scan',
  contrastURL: 'https://apptwo.security.com/Contrast/api/sast',
  userName: 'reddy.ramesh@security.com',
  serviceKey: '2OTZXMTI6YZZXG2K',
  apiKey: 'HLgcBCLpXwuXvOM9uBEw81fIpd15xb92',
  organizationId: '3d3a73d6-78a0-46c7-944a-b07b94d557f0',
  minute: '1440',
  projectName: 'contrast',
  projectId: '22a30a30-a34d-43ee-b347-8fd2dc5775ad',
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
