import { useEffect, useState } from 'react';
import { getCurrentHour, isToday, isEqual, isLessThan } from '../utils/helper';
import { DateTimeValue, TimeSlotOption } from '../../common/types';
import { availableTimeSlots } from '../utils/constant';

interface DateTimeProps {
  fromDateTime: DateTimeValue;
  toDateTime: DateTimeValue;
  updateFromDateTime: (data: DateTimeValue) => void;
  updateToDateTime: (data: DateTimeValue) => void;
  setToTimeSlot: (data: TimeSlotOption[]) => void;
  setFromTimeSlot: (data: TimeSlotOption[]) => void;
}

export const useDateTime = ({
  fromDateTime,
  toDateTime,
  updateToDateTime,
  setToTimeSlot,
}: DateTimeProps) => {
  const [fromTimeSlotOptions, updateFromTimeSlotOptions] = useState<
    TimeSlotOption[]
  >([]);
  const [toTimeSlotOptions, updateToTimeSlotOptions] = useState<
    TimeSlotOption[]
  >([]);

  // Helper function to filter time slots within a range
  const filterTimeSlotOptionsByRange = (min: number, max: number) =>
    availableTimeSlots.filter(
      (item) => +item.label >= min && +item.label <= max
    );

  useEffect(() => {
    if (fromDateTime.date === null || toDateTime.date === null) {
      return;
    }

    if (isEqual(fromDateTime.date, toDateTime.date)) {
      isToday(fromDateTime.date)
        ? updateFromTimeSlotOptions(
            filterTimeSlotOptionsByRange(0, getCurrentHour())
          )
        : updateFromTimeSlotOptions(filterTimeSlotOptionsByRange(0, 23));
    } else if (isLessThan(fromDateTime.date, toDateTime.date)) {
      isToday(toDateTime.date) && !isToday(fromDateTime.date)
        ? updateFromTimeSlotOptions(filterTimeSlotOptionsByRange(0, 23))
        : updateFromTimeSlotOptions(filterTimeSlotOptionsByRange(0, 23));
    } else {
      updateFromTimeSlotOptions(filterTimeSlotOptionsByRange(0, 23));
    }
  }, [fromDateTime.date]);

  useEffect(() => {
    if (fromDateTime.date === null || toDateTime.date === null) {
      return;
    }
    setToTimeSlot([]);

    if (isEqual(fromDateTime.date, toDateTime.date)) {
      if (isToday(toDateTime.date)) {
        if (fromDateTime.time !== null) {
          updateToTimeSlotOptions(
            filterTimeSlotOptionsByRange(
              parseInt(fromDateTime.time),
              getCurrentHour()
            )
          );
        }
      } else {
        if (fromDateTime.time !== null) {
          updateToTimeSlotOptions(
            filterTimeSlotOptionsByRange(+fromDateTime.time, 23)
          );
        }
      }
    } else if (isLessThan(fromDateTime.date, toDateTime.date)) {
      isToday(toDateTime.date)
        ? updateToTimeSlotOptions(
            filterTimeSlotOptionsByRange(0, getCurrentHour())
          )
        : updateToTimeSlotOptions(filterTimeSlotOptionsByRange(0, 23));
    }
  }, [toDateTime.date, fromDateTime.time]);

  useEffect(() => {
    if (fromDateTime.date === null || toDateTime.date === null) {
      return;
    }

    if (isToday(fromDateTime.date) && !isToday(toDateTime.date)) {
      updateToDateTime({ ...toDateTime, date: fromDateTime.date });
      updateFromTimeSlotOptions(
        filterTimeSlotOptionsByRange(0, getCurrentHour())
      );
      updateToTimeSlotOptions(
        filterTimeSlotOptionsByRange(0, getCurrentHour())
      );
    } else if (fromDateTime.date > toDateTime.date) {
      updateToDateTime({ ...toDateTime, date: fromDateTime.date });
      updateToTimeSlotOptions(
        filterTimeSlotOptionsByRange(
          fromDateTime.time !== null ? +fromDateTime.time : 0,
          Infinity
        )
      );
    }
  }, [fromDateTime.date]);

  return {
    fromTimeSlotOptions,
    toTimeSlotOptions,
  };
};
