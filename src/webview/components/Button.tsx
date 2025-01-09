import React, { FC } from 'react';
import { ButtonProps } from '../../common/types';

const Button: FC<ButtonProps> = ({
  onClick,
  title,
  color,
  className = '',
  isDisable = false,
  id,
}) => {
  return (
    <>
      <button
        id={id}
        disabled={isDisable}
        className={`custom-button ${color} ${className}`}
        onClick={onClick}
      >
        {title}
      </button>
    </>
  );
};

export { Button };
