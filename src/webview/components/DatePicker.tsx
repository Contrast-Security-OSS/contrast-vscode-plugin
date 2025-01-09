import React, { FC, useEffect, useRef, useState } from 'react';

interface DatePickerProps {
  id: string;
  value?: string | null;
  onDateChange?: (date: string) => void;
  disabled?: boolean;
  min?: string | null;
  max?: string | null;
}

const DatePicker: FC<DatePickerProps> = ({
  value = '',
  onDateChange,
  disabled = false,
  min = null,
  max = null,
  id,
}) => {
  const [currentValue, setCurrentValue] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (inputRef.current) {
      if (min !== null) {
        inputRef.current.setAttribute('min', min);
      }
      if (max !== null) {
        inputRef.current.setAttribute('max', max);
      }
    }
  }, [min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
    onDateChange?.(e.target.value);
  };

  return (
    <input
      id={id}
      type="date"
      value={currentValue}
      onChange={handleChange}
      disabled={disabled}
      className="date-picker"
      ref={inputRef}
    />
  );
};

export { DatePicker };
