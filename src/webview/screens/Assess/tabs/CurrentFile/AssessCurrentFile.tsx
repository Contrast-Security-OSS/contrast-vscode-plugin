import React, { useState } from 'react';
import { FC, useEffect } from 'react';
// import { VulnerabilityReport } from '../../../../components/Scan/Vulnerability/VulnerabilityReport';
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
import { AssessVulnerabilityReport } from '../../../../components/Assess/VulnerabilityReport';

const AssessCurrentFile: FC = () => {
  const getCurrentFileVulFromState = useSelector(
    (state: ReducerTypes) => state.assessFilter.currentFile
  );
  const [fileVul, setFileVul] = useState<ProjectVulnerability[]>([]);

  useEffect(() => {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.ASSESS_GET_CURRENTFILE_VUL,
      payload: null,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }, []);

  useEffect(() => {
    if (getCurrentFileVulFromState?.code === 200) {
      let data = getCurrentFileVulFromState.responseData;
      if (!Array.isArray(data)) {
        data = [data] as ProjectVulnerability[];
      }
      setFileVul(data as ProjectVulnerability[]);
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
        <AssessVulnerabilityReport
          treeData={fileVul}
          onSelect={(e) => {
            if (e !== undefined && e !== null) {
              webviewPostMessage({
                command: WEBVIEW_COMMANDS.ASSESS_OPEN_VULNERABILITY_FILE,
                payload: e,
                screen: WEBVIEW_SCREENS.ASSESS,
              });
            }
          }}
        />
      )}
    </>
  );
};

export { AssessCurrentFile };
