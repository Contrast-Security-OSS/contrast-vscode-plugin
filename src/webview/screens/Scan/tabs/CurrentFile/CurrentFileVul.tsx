import React, { useState } from 'react';
import { FC, useEffect } from 'react';
import { VulnerabilityReport } from '../../../../components/Scan/Vulnerability/VulnerabilityReport';
import { webviewPostMessage } from '../../../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../vscode-extension/utils/constants/commands';
import { useSelector } from 'react-redux';
import {
  ProjectVulnerability,
  ReducerTypes,
} from '../../../../../common/types';

const CurrentFileVul: FC = () => {
  const getCurrentFileVulFromState = useSelector(
    (state: ReducerTypes) => state.vulnerability.currentFile
  );
  const [fileVul, setFileVul] = useState<ProjectVulnerability[]>([]);

  useEffect(() => {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL,
      payload: null,
      screen: WEBVIEW_SCREENS.SCAN,
    });
  }, []);

  useEffect(() => {
    if (getCurrentFileVulFromState?.code === 200) {
      setFileVul(
        getCurrentFileVulFromState.responseData as ProjectVulnerability[]
      );
    } else {
      setFileVul([]);
    }
  }, [getCurrentFileVulFromState]);

  return (
    <>
      {fileVul.length === 0 ? (
        <>
          <div className="vul-text-no-data">
            <h1>{getCurrentFileVulFromState?.message}</h1>
          </div>
        </>
      ) : (
        <VulnerabilityReport treeData={fileVul} />
      )}
    </>
  );
};

export { CurrentFileVul };
