import React, { useEffect, useState } from 'react';
import {
  ContrastAssessLocale,
  PassLocalLang,
  ReducerTypes,
} from '../../../../../../common/types';
import {
  LibParsedVulnerability,
  LibraryNode,
} from '../../../../../../vscode-extension/api/model/api.interface';
import { useSelector } from 'react-redux';
import {
  getLibraryNodeByUuid,
  scaPathUpdate,
} from '../../../../../utils/helper';
import FolderIcon from '@mui/icons-material/Folder';
import { webviewPostMessage } from '../../../../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../../vscode-extension/utils/constants/commands';

export function LibraryPath({
  vulnerability,
  translate,
}: {
  translate: PassLocalLang;
  vulnerability: unknown;
}) {
  const [libraryPaths, setLibraryPaths] = useState<
    { path: string; link: string }[]
  >([]);
  const [isPathAvailable, setIsPathAvailable] = useState<boolean>(false);
  const [selectedLibraryNode, setSelectedLibraryNode] =
    useState<LibraryNode | null>(null);

  const scaAllFilesData = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaAllFiles
  );
  const scaAutoRefresh = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaAutoRefresh
  );

  const [properties, setProperties] = useState<{
    noDataFoundLable: string;
    noDataFoundContent: string;
  }>({
    noDataFoundLable: 'No Path found',
    noDataFoundContent:
      'Note: Please check the corresponding manifest files for the selected library.',
  });

  useEffect(() => {
    if (translate !== null && translate !== undefined) {
      const locale = translate as unknown as ContrastAssessLocale;
      const pathData = locale?.librariesReport?.tabs?.path;
      setProperties({
        noDataFoundLable: pathData?.noDataFoundLable ?? 'No Path found',
        noDataFoundContent:
          pathData?.noDataFoundContent ??
          'Note: Please check the corresponding manifest files for the selected library.',
      });
    }
  }, [translate]);

  useEffect(() => {
    if (vulnerability !== null && vulnerability !== undefined) {
      const node = vulnerability as unknown as LibraryNode;
      if (node.level === 1) {
        setSelectedLibraryNode(node);
        setIsPathAvailable(node?.path !== null && node?.path.length > 0);
        setLibraryPaths(node?.path);
      }
    } else {
      setIsPathAvailable(false);
    }
  }, [vulnerability]);

  useEffect(() => {
    if (
      scaAllFilesData !== undefined &&
      scaAllFilesData !== null &&
      scaAllFilesData.responseData !== undefined &&
      scaAllFilesData.responseData !== null
    ) {
      const parsedVulnerability =
        scaAllFilesData.responseData as LibParsedVulnerability;

      if (
        !isPathAvailable &&
        selectedLibraryNode !== null &&
        selectedLibraryNode !== undefined
      ) {
        const resolvedNode = getLibraryNodeByUuid(
          parsedVulnerability,
          selectedLibraryNode?.overview?.hash,
          selectedLibraryNode?.isUnmapped
        );

        if (resolvedNode !== undefined && resolvedNode !== null) {
          const resolvedPaths = resolvedNode?.path ?? [];
          setLibraryPaths(resolvedPaths);
        }
      }
    }
  }, [scaAllFilesData, isPathAvailable, selectedLibraryNode]);

  useEffect(() => {
    if (
      !isPathAvailable &&
      vulnerability !== null &&
      vulnerability !== undefined &&
      scaAutoRefresh !== null
    ) {
      const node = vulnerability as unknown as LibraryNode;
      scaPathUpdate(node);
    }
  }, [isPathAvailable, scaAutoRefresh]);

  return (
    <div className="library-path-container">
      {libraryPaths.length > 0 ? (
        <div className="library-path-links">
          {libraryPaths.map((pathItem, index) => (
            <a
              key={index}
              href="#"
              className="library-path-link"
              onClick={() => {
                if (pathItem !== undefined) {
                  webviewPostMessage({
                    command: WEBVIEW_COMMANDS.SCA_LIBRARY_PATH_REDIRECT,
                    payload: pathItem,
                    screen: WEBVIEW_SCREENS.ASSESS,
                  });
                }
              }}
            >
              <FolderIcon style={{ fontSize: '15px', color: '#FFA500' }} />
              <div>{pathItem.path}</div>
            </a>
          ))}
        </div>
      ) : (
        <div className="library-path-empty">
          <div className="library-path-message">
            {properties.noDataFoundLable}
          </div>
          <div className="library-path-note">
            {properties.noDataFoundContent}
          </div>
        </div>
      )}
    </div>
  );
}
