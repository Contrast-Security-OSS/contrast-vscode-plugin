import React, { useEffect, useState } from 'react';
import { TabGroup } from '../../components/TabGroup';
import { Tab } from '../../components/Tab';
import { Filter } from './tabs/Filter/Filter';
import { useSelector } from 'react-redux';
import { AllVulnerabilityFiles } from './tabs/AllVulnerability/AllVulnerabilityFiles';
import { CurrentFileVul } from './tabs/CurrentFile/CurrentFileVul';
import CachedIcon from '@mui/icons-material/Cached';
import { FilterTabsLocale } from '../../utils/constant';
import { webviewPostMessage } from '../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../vscode-extension/utils/constants/commands';
import { Tooltip } from '@mui/material';
import { ContrastScanLocale, ReducerTypes } from '../../../common/types';
function TabViewer({ tabId }: { tabId: number }) {
  switch (tabId) {
    case 1:
      return <Filter />;
    case 2:
      return <CurrentFileVul />;
    case 3:
      return <AllVulnerabilityFiles />;
    default:
      return null;
  }
}

// Main ContrastScan Component
function ContrastScan() {
  const activeCurrentFile = useSelector(
    (state: ReducerTypes) => state.scan.activeCurrentFile
  );
  const activeVulnerabilityReport = useSelector(
    (state: ReducerTypes) => state.scan.activeVulnerabilityReport
  );

  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);

  const [refreshTooltip, updateTooltip] = useState('Refresh');
  const getAllVulFromState = useSelector(
    (state: ReducerTypes) => state.vulnerability.allFiles
  );

  const [isRefresh, setisRefresh] = useState(true);

  useEffect(() => {
    setisRefresh(true);
  }, [getAllVulFromState]);

  const [tabId, setTabId] = useState(3);
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Filter', active: false },
    { id: 2, title: 'Current File', active: false },
    { id: 3, title: 'Vulnerability Report', active: true },
  ]);
  const [title, setTitle] = useState('Contrast Scan');

  useEffect(() => {
    setTabs((prevTabs) =>
      prevTabs.map((item, index) => ({
        ...item,
        title: FilterTabsLocale[index].translate,
      }))
    );
  }, []);

  useEffect(() => {
    if (i18nData !== null && i18nData !== undefined) {
      const { currentFile, filter, vulnerabilityReport, translate, tooltips } =
        i18nData as ContrastScanLocale;
      setTabs([
        { ...tabs[0], title: filter.translate as string },
        { ...tabs[1], title: currentFile.translate },
        { ...tabs[2], title: vulnerabilityReport.translate },
      ]);
      setTitle(translate);

      updateTooltip(tooltips.refresh.translate);
    }
  }, [i18nData]);

  useEffect(() => {
    if (activeCurrentFile !== null && activeCurrentFile !== undefined) {
      handleTabChange(2);
    }
  }, [activeCurrentFile]);

  useEffect(() => {
    if (
      activeVulnerabilityReport !== null &&
      activeVulnerabilityReport !== undefined
    ) {
      handleTabChange(3);
    }
  }, [activeVulnerabilityReport]);

  function handleTabChange(id: number) {
    setTabId(id);
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        active: tab.id === id,
      }))
    );
  }

  function handleRefresh() {
    if (isRefresh) {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
        payload: null,
        screen: WEBVIEW_SCREENS.SCAN,
      });
      setisRefresh(false);
    }
  }

  return (
    <div>
      <div style={{ fontWeight: 'bold' }}>{title}</div>
      <div className="c-assess-panel">
        <div className="c-assess-panel-header">
          <TabGroup onTabChange={handleTabChange}>
            {tabs.map((tab) => (
              <Tab key={tab.id} title={tab.title} isActive={tab.active} />
            ))}
          </TabGroup>
          <div
            style={{ height: '20px', width: '20px' }}
            onClick={handleRefresh}
          >
            <Tooltip
              title={refreshTooltip}
              children={
                <CachedIcon style={{ cursor: 'pointer' }} fontSize="small" />
              }
            ></Tooltip>
          </div>
        </div>
        <div style={{ padding: '5px' }}>
          <TabViewer tabId={tabId} />
        </div>
      </div>
    </div>
  );
}

export { ContrastScan };
