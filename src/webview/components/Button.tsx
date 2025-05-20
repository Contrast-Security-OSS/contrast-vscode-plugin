import React, { FC } from 'react';
import { ButtonProps } from '../../common/types';
import { Tooltip } from '@mui/material';

const Button: FC<ButtonProps> = ({
  onClick,
  title,
  color,
  className = '',
  isDisable = false,
  id,
  tooltip = '',
}) => {
  return (
    <>
      <Tooltip
        title={tooltip ?? ''}
        children={
          <button
            id={id}
            disabled={isDisable}
            className={`custom-button ${color} ${className}`}
            onClick={onClick}
          >
            {title}
          </button>
        }
      ></Tooltip>
    </>
  );
};

export { Button };
