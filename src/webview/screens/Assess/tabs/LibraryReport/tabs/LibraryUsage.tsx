import React, { useEffect, useMemo, useState } from 'react';
import {
  ContrastAssessLocale,
  LibraryReportUsage,
  PassLocalLang,
  ReducerTypes,
} from '../../../../../../common/types';
import {
  LibParsedVulnerability,
  LibraryNode,
  LibraryUsageObservation,
} from '../../../../../../vscode-extension/api/model/api.interface';
import { useSelector } from 'react-redux';
import {
  customToolTipStyle,
  formatToLocalDateTime,
  getLibraryNodeByUuid,
  scaUsageUpdate,
} from '../../../../../utils/helper';
import { Tooltip } from '@mui/material';

export function LibraryUsage({
  translate,
  vulnerability,
}: {
  translate: PassLocalLang;
  vulnerability: unknown;
}) {
  const vulnerabilitiesList = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaAllFiles
  );

  const scaAutoRefresh = useSelector(
    (state: ReducerTypes) => state.assessFilter.scaAutoRefresh
  );

  const [classSummary, setClassSummary] = useState({
    totalClasses: 0,
    usedClasses: 0,
  });

  const [observations, setObservations] = useState<LibraryUsageObservation[]>(
    []
  );
  const [searchText, setSearchText] = useState('');
  const [hasObservations, setHasObservations] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<LibraryNode | null>(null);

  const [localizedLabels, setLocalizedLabels] = useState<LibraryReportUsage>({
    formFields: {
      classesLoaded: { translate: 'Classes loaded' },
      firstObserved: { translate: 'First Observed' },
      lastObserved: { translate: 'Last Observed' },
      noSearchResults: {
        translate: 'No search results',
      },
    },
  });

  const filteredObservations = useMemo(() => {
    if (!searchText) {
      return observations;
    }
    return observations.filter((item) =>
      String(item.name).toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, observations]);

  useEffect(() => {
    if (translate !== null && translate !== undefined) {
      const locale = translate as unknown as ContrastAssessLocale;
      const usageLabels = locale?.librariesReport?.tabs
        ?.usage as LibraryReportUsage;

      setLocalizedLabels(usageLabels);
    }
  }, [translate]);

  useEffect(() => {
    if (vulnerability !== null && vulnerability !== undefined) {
      const node = vulnerability as LibraryNode;
      setCurrentUuid(node);

      const usage = node?.usage;
      const obs = usage?.observations ?? [];

      if (obs.length > 0) {
        setHasObservations(true);
      }
      setClassSummary({
        totalClasses: usage?.class_count ?? 0,
        usedClasses: usage?.classes_used ?? 0,
      });

      setObservations(obs);
    } else {
      setObservations([]);
    }
  }, [vulnerability]);

  useEffect(() => {
    if (
      vulnerabilitiesList !== undefined &&
      vulnerabilitiesList !== null &&
      vulnerabilitiesList.responseData !== undefined &&
      vulnerabilitiesList.responseData !== null
    ) {
      const parsedVul =
        vulnerabilitiesList.responseData as LibParsedVulnerability;

      if (
        !hasObservations &&
        currentUuid !== null &&
        currentUuid !== undefined
      ) {
        const matchedNode = getLibraryNodeByUuid(
          parsedVul,
          currentUuid.overview.hash,
          currentUuid.isUnmapped
        );

        if (matchedNode !== undefined && matchedNode !== null) {
          const usageData = matchedNode.usage?.observations ?? [];
          if (usageData.length > 0) {
            setObservations(usageData);
          }
          setClassSummary({
            totalClasses: matchedNode.usage?.class_count,
            usedClasses: matchedNode.usage?.classes_used,
          });
        }
      }
    }
  }, [vulnerabilitiesList, hasObservations, currentUuid]);

  useEffect(() => {
    if (
      !hasObservations &&
      vulnerability !== null &&
      vulnerability !== undefined &&
      scaAutoRefresh !== null
    ) {
      const node = vulnerability as unknown as LibraryNode;
      scaUsageUpdate(node);
    }
  }, [hasObservations, scaAutoRefresh]);

  return (
    <div className="library-usage">
      <div className="search">
        <div className="prevIcon">
          <i className="fa fa-search" aria-hidden="true" />
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div className="nextIcon">
          {searchText.length > 0 && (
            <i
              className="fa fa-times clear"
              aria-hidden="true"
              onClick={() => setSearchText('')}
            />
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="org-table">
          <thead>
            <tr>
              <th>
                {localizedLabels.formFields?.classesLoaded.translate}{' '}
                <span>
                  {classSummary.usedClasses} / {classSummary.totalClasses}
                </span>
              </th>
              <th>{localizedLabels.formFields?.firstObserved.translate}</th>
              <th>{localizedLabels.formFields?.lastObserved.translate}</th>
            </tr>
          </thead>
          <tbody>
            {filteredObservations.length > 0 ? (
              filteredObservations.map((row, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'left' }}>
                    <Tooltip
                      title={
                        row?.name !== undefined && row.name.length > 25
                          ? row.name
                          : ''
                      }
                      slotProps={customToolTipStyle}
                      placement="bottom-start"
                    >
                      <span>{row.name}</span>
                    </Tooltip>
                  </td>
                  <td>
                    <Tooltip
                      title={
                        row?.firstObservedTime !== undefined &&
                        row.firstObservedTime.length > 25
                          ? row.firstObservedTime
                          : ''
                      }
                      slotProps={customToolTipStyle}
                      placement="bottom-start"
                    >
                      <span>
                        {formatToLocalDateTime(row.firstObservedTime)}
                      </span>
                    </Tooltip>
                  </td>
                  <td>
                    <Tooltip
                      title={
                        row?.lastObservedTime !== undefined &&
                        row.lastObservedTime.length > 25
                          ? row.lastObservedTime
                          : ''
                      }
                      slotProps={customToolTipStyle}
                      placement="bottom-start"
                    >
                      <span>{formatToLocalDateTime(row.lastObservedTime)}</span>
                    </Tooltip>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center' }}>
                  {localizedLabels.formFields?.noSearchResults.translate}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
