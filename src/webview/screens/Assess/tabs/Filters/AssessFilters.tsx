import React, { useEffect, useState } from 'react';
import {
  ContrastAssessLocale,
  ReducerTypes,
} from '../../../../../common/types';
import { useSelector } from 'react-redux';
import { TabGroup } from '../../../../components/TabGroup';
import { Tab } from '../../../../components/Tab';
import AssessFilterComponent from './tabs/AssessFilterComponent';
import { LibraryFilterComponent } from './tabs/LibraryFilterComponent';

function TabViewer({ tabId }: { tabId: number }) {
  switch (tabId) {
    case 1:
      return <AssessFilterComponent />;
    case 2:
      return <LibraryFilterComponent />;
    case 3:
    default:
      return null;
  }
}

// Main ContrastScan Component
function AssessFilters() {
  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);
  const [tabId, setTabId] = useState(1);
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Vulnerabilities', active: tabId === 1 },
    { id: 2, title: 'Library', active: tabId === 2 },
  ]);

  useEffect(() => {
    if (i18nData !== null && i18nData !== undefined) {
      const { filters } = i18nData as unknown as ContrastAssessLocale;
      setTabs([
        { ...tabs[0], title: filters?.assess?.translate as string },
        { ...tabs[1], title: filters.library?.translate as string },
      ]);
    }
  }, [i18nData]);

  function handleTabChange(id: number) {
    setTabId(id);
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        active: tab.id === id,
      }))
    );
  }

  return (
    <div>
      <div className="c-panel ">
        <div className="c-panel-header">
          <TabGroup onTabChange={handleTabChange}>
            {tabs.map((tab) => (
              <Tab key={tab.id} title={tab.title} isActive={tab.active} />
            ))}
          </TabGroup>
        </div>
        <div style={{ padding: '5px' }}>
          <TabViewer tabId={tabId} />
        </div>
      </div>
    </div>
  );
}

export { AssessFilters };
