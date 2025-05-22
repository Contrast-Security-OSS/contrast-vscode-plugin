// import { DateTimeValue } from '../../common/types';

import {
  AssessFileVulnerability,
  AssessVulnerability,
  DateTimeValue,
} from '../../common/types';

// import { DateTimeValue } from '../../common/types';

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
};
