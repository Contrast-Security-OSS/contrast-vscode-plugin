import React, { FC } from 'react';
import { InputProps } from '../../common/types';

const Input: FC<InputProps> = ({
  type,
  placeholder = '',
  onChange,
  className = '',
  name,
  value,
  id,
}) => {
  return (
    <>
      <input
        id={id}
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        className={className}
        name={name}
      />
    </>
  );
};

export default Input;
