import React, { useEffect, useState } from 'react';
import { ContrastCheckbox } from '../../../../components/Checkbox';
import {
  FilterData,
  FilterLocale,
  SeverityOptions,
  StatusOptions,
} from '../../../../utils/constant';
import { Button } from '../../../../components/Button';
import { webviewPostMessage } from '../../../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../vscode-extension/utils/constants/commands';
import { useSelector } from 'react-redux';
import {
  FilterSeverity,
  FilterStatus,
  FilterType,
  ReducerTypes,
  SeverityOptionsType,
  StatusOptionsType,
} from '../../../../../common/types';

function Filter() {
  // -------------------- Selectors ----------------------
  const getPersistFilters = useSelector(
    (state: ReducerTypes) => state.scan.filters
  );

  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);
  // --------------------- States -------------------------
  const [severity, updateSeverity] = useState<FilterSeverity>(
    FilterData.severity
  );
  const [status, updateStatus] = useState<FilterStatus>(FilterData.status);
  const [severityOptions, setSeverityOptions] =
    useState<SeverityOptionsType>(SeverityOptions);
  const [statusOptions, setStatusOptions] = useState<StatusOptionsType>([
    ...StatusOptions,
  ]);
  const [filterLocale, updateFilterLocale] = useState(FilterLocale);
  // ------------------- Effects ----------------------------------
  useEffect(() => {
    if (i18nData !== null && 'filter' in i18nData) {
      const { severity, status } = i18nData?.filter;
      const i18nSeverityOptions = severityOptions.map((item, index) => {
        return {
          ...item,
          label: severity?.options?.[index]?.translate ?? item.label,
        };
      });
      const i18nStatusOptions = statusOptions.map((item, index) => {
        return {
          ...item,
          label: status?.options?.[index]?.translate ?? item.label,
        };
      });
      setSeverityOptions(i18nSeverityOptions);
      setStatusOptions(i18nStatusOptions);
      updateFilterLocale(i18nData.filter);
    }
  }, [i18nData]);
  useEffect(() => {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCAN_GET_FILTERS,
      payload: [],
      screen: WEBVIEW_SCREENS.SCAN,
    });
  }, []);
  useEffect(() => {
    if (
      getPersistFilters !== null &&
      getPersistFilters !== undefined &&
      getPersistFilters?.responseData !== null &&
      getPersistFilters?.responseData !== undefined
    ) {
      const { severity, status } = getPersistFilters.responseData as FilterType;
      severityOptions.map((item) => {
        updateSeverity({
          ...severity,
          [item.type]: severity[item.type],
        });
      });
      statusOptions.map((item) => {
        updateStatus({
          ...status,
          [item.type]: status[item.type],
        });
      });
    }
  }, [getPersistFilters]);
  // ------------------- Methods ---------------------------------
  const handleModify = (): void => {
    const payload: FilterType = {
      severity,
      status,
    };
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCAN_UPDATE_FILTERS,
      payload: payload,
      screen: WEBVIEW_SCREENS.SCAN,
    });
    handleClear();
  };

  const handleClear = (): void => {
    const updatedSeverity = { ...severity };
    const updatedStatus = { ...status };

    severityOptions.forEach((item) => {
      updatedSeverity[item.type] = false;
    });

    statusOptions.forEach((item) => {
      updatedStatus[item.type] = false;
    });
    updateSeverity(updatedSeverity);
    updateStatus(updatedStatus);
  };

  return (
    <>
      <div style={{ maxWidth: '900px' }}>
        <div className="scan-features">
          <div className="feature">
            <div className="label">{filterLocale.severity.translate}</div>
            <div className="feature-fields">
              {severityOptions.map((item, index) => {
                return (
                  <>
                    <ContrastCheckbox
                      key={index}
                      checked={severity[item.type]}
                      onChange={() =>
                        updateSeverity({
                          ...severity,
                          [item.type]: !severity[item.type],
                        })
                      }
                    >
                      {item.label}
                    </ContrastCheckbox>
                  </>
                );
              })}
            </div>
          </div>
          <div className="feature">
            <div className="label">{filterLocale.status.translate}</div>
            <div className="feature-fields">
              {statusOptions.map((item, index) => {
                return (
                  <ContrastCheckbox
                    key={index}
                    checked={status[item.type]}
                    onChange={() =>
                      updateStatus({
                        ...status,
                        [item.type]: !status[item.type],
                      })
                    }
                  >
                    {item.label}
                  </ContrastCheckbox>
                );
              })}
            </div>
          </div>
        </div>
        <div className="org-add-update">
          <Button
            id="ok"
            title={filterLocale.buttons.run.translate}
            color="btn-blue"
            onClick={handleModify}
          />
          <Button
            title={filterLocale.buttons.clear.translate}
            className="btn-transparent"
            onClick={handleClear}
          />
        </div>
      </div>
    </>
  );
}
export { Filter };
