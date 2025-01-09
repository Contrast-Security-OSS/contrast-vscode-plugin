import React, { ReactElement } from 'react';
import { TabGroupProps } from '../../common/types';

export function TabGroup({ onTabChange, children }: TabGroupProps) {
  const handleClick = (id: number) => () => {
    onTabChange(id);
  };

  return (
    <div className="c-tag-group">
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child as ReactElement, {
          onClick: handleClick(index + 1),
        })
      )}
    </div>
  );
}
