import React, { useEffect, useState } from 'react';

interface RadioProps {
  id: string;
  value: string;
  optionValue: string | null;
  onChange: (value: string) => void;
  label: string;
  isDisabled?: boolean;
}

interface RadioGroupProps {
  onChange: (value: string) => void;
  data: { id: string; value: string; label: string; isDisabled?: boolean }[];
  value: string;
}

function Radio({
  id,
  value,
  optionValue,
  onChange,
  label,
  isDisabled,
}: RadioProps) {
  const isChecked = optionValue === value;

  return (
    <div className="radio-root radio-root-light">
      <label className="radio-root-control">
        <input
          type="radio"
          name="contrast-radio"
          id={`radio-${id}`}
          value={value}
          checked={isChecked}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
        />
        <span className="checkbox-outer" tabIndex={0}>
          <span
            className={`checkbox-inner ${isChecked ? 'checked' : ''}`}
          ></span>
        </span>
        <span
          className={`radio-label ${isDisabled === true ? 'radio-label-disabled' : ''} `}
        >
          {label}
        </span>
      </label>
    </div>
  );
}

export function RadioGroup({ onChange, data, value }: RadioGroupProps) {
  const [radioValue, setRadioValue] = useState('');

  const handleRadioChange = (evValue: string) => {
    setRadioValue(evValue);
    onChange(evValue);
  };

  useEffect(() => {
    setRadioValue(value);
    onChange(value);
  }, [value]);

  return (
    <div className="radio-group">
      {data.map((item) => (
        <Radio
          id={item.id}
          key={item.id}
          optionValue={radioValue}
          value={item.value}
          onChange={handleRadioChange}
          label={item.label}
          isDisabled={item.isDisabled}
        />
      ))}
    </div>
  );
}
