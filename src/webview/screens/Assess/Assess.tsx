import React, { useEffect, useState } from 'react';
import { TabGroup } from '../../components/TabGroup';
import { Tab } from '../../components/Tab';
import CachedIcon from '@mui/icons-material/Cached';
import { Tooltip } from '@mui/material';
import AssessImg from '../../../../assets/contrast-assess.png';
import RetrieveVulnerabilties from './tabs/RetrieveVulnerabilities/RetrieveVulnerabilities';
// import CurrentFile from './tabs/CurrentFile/CurrentFile';
import VulnerabilityReport from './tabs/VulnerabilityReport/VulnerabilityReport';
import { ContrastAssessLocale, ReducerTypes } from '../../../common/types';
import { useSelector } from 'react-redux';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../vscode-extension/utils/constants/commands';
import { webviewPostMessage } from '../../utils/postMessage';
import { AssessCurrentFile } from './tabs/CurrentFile/AssessCurrentFile';
import ContrastStore from '../../utils/redux/store';

import { setAssessActiveCurrentFile } from '../../utils/redux/slices/assessFilter';

function TabViewer({ tabId }: { tabId: number }) {
  switch (tabId) {
    case 1:
      return <RetrieveVulnerabilties />;
    case 2:
      return <AssessCurrentFile />;
    case 3:
      return <VulnerabilityReport />;
    default:
      return null;
  }
}

// Main ContrastScan Component
function ContrastAssess() {
  const activeCurrentFile = useSelector(
    (state: ReducerTypes) => state.assessFilter.activeCurrentFile
  );
  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);
  const fetchManualRefreshBackgroundVulnRunner = useSelector(
    (state: ReducerTypes) =>
      state.assessFilter.manualRefreshBackgroundVulnRunner
  );
  const fetchBackgroundVulnRunner = useSelector(
    (state: ReducerTypes) => state.assessFilter.backgroundVulnRunner
  );

  const fetchRefreshBackgroundVulnRunnerAcrossIds = useSelector(
    (state: ReducerTypes) =>
      state.assessFilter.refreshBackgroundVulnRunnerAcrossIds
  );

  const [refreshTooltip, updateTooltip] = useState('Refresh');

  const [refreshState, setRefreshState] = useState(false);

  const [tabId, setTabId] = useState(1);
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Retrieve Vulnerabilities', active: tabId === 1 },
    { id: 2, title: 'Current File', active: tabId === 2 },
    { id: 3, title: 'Vulnerability Report', active: tabId === 3 },
  ]);
  const [title, setTitle] = useState('Contrast Assess');

  useEffect(() => {
    if (i18nData !== null && i18nData !== undefined) {
      const {
        currentFile,
        retrieveVul,
        vulnerabilityReport,
        translate,
        tooltips,
      } = i18nData as unknown as ContrastAssessLocale;
      setTabs([
        { ...tabs[0], title: retrieveVul?.translate as string },
        { ...tabs[1], title: currentFile?.translate as string },
        { ...tabs[2], title: vulnerabilityReport?.translate as string },
      ]);
      setTitle(translate ?? '');
      updateTooltip(tooltips?.refresh?.translate as string);
    }
  }, [i18nData]);

  useEffect(() => {
    if (
      fetchBackgroundVulnRunner === false &&
      fetchManualRefreshBackgroundVulnRunner === false &&
      fetchRefreshBackgroundVulnRunnerAcrossIds === false
    ) {
      setRefreshState(false);
    } else {
      setRefreshState(true);
    }
  }, [
    fetchBackgroundVulnRunner,
    fetchManualRefreshBackgroundVulnRunner,
    fetchRefreshBackgroundVulnRunnerAcrossIds,
  ]);

  useEffect(() => {
    if (activeCurrentFile !== null && activeCurrentFile !== undefined) {
      handleTabChange(2);
      ContrastStore.dispatch(setAssessActiveCurrentFile(null));
    }
  }, [activeCurrentFile]);

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
      command: WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH_BACKGROUND_RUNNER,
      payload: true,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH,
      payload: null,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }

  return (
    <div>
      <div className="panel-primary-header">
        <div style={{ fontWeight: 'bold' }}>{title}</div>
        <div className="imgContainer">
          <img src={AssessImg} alt="Assess image is missed" />
        </div>
      </div>
      <div className="c-assess-panel" style={{ marginTop: '10px' }}>
        <div className="c-assess-panel-header">
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

export { ContrastAssess };
