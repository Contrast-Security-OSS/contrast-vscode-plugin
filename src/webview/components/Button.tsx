import React, { FC, MouseEventHandler, ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import { ButtonProps } from '../../common/types';

const getVariantClass = (
  variant?: ButtonProps['variant'],
  className?: string
) => {
  const baseClassMap: Record<string, string> = {
    run: 'run-action-button',
  };

  return variant && baseClassMap[variant]
    ? `${baseClassMap[variant]} ${className ?? ''}`.trim()
    : `custom-button ${className ?? ''}`.trim();
};

const getVariantContent = (
  variant?: ButtonProps['variant'],
  title?: string,
  isDisable?: boolean
): ReactNode => {
  switch (variant) {
    case 'run':
      return (
        <div className="run-outline">
          <span className="Icon">
            <PlayArrowOutlinedIcon
              fontSize="medium"
              style={{ color: (isDisable ?? false) ? '#9e9e9e' : '#89d185' }}
            />
          </span>
          <span className="select-container">{title}</span>
        </div>
      );
    default:
      return title;
  }
};

const Button: FC<ButtonProps> = ({
  onClick,
  title,
  color = '',
  className = '',
  isDisable = false,
  id,
  tooltip = '',
  variant,
}) => {
  const buttonClassName = getVariantClass(variant, `${color} ${className}`);

  return (
    <Tooltip title={tooltip}>
      <button
        id={id}
        disabled={isDisable}
        className={buttonClassName}
        onClick={onClick as MouseEventHandler<HTMLButtonElement>}
        tabIndex={0}
      >
        {getVariantContent(variant, title, isDisable)}
      </button>
    </Tooltip>
  );
};

export { Button };
