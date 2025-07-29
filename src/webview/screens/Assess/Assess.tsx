import React, { useEffect, useState } from 'react';
import { TabGroup } from '../../components/TabGroup';
import { Tab } from '../../components/Tab';
import AssessImg from '../../../../assets/contrast-assess.png';

import VulnerabilityReport from './tabs/VulnerabilityReport/VulnerabilityReport';
import { ContrastAssessLocale, ReducerTypes } from '../../../common/types';
import { useSelector } from 'react-redux';

import { AssessCurrentFile } from './tabs/CurrentFile/AssessCurrentFile';
import ContrastStore from '../../utils/redux/store';

import { setAssessActiveCurrentFile } from '../../utils/redux/slices/assessFilter';
import { AssessFilters } from './tabs/Filters/AssessFilters';
import { Button } from '../../components/Button';
import { webviewPostMessage } from '../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../vscode-extension/utils/constants/commands';
import LibrariesReport from './tabs/LibraryReport/LibraryReport';

function TabViewer({ tabId }: { tabId: number }) {
  switch (tabId) {
    case 1:
      return <AssessFilters />;
    case 2:
      return <AssessCurrentFile />;
    case 3:
      return <VulnerabilityReport />;
    case 4:
      return <LibrariesReport />;
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
  const getPersistFilters = useSelector(
    (state: ReducerTypes) => state.assessFilter.filters
  );
  const fetchBackgroundVulnRunner = useSelector(
    (state: ReducerTypes) => state.assessFilter.backgroundVulnRunner
  );
  const fetchRefreshBackgroundVulnRunnerAcrossIds = useSelector(
    (state: ReducerTypes) =>
      state.assessFilter.refreshBackgroundVulnRunnerAcrossIds
  );
  const [tabId, setTabId] = useState(1);
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Filters', active: tabId === 1 },
    { id: 2, title: 'Current File', active: tabId === 2 },
    { id: 3, title: 'Vulnerability Report', active: tabId === 3 },
    { id: 4, title: 'Library Report', active: tabId === 4 },
  ]);
  const [title, setTitle] = useState('Contrast Assess');
  const [runLocale, setRunLocale] = useState('Run');
  const [runTooltip, setRunTooltip] = useState(
    'Search for vulnerabilities with these filter settings'
  );
  const [runState, setRunState] = useState(true);

  useEffect(() => {
    if (i18nData !== null && i18nData !== undefined) {
      const {
        currentFile,
        filters,
        vulnerabilityReport,
        librariesReport,
        translate,
        buttons,
        tooltips,
      } = i18nData as unknown as ContrastAssessLocale;
      setTabs([
        { ...tabs[0], title: filters?.translate as string },
        { ...tabs[1], title: currentFile?.translate as string },
        { ...tabs[2], title: vulnerabilityReport?.translate as string },
        { ...tabs[3], title: librariesReport?.translate as string },
      ]);
      setRunLocale(buttons?.run?.translate ?? 'Run');
      setRunTooltip(
        tooltips?.assessRun.translate ??
          'Search for vulnerabilities with these filter settings'
      );
      setTitle(translate ?? '');
    }
  }, [i18nData]);

  useEffect(() => {
    if (
      getPersistFilters !== null &&
      getPersistFilters !== undefined &&
      getPersistFilters.responseData !== null &&
      !fetchBackgroundVulnRunner &&
      !fetchRefreshBackgroundVulnRunnerAcrossIds
    ) {
      setRunState(false);
    } else {
      setRunState(true);
    }
  }, [
    getPersistFilters,
    fetchBackgroundVulnRunner,
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

  function handleRun() {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.ASSESS_BACKGROUND_RUNNER,
      payload: true,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
    setTimeout(() => {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY,
        payload: null,
        screen: WEBVIEW_SCREENS.ASSESS,
      });
    }, 400);
  }
  return (
    <div>
      <div className="panel-primary-header">
        <div style={{ fontWeight: 'bold' }}>{title}</div>
        <div className="panel-header-right">
          <Button
            title={runLocale}
            onClick={handleRun}
            id="assess-run"
            isDisable={runState}
            tooltip={runTooltip}
            variant="run"
          ></Button>
          <div className="imgContainer">
            <img src={AssessImg} alt="Assess image is missed" />
          </div>
        </div>
      </div>
      <div className="c-panel c-assess-panel" style={{ marginTop: '10px' }}>
        <div className="c-panel-header" style={{ zIndex: 1 }}>
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

export { ContrastAssess };
