import React, { ReactNode, useEffect, useState } from 'react';
import { TabGroup } from '../../../../components/TabGroup';
import { Tooltip } from '@mui/material';
import { Tab } from '../../../../components/Tab';

import {
  ContrastAssessLocale,
  CustomLibraryVulnerability,
  PassLocalLang,
  ReducerTypes,
} from '../../../../../common/types';

import { useSelector } from 'react-redux';
import { webviewPostMessage } from '../../../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../vscode-extension/utils/constants/commands';
import { LibraryOverview } from './tabs/LibraryOverview';
import { LibraryHowToFix } from './tabs/LibraryHowToFix';
import { LibraryUsage } from './tabs/LibraryUsage';
import { LibraryTags } from './tabs/LibraryTags';
import { LibraryPath } from './tabs/LibraryPath';

type TabItem = {
  id: number;
  title: string | ReactNode;
  active: boolean;
};

function TabViewer({
  tabId,
  translate,
  vulnerability,
}: {
  tabId: number;
  translate: PassLocalLang;
  vulnerability: unknown;
}) {
  switch (tabId) {
    case 1:
      return (
        <LibraryOverview translate={translate} vulnerability={vulnerability} />
      );
    case 2:
      return (
        <LibraryHowToFix translate={translate} vulnerability={vulnerability} />
      );
    case 3:
      return (
        <LibraryUsage
          vulnerability={vulnerability}
          translate={translate}
        ></LibraryUsage>
      );
    case 4:
      return (
        <LibraryPath
          vulnerability={vulnerability}
          translate={translate}
        ></LibraryPath>
      );
    case 5:
      return (
        <LibraryTags
          vulnerability={vulnerability}
          translate={translate}
        ></LibraryTags>
      );
    default:
      return <></>;
  }
}

function SplitViewLibrariesReport({ activeVul }: { activeVul: unknown }) {
  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);

  const [tabId, setTabId] = useState(1);
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [redirectLocale, setRedirectLocale] = useState('Redirect');

  // 2. Initialize tabs based on activeVul.level if i18nData is not yet available
  useEffect(() => {
    if (activeVul !== null && activeVul !== undefined) {
      const { level } = activeVul as CustomLibraryVulnerability;

      if (level === 1) {
        setTabs([
          { id: 1, title: 'Overview', active: tabId === 1 },
          { id: 2, title: 'How To Fix', active: tabId === 2 },
          { id: 3, title: 'Usage', active: tabId === 3 },
          { id: 4, title: 'Path', active: tabId === 4 },
          {
            id: 5,
            title: (
              <div style={{ padding: '0px 8px' }}>
                <i
                  className="fa fa-tag"
                  aria-hidden="true"
                  style={{ fontSize: '14.4px' }}
                ></i>
              </div>
            ) as unknown as React.ReactNode,
            active: tabId === 5,
          },
        ]);
      } else if (level === 0) {
        setTabs([{ id: 1, title: 'Overview', active: tabId === 1 }]);
      }
    }
    handleTabChange(1);
  }, [activeVul]);

  useEffect(() => {
    if (i18nData) {
      const { librariesReport, tooltips } =
        i18nData as unknown as ContrastAssessLocale;
      const tabData = librariesReport?.tabs;

      setRedirectLocale(tooltips?.redirect?.translate ?? 'Redirect');

      setTabs((prevTabs) =>
        prevTabs.map((item) => {
          const applyTitle = (title: string) => ({ ...item, title });

          switch (item.id) {
            case 1:
              return applyTitle(tabData?.overView?.translate ?? 'Overview');
            case 2:
              return applyTitle(tabData?.howToFix?.translate ?? 'How to Fix');
            case 3:
              return applyTitle(tabData?.usage?.translate ?? 'Usage');
            case 4:
              return applyTitle(tabData?.path?.translate ?? 'Path');
            default:
              return item;
          }
        })
      );
    }
  }, [i18nData, activeVul]);

  function handleTabChange(id: number) {
    setTabId(id);
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        active: tab.id === id,
      }))
    );
  }

  function handleRedirection() {
    const data = activeVul as CustomLibraryVulnerability;
    if (data?.redirectionUrl) {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.ASSESS_REDIRECTION,
        payload: { data: data.redirectionUrl },
        screen: WEBVIEW_SCREENS.ASSESS,
      });
    }
  }

  return (
    <div className="assess-split-panel">
      <div className="assess-split-panel-header">
        <TabGroup onTabChange={handleTabChange}>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              title={tab.title as string}
              isActive={tab.active}
            />
          ))}
        </TabGroup>
        <div className="redirection" onClick={handleRedirection}>
          <Tooltip title={redirectLocale}>
            <i
              className="fa fa-share-square-o"
              style={{ fontSize: '17px' }}
              aria-hidden="true"
            ></i>
          </Tooltip>
        </div>
      </div>
      <div style={{ padding: '5px' }}>
        <TabViewer
          tabId={tabId}
          translate={i18nData}
          vulnerability={activeVul}
        />
      </div>
    </div>
  );
}

export { SplitViewLibrariesReport };
