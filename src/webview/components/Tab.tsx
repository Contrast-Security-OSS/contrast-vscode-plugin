import React from 'react';
import { TabProps } from '../../common/types';
export function Tab({ title, isActive, onClick }: TabProps) {
  return (
    <div onClick={onClick} className="tab">
      <div>{title}</div>
      {isActive === true ? <div className="active-tab"></div> : null}
    </div>
  );
}
