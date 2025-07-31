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
import ScanImg from '../../../../assets/contrast-scan.png';
import ContrastStore from '../../utils/redux/store';
import { setActiveCurrentFile } from '../../utils/redux/slices/ScanFilter';
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

  const fetchBackgroundVulnRunner = useSelector(
    (state: ReducerTypes) => state.scan.backgroundVulnRunner
  );

  const fetchManualRefreshBackgroundVulnRunner = useSelector(
    (state: ReducerTypes) => state.scan.manualRefreshBackgroundVulnRunner
  );

  const [refreshTooltip, updateTooltip] = useState('Refresh');

  const [refreshState, setRefreshState] = useState(false);

  const [tabId, setTabId] = useState(1);
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Filter', active: true },
    { id: 2, title: 'Current File', active: false },
    { id: 3, title: 'Vulnerability Report', active: false },
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
      ContrastStore.dispatch(setActiveCurrentFile(null));
    }
  }, [activeCurrentFile]);

  useEffect(() => {
    if (
      activeVulnerabilityReport !== null &&
      activeVulnerabilityReport !== undefined
    ) {
      handleTabChange(3);
      ContrastStore.dispatch(setActiveCurrentFile(null));
    }
  }, [activeVulnerabilityReport]);

  useEffect(() => {
    if (
      fetchBackgroundVulnRunner === false &&
      fetchManualRefreshBackgroundVulnRunner === false
    ) {
      setRefreshState(false);
    } else {
      setRefreshState(true);
    }
  }, [fetchBackgroundVulnRunner, fetchManualRefreshBackgroundVulnRunner]);

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
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH_BACKGROUND_RUNNER,
      payload: true,
      screen: WEBVIEW_SCREENS.SCAN,
    });
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
      payload: null,
      screen: WEBVIEW_SCREENS.SCAN,
    });
  }

  return (
    <div>
      <div className="panel-primary-header">
        <div style={{ fontWeight: 'bold' }}>{title}</div>
        <div className="imgContainer">
          <img src={ScanImg} alt="Scan image is missed" />
        </div>
      </div>
      <div className="c-panel" style={{ marginTop: '10px' }}>
        <div className="c-panel-header">
          <TabGroup onTabChange={handleTabChange}>
            {tabs.map((tab) => (
              <Tab key={tab.id} title={tab.title} isActive={tab.active} />
            ))}
          </TabGroup>
          <button className="manual-refresh" disabled={refreshState}>
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
          </button>
        </div>
        <div style={{ padding: '5px' }}>
          <TabViewer tabId={tabId} />
        </div>
      </div>
    </div>
  );
}

export { ContrastScan };
