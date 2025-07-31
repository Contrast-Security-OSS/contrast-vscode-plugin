// import { DateTimeValue } from '../../common/types';

import {
  AssessFileVulnerability,
  AssessVulnerability,
  CustomLibraryVulnerability,
  DateTimeValue,
} from '../../common/types';
import {
  CVENode,
  LibParsedVulnerability,
  LibraryNode,
} from '../../vscode-extension/api/model/api.interface';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../vscode-extension/utils/constants/commands';
import { webviewPostMessage } from './postMessage';

const getCurrentDateTime = () => new Date().toISOString();
const getCurrentDateString = () =>
  getCurrentDateTime().slice(0, getCurrentDateTime().indexOf('T'));
const isToday = (date: string) => date === getCurrentDateString();
const getCurrentHour = () => new Date().getHours();
const isEqual = (str1: string | number, str2: string | number) => str1 === str2;
const isGreaterThan = (str1: string | number, str2: string | number) =>
  str1 > str2;
const isLessThan = (str1: string | number, str2: string | number) =>
  str1 < str2;
const isGreaterThanOrEqual = (str1: string | number, str2: string | number) =>
  str1 >= str2;
const isLessThanOrEqual = (str1: string | number, str2: string | number) =>
  str1 <= str2;

const convertTimeFormat = (hour: string | number): string => {
  hour = typeof hour === 'string' ? parseInt(hour, 10) : hour;
  const isPM = hour >= 12; // Determine if it's PM
  const convertedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour; // Convert to 12-hour format
  return `${convertedHour} ${isPM ? 'PM' : 'AM'}`; // Create the label
};

const formatDateTimeString = (date: string, time: string) =>
  `${date}T${time.length === 1 ? '0' + time : time}:00:00Z`;

const generateDateTimeString = (date: string, time: string) => {
  if (typeof date !== 'string') {
    return '';
  }
  if (date && time) {
    return formatDateTimeString(date, time);
  }
  return date;
};

const formatDate = (date: Date) =>
  date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24-hour format
    timeZoneName: 'long',
  });

const toTimeStamp = (date: Date): number => {
  const formattedDate = date.toLocaleString('en-US', {
    timeZone: 'UTC',
  });
  const timStampformat = (date: Date) => new Date(date).getTime();

  const timestamp = timStampformat(new Date(formattedDate));

  return timestamp;
};

// const formatTime = (date: Date) => date.getTime() - (5 * 60 + 30) * 60 * 1000;

const getTimeRange = (
  rangeType: string,
  startDateTime?: DateTimeValue,
  endDateTime?: DateTimeValue
) => {
  const nowDate = new Date();

  let resultDate: Date;
  let props: {
    startDateTimeFormatted?: string;
    startDateTimeStamp?: number;
    endDateTimeFormatted?: string;
    endDateTimeStamp?: number;
  } = {};

  switch (rangeType) {
    case '2': {
      // Last Hour
      resultDate = new Date(nowDate);
      resultDate.setHours(nowDate.getHours() - 1); // Subtract 1 hour

      props = {
        startDateTimeFormatted: formatDate(resultDate),
        startDateTimeStamp: toTimeStamp(resultDate),
      };
      return props; // Added return statement to avoid falling through
    }
    case '3': {
      // Last Day
      resultDate = new Date(nowDate);
      resultDate.setDate(nowDate.getDate() - 1); // Subtract 1 day

      props = {
        startDateTimeFormatted: formatDate(resultDate),
        startDateTimeStamp: toTimeStamp(resultDate),
      };
      return props; // Added return statement
    }
    case '4': {
      // Last Week
      resultDate = new Date(nowDate);
      resultDate.setDate(nowDate.getDate() - 7); // Subtract 7 days

      props = {
        startDateTimeFormatted: formatDate(resultDate),
        startDateTimeStamp: toTimeStamp(resultDate),
      };
      return props; // Added return statement
    }
    case '5': {
      // Last Month
      resultDate = new Date(nowDate);
      resultDate.setMonth(nowDate.getMonth() - 1); // Subtract 1 month

      props = {
        startDateTimeFormatted: formatDate(resultDate),
        startDateTimeStamp: toTimeStamp(resultDate),
      };
      return props; // Added return statement
    }
    case '6': {
      // Last Year
      resultDate = new Date(nowDate);
      resultDate.setFullYear(nowDate.getFullYear() - 1); // Subtract 1 year

      props = {
        startDateTimeFormatted: formatDate(resultDate),
        startDateTimeStamp: toTimeStamp(resultDate),
      };
      return props; // Added return statement
    }
    case '7': {
      // Custom Date Range

      if (
        startDateTime?.date !== null &&
        startDateTime?.date !== undefined &&
        startDateTime?.time !== null &&
        startDateTime.time !== undefined
      ) {
        const date = generateDateTimeString(
          startDateTime.date,
          startDateTime.time
        );
        const startDateTimeFormatted = new Date(date);

        props.startDateTimeFormatted = formatDate(startDateTimeFormatted);
        props.startDateTimeStamp = toTimeStamp(startDateTimeFormatted);
      }

      if (
        endDateTime?.date !== null &&
        endDateTime?.date !== undefined &&
        endDateTime?.time !== null &&
        endDateTime.time !== undefined
      ) {
        const date = generateDateTimeString(endDateTime.date, endDateTime.time);
        const endDateTimeFormatted = new Date(date);
        props.endDateTimeFormatted = formatDate(endDateTimeFormatted);
        props.endDateTimeStamp = toTimeStamp(endDateTimeFormatted);
      }
      return props; // Return the accumulated props
    }
    default: {
      return null;
    }
  }
};

const findVulnerabilityByTraceId = (
  treeData: (AssessFileVulnerability & AssessVulnerability)[],
  traceId: string
): (AssessFileVulnerability & AssessVulnerability) | null => {
  if (treeData === null || treeData.length === 0) {
    return null;
  }

  for (const item of treeData) {
    if (item.level === 0 && item.traceId === traceId) {
      return item;
    }
    if (item.child) {
      const found = findVulnerabilityByTraceId(item.child, traceId);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

const customToolTipStyle = {
  tooltip: {
    sx: {
      fontSize: '14px',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      border: '1px solid #454545',
    },
  },
};

const getSeverityColor = (severity: string) => {
  if (severity === undefined) {
    return '';
  }
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'red';
    case 'HIGH':
      return 'orange';
    case 'MEDIUM':
      return 'yellow';
    case 'LOW':
      return 'gray';
    case 'NOTE':
      return 'rgb(220, 220, 220)';
    default:
      return 'rgb(220, 220, 220)';
  }
};
function getGradeColorKey(grade: string) {
  switch (grade) {
    case 'A':
      return 'rgb(174, 205, 67)'; // Green
    case 'B':
      return 'rgb(12, 159, 167)'; // Turquoise
    case 'C':
      return '#f7b600'; // Yellow
    case 'D':
      return 'rgb(247, 138, 49)'; // Orange
    case 'F':
      return 'rgb(229, 5, 0)'; // Red
    default:
      return 'rgb(220, 220, 220)'; // Neutral gray
  }
}
function isOfType<T>(obj: unknown, key: keyof T): obj is T {
  return typeof obj === 'object' && obj !== null && key in obj;
}
function countOwnEntries(obj: unknown): number {
  return obj !== null && typeof obj === 'object'
    ? Object.entries(obj).length
    : 0;
}

function getLibraryNodeByUuid(
  parsedVul: LibParsedVulnerability,
  uuid: string,
  isUnmapped: boolean
): LibraryNode | undefined {
  let matchNode = undefined;
  if (isUnmapped) {
    parsedVul.child.map((node: LibraryNode & { isRootUnmapped?: boolean }) => {
      if (node.isRootUnmapped === true) {
        matchNode = (node.child as unknown as LibraryNode[])?.find(
          (childNode: LibraryNode) => childNode.overview?.hash === uuid
        );
      }
    });
  } else {
    matchNode = parsedVul.child.find(
      (node: LibraryNode) => node.overview?.hash === uuid
    );
  }
  return matchNode;
}

const scaPathUpdate = <T extends CustomLibraryVulnerability | LibraryNode>(
  vul: T
): void => {
  if (vul.level === 1) {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCA_UPDATE_CVE_PATH,
      payload: vul,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }
};

const scaUsageUpdate = <T extends CustomLibraryVulnerability | LibraryNode>(
  vul: T
): void => {
  const hasUsage =
    isOfType<CustomLibraryVulnerability>(vul, 'usage') &&
    vul?.usage?.observations !== undefined &&
    vul?.usage?.observations?.length > 0;

  if (vul.level === 1 && !hasUsage) {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCA_UPDATE_VULNERABILITY_USAGE,
      payload: vul,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }
};

const scaOverviewUpdateForCve = <
  T extends CustomLibraryVulnerability | CVENode,
>(
  vul: T
): void => {
  const isSeverityEmpty = vul.overview?.severityAndMetrics?.length === 0;
  const isVectorEmpty = vul.overview?.vector?.vectors?.length === 0;

  if ((vul.level === 0 && isSeverityEmpty) || isVectorEmpty) {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCA_UPDATE_CVE_OVERVIEW,
      payload: vul,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }
};

const AssessEventsHttpRequestUpdate = (e: AssessVulnerability) => {
  if (e.events?.data[0].child?.length === 0 || !e?.http_request) {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.ASSESS_UPDATE_VULNERABILITY,
      payload: e,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }
};

function formatToLocalDateTime(isoString: string) {
  const date = new Date(isoString);

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${month}/${day}/${year} ${hour}:${minute}${ampm}`;
}

export {
  getCurrentDateTime,
  getCurrentDateString,
  isToday,
  getCurrentHour,
  isEqual,
  isGreaterThan,
  isLessThan,
  isGreaterThanOrEqual,
  isLessThanOrEqual,
  convertTimeFormat,
  getTimeRange,
  findVulnerabilityByTraceId,
  customToolTipStyle,
  getSeverityColor,
  getGradeColorKey,
  isOfType,
  countOwnEntries,
  getLibraryNodeByUuid,
  scaPathUpdate,
  scaUsageUpdate,
  scaOverviewUpdateForCve,
  formatToLocalDateTime,
  AssessEventsHttpRequestUpdate,
};
