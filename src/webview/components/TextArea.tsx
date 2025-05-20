import React from 'react';

export type TextAreaProps = {
  placeHolder?: string;
  isDisabled?: boolean;
  cols?: number;
  rows?: number;
  onInput?: (e: string) => void;
  value: string;
};
export function TextArea({
  isDisabled = false,
  placeHolder = '',
  cols = 35,
  rows = 7,
  onInput,
  value,
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      cols={cols}
      rows={rows}
      disabled={isDisabled}
      placeholder={placeHolder}
      className="custom-text-area"
      onChange={(e) => onInput?.(e.target.value)}
    ></textarea>
  );
}
