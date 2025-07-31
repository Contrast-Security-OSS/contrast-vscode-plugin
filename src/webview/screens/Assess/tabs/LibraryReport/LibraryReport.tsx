import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  ContrastAssessLocale,
  CustomLibraryVulnerability,
  ReducerTypes,
} from '../../../../../common/types';
import {
  LibParsedVulnerability,
  LibraryNode,
} from '../../../../../vscode-extension/api/model/api.interface';
import { ScaVulnerabilityReport } from '../../../../components/Assess/LibraryVulnerabilityReport';
import { SplitViewLibrariesReport } from './SplitViewLibrariesReport';

import {
  isOfType,
  scaOverviewUpdateForCve,
  scaPathUpdate,
  scaUsageUpdate,
} from '../../../../utils/helper';
import { webviewPostMessage } from '../../../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../vscode-extension/utils/constants/commands';

const isVulnerabilityInList = (
  list: LibParsedVulnerability,
  vul: CustomLibraryVulnerability
): boolean => {
  if (vul === undefined || vul === null) {
    return false;
  }

  const { level, isUnmapped, label, overview, parentMatch } = vul;

  if (level === 1) {
    if (isUnmapped === false) {
      return list.child.some(
        (item) =>
          item.isUnmapped === false &&
          item.label === label &&
          item.overview?.hash === overview?.hash
      );
    }

    if (isUnmapped === true) {
      return list.child.some((item) => {
        const file = item as CustomLibraryVulnerability;

        return (
          file?.isRootUnmapped === true &&
          Array.isArray(file?.child) &&
          (file?.child as unknown as LibraryNode[]).some(
            (childItem) =>
              childItem?.label === label &&
              childItem?.overview?.hash === overview?.hash
          )
        );
      });
    }
  }

  if (level === 0) {
    return (
      list.child
        .find((item) => item.parentMatch === parentMatch)
        ?.child?.some((childItem) => childItem.label === label) ?? false
    );
  }

  return false;
};

function LibrariesReport() {
  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);
  const vulnerabilitiesList = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaAllFiles
  );

  const [i18nFields, updateI18nFields] = useState<string>(
    `<h1>No vulnerabilities found</h1>
     <ol>
      <li>Navigate to the Contrast - Assess menu.</li>
      <li>Select the necessary filters and click the Run button.</li>
      <li>View the results in the Libraries Report tab.</li>
    </ol>
    <p>After retrieving vulnerabilities, return to this screen or click the refresh icon to see the latest vulnerability report.</p>`
  );

  const [allfileVul, setAllFileVul] = useState<LibParsedVulnerability[]>([]);
  const [getSelectedVul, setSelectedVul] = useState<{
    fetching: CustomLibraryVulnerability | null;
  }>({ fetching: null });

  useEffect(() => {
    const data = vulnerabilitiesList?.responseData as LibParsedVulnerability;

    if (data !== undefined && data !== null) {
      setAllFileVul([data]);

      const selected = getSelectedVul.fetching;
      if (selected && !isVulnerabilityInList(data, selected)) {
        setSelectedVul({ fetching: null });
      }
    } else {
      setAllFileVul([]);
      setSelectedVul({ fetching: null });
    }
  }, [vulnerabilitiesList]);

  useEffect(() => {
    if (i18nData !== null && i18nData !== null) {
      const { librariesReport } = i18nData as unknown as ContrastAssessLocale;
      updateI18nFields(librariesReport?.htmlElements?.translate as string);
    }
  }, [i18nData]);

  useEffect(() => {
    if (vulnerabilitiesList === null || vulnerabilitiesList?.code === 400) {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SCA_GET_INITIAL_ALL_FILES_VULNERABILITY,
        payload: null,
        screen: WEBVIEW_SCREENS.ASSESS,
      });
    }
  }, [vulnerabilitiesList]);

  const setStyle = (width: 'full' | 'half') => ({
    width: width === 'full' ? '100%' : '50%',
  });

  const handleVulnerabilitySelect = (vul: CustomLibraryVulnerability) => {
    if (vul.level !== 2 && !isOfType(vul, 'isRootUnmapped')) {
      scaPathUpdate(vul);
      scaUsageUpdate(vul);
      scaOverviewUpdateForCve(vul);
      setSelectedVul({ fetching: vul });
    } else {
      setSelectedVul({ fetching: null });
    }
  };

  return (
    <div className="assess-vul-report">
      <div className="tree-window" style={setStyle('full')}>
        {allfileVul.length === 0 ? (
          <div
            className="vul-text-no-data"
            dangerouslySetInnerHTML={{ __html: i18nFields }}
          />
        ) : (
          <ScaVulnerabilityReport
            treeData={allfileVul}
            onSelect={(vul) => {
              handleVulnerabilitySelect(vul);
            }}
          />
        )}
      </div>

      {getSelectedVul.fetching &&
      allfileVul.length > 0 &&
      allfileVul[0]?.child !== null &&
      allfileVul[0]?.child?.length > 0 ? (
        <div className="split-window">
          <SplitViewLibrariesReport activeVul={getSelectedVul.fetching} />
        </div>
      ) : null}
    </div>
  );
}

export default LibrariesReport;
