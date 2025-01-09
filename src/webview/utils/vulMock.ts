import { ProjectVulnerability } from '../../common/types';

const TREEDATA: ProjectVulnerability[] = [
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
            label: 'Define a constant instead of duplicating ',
            lineNumber: 12,
            popupMessage: {
              message: '',
              lastDetected_date: '01-may-2007',
              status: 'completed',
              link: 'http://google.com',
            },
            severity: 'high',
          },
          {
            level: 0,
            label: 'Replace this use of console.log ',
            lineNumber: 123,
            popupMessage: {
              message: '',
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
        filePath: 'src/app/home.component.html',
        fileType: '.ts',
        child: [
          {
            level: 0,
            label: "Replace this use of ' <div></div> '",
            lineNumber: 23,
            popupMessage: {
              message: '',
              lastDetected_date: '01-may-2007',
              status: 'completed',
              link: 'http://mdn.com',
            },
            severity: 'medium',
          },
          {
            level: 0,
            label: 'Remove the use of nonce in Script tag',
            lineNumber: 232,
            popupMessage: {
              message: '',
              lastDetected_date: '30-may-2007',
              status: 'pending',
              link: 'http://google.com',
            },
            severity: 'high',
          },
        ],
      },
    ],
  },
];

export { TREEDATA };
