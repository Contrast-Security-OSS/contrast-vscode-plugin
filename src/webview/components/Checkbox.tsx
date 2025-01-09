/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react';

interface ICheckBox {
  children: React.ReactNode;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const ContrastCheckbox = ({
  children,
  checked,
  onChange,
  disabled = false,
}: ICheckBox) => {
  return (
    <label className={`checkbox ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="checkbox-input "
      />
      <div className="wrapper">
        <div className="control">
          {checked && (
            <div>
              <svg
                className="checked-indicator"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"
                ></path>
              </svg>
            </div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </label>
  );
};

export { ContrastCheckbox };
