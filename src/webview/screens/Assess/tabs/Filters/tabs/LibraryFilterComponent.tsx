import React, { useEffect, useReducer, useState } from 'react';
import {
  ContrastDropdown,
  ContrastOption,
} from '../../../../../components/DropDown';
import { Button } from '../../../../../components/Button';
import {
  AssessFilter,
  AssessVulnerabilitiesType,
  ContrastAssessLocale,
  // FilterOption,
  ReducerTypes,
  ScaFilterOption,
  ScaFiltersTypes,
} from '../../../../../../common/types';
import { useSelector } from 'react-redux';
import { AssessLocale } from '../../../../../utils/constant';
import { webviewPostMessage } from '../../../../../utils/postMessage';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../../vscode-extension/utils/constants/commands';
import { ContrastCheckbox } from '../../../../../components/Checkbox';

const defaultScaFilter: ScaFiltersTypes = {
  appId: '',
  applicationName: '',
  tags: [],
  usage: [],
  licenses: [],
  environments: [],
  servers: [],
  severity: [],
  sort: '',
  quickView: '',
  status: [],
};
const initialState = {
  tag: true,
  libraryUsage: true,
  libraryLicenceType: true,
  environments: true,
  servers: true,
  severity: false,
  sort: false,
  quickView: false,
};
const backgroundProcessInitialState = {
  tag: false,
  libraryUsage: false,
  libraryLicenceType: false,
  environments: false,
  servers: false,
  quickView: false,
};

type FieldKeys = keyof typeof initialState;
type Action = { key: FieldKeys; value: boolean };

type BPS_FieldKeys = keyof typeof backgroundProcessInitialState;
type BPS_Action = { key: BPS_FieldKeys; value: boolean };
function LibraryFilterComponent() {
  // --------------- use selector -----------------------
  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);
  const fetchBackgroundVulnRunner = useSelector(
    (state: ReducerTypes) => state.assessFilter.backgroundVulnRunner
  );
  const {
    environmentsList,
    serversList,
    quickViewList,
    libraryUsageList,
    libraryLicenceList,
    tagList,
    filters,
    scaFilters,
    scaSeverities,
    scaStatus,
  } = useSelector((state: ReducerTypes) => state.assessFilter);

  // --------------- use states -------------------------

  const [filterLocale, updateFilterLocale] = useState(AssessLocale);
  const [tagListState, setTagListState] = useState<Array<ScaFilterOption>>([]);
  const [quickViewListState, setQuickViewListState] = useState<
    Array<ScaFilterOption>
  >([]);
  const [usageListState, setUsageListState] = useState<Array<ScaFilterOption>>(
    []
  );
  const [licensesListState, setLicensesListState] = useState<
    Array<ScaFilterOption>
  >([]);
  const [environmentsListState, setEnvironmentsListState] = useState<
    Array<ScaFilterOption>
  >([]);
  const [serversListState, setServersListState] = useState<
    Array<ScaFilterOption>
  >([]);

  const [librarySeverityOptions, setLibrarySeverityOptions] = useState<
    ScaFilterOption[]
  >([
    { label: 'Critical', keycode: 'CRITICAL', disabled: true },
    { label: 'High', keycode: 'HIGH', disabled: true },
    { label: 'Medium', keycode: 'MEDIUM', disabled: true },
    { label: 'Low', keycode: 'LOW', disabled: true },
    { label: 'Note', keycode: 'Note', disabled: true },
  ]);

  const [libraryStatusOptions, setLibraryStatusOptions] = useState<
    ScaFilterOption[]
  >([
    { label: 'Reported', keycode: 'REPORTED', disabled: true },
    { label: 'Suspicious', keycode: 'SUSPICIOUS', disabled: true },
    { label: 'Confirmed', keycode: 'CONFIRMED', disabled: true },
    { label: 'Not a problem', keycode: 'NOT_A_PROBLEM', disabled: true },
    { label: 'Remediated', keycode: 'REMEDIATED', disabled: true },
    { label: 'Fixed', keycode: 'FIXED', disabled: true },
    {
      label: 'Remediated - Auto-Verified',
      keycode: 'AUTO_REMEDIATED',
      disabled: true,
    },
  ]);

  const [assessFilter, setAssessFilter] = useState<AssessFilter | null>(null);
  const [scaFiltersState, setScaFilters] = useState<ScaFiltersTypes | null>(
    defaultScaFilter
  );
  const [refreshState, setRefreshState] = useState({
    disabled: true,
    fetching: true,
  });
  const [buildClearState] = useState({ disabled: false, fetching: true });
  const [saveState, setSaveState] = useState({
    disabled: true,
    fetching: true,
  });
  const [clearState] = useState({ disabled: false, fetching: true });

  // ------------- use reducer ----------------------
  const [areFieldsDisabled, setAreFieldsDisabled] = useReducer(
    (state: typeof initialState, action: Action) => ({
      ...state,
      [action.key]: action.value,
    }),
    initialState
  );

  const [areFieldsProcessing, setAreFieldsProcessing] = useReducer(
    (state: typeof backgroundProcessInitialState, action: BPS_Action) => ({
      ...state,
      [action.key]: action.value,
    }),
    backgroundProcessInitialState
  );

  // ---------------- use effects --------------------
  useEffect(() => {
    if (i18nData !== null) {
      const { filters } = i18nData as unknown as ContrastAssessLocale;
      const i18nSeverityOptions = librarySeverityOptions.map((item, index) => {
        return {
          ...item,
          label:
            filters.library?.formFields?.severity?.options?.[index]
              ?.translate ?? item.label,
        };
      });

      const i18nStatusOptions = libraryStatusOptions.map((item, index) => {
        return {
          ...item,
          label:
            filters.library?.formFields?.status?.options?.[index]?.translate ??
            item.label,
        };
      });
      setLibrarySeverityOptions(i18nSeverityOptions);
      setLibraryStatusOptions(i18nStatusOptions);
      updateFilterLocale(i18nData as unknown as ContrastAssessLocale);
    }
  }, [i18nData, filters]);

  useEffect(() => {
    if (
      filters !== null &&
      filters !== undefined &&
      filters?.responseData !== null &&
      filters?.responseData !== undefined
    ) {
      const assessFilters = filters.responseData as AssessFilter;
      setAssessFilter(assessFilters);
      setScaFilters((prev) => {
        return {
          ...prev,
          appId: assessFilters.projectId,
          applicationName: assessFilter?.projectName,
        };
      });
      setSaveState({ ...saveState, fetching: false });
      setRefreshState({ ...refreshState, fetching: false });
      callFiltersMethods();
    } else {
      setSaveState({ ...saveState, fetching: true });
      setRefreshState({ ...refreshState, fetching: true });
      setAssessFilter(null);
    }
  }, [filters]);
  useEffect(() => {
    if (scaFilters) {
      const filters = scaFilters as unknown as ScaFiltersTypes;
      setScaFilters((prev) => ({
        ...prev,
        ...filters,
      }));

      setLibrarySeverityOptions(
        librarySeverityOptions.map((item) => ({
          ...item,
          checked: filters.severity?.includes(item.keycode as string) ?? false,
        }))
      );

      setLibraryStatusOptions(
        libraryStatusOptions.map((item) => ({
          ...item,
          checked: filters.status?.includes(item.keycode as string) ?? false,
        }))
      );
    } else {
      setScaFilters((prev) => (prev !== null ? null : prev));
      setLibrarySeverityOptions(
        librarySeverityOptions.map((item) => ({
          ...item,
          checked: false,
          disabled: true,
        }))
      );
      setLibraryStatusOptions(
        libraryStatusOptions.map((item) => ({
          ...item,
          checked: false,
          disabled: true,
        }))
      );
    }
  }, [scaFilters]);

  useEffect(() => {
    if (scaFilters !== null && scaFilters !== undefined) {
      return;
    }

    if (filters?.responseData !== null && filters?.responseData !== undefined) {
      const assessFilter = filters.responseData as AssessVulnerabilitiesType;

      const tags =
        tagListState.length > 0
          ? tagListState
              .filter((item) =>
                assessFilter.tags?.some(
                  (tag) =>
                    tag.toLowerCase().trim() ===
                    (item.keycode?.toLowerCase().trim() ?? '')
                )
              )
              .map((item) => item.keycode as string)
          : [];

      const environments =
        environmentsListState.length > 0
          ? environmentsListState
              .filter((item) =>
                assessFilter.environments?.some(
                  (env) =>
                    env.toLowerCase().trim() ===
                    (item.keycode?.toLowerCase().trim() ?? '')
                )
              )
              .map((item) => item.keycode as string)
          : [];

      const servers =
        serversListState.length > 0
          ? serversListState
              .filter((item) =>
                (assessFilter.servers as string[])?.some(
                  (env) =>
                    env.toLowerCase().trim() ===
                    (item.keycode?.toLowerCase().trim() ?? '')
                )
              )
              .map((item) => item.keycode as string)
          : [];

      setScaFilters({
        ...scaFiltersState,
        tags,
        environments,
        servers,
      });
    }
  }, [
    filters,
    scaFilters,
    tagListState,
    environmentsListState,
    serversListState,
  ]);

  useEffect(() => {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.ASSESS_GET_FILTERS,
      payload: [],
      screen: WEBVIEW_SCREENS.ASSESS,
    });
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCA_GET_FILTERS,
      payload: [],
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }, []);

  useEffect(() => {
    if (
      tagList !== null &&
      tagList !== undefined &&
      tagList?.responseData !== null &&
      tagList?.responseData !== undefined &&
      (tagList?.responseData as Array<string>).length > 0
    ) {
      setTagListState(tagList.responseData as Array<ScaFilterOption>);
      setAreFieldsDisabled({ key: 'tag', value: false });
      setAreFieldsProcessing({ key: 'tag', value: true });
      return;
    }
    setTagListState([]);
    setAreFieldsProcessing({ key: 'tag', value: true });
    setAreFieldsDisabled({ key: 'tag', value: true });
  }, [tagList]);

  useEffect(() => {
    if (
      quickViewList !== null &&
      quickViewList !== undefined &&
      quickViewList?.responseData !== null &&
      quickViewList?.responseData !== undefined &&
      (quickViewList?.responseData as Array<string>).length > 0
    ) {
      const data = (
        quickViewList.responseData as Array<{
          filterType: string;
          name: string;
          count: number;
        }>
      ).map((item) => ({
        count: item.count,
        keycode: item.filterType,
        label: item.name,
      }));

      setQuickViewListState(data as unknown as Array<ScaFilterOption>);

      setAreFieldsDisabled({ key: 'quickView', value: false });
      setAreFieldsProcessing({ key: 'quickView', value: true });
      if (scaFilters !== null && scaFilters !== undefined) {
        return;
      }
      if (
        filters !== null &&
        filters !== undefined &&
        filters.responseData !== null &&
        filters.responseData !== undefined
      ) {
        setScaFilters({
          ...scaFiltersState,
          quickView: data.length > 1 ? data[1].keycode : '',
        });
      }
      return;
    }
    setQuickViewListState([]);
    setAreFieldsProcessing({ key: 'quickView', value: true });
    setAreFieldsDisabled({ key: 'quickView', value: true });
  }, [quickViewList, filters, scaFilters]);

  useEffect(() => {
    if (
      libraryUsageList !== null &&
      libraryUsageList !== undefined &&
      libraryUsageList?.responseData !== null &&
      libraryUsageList?.responseData !== undefined &&
      (libraryUsageList?.responseData as Array<string>).length > 0
    ) {
      setUsageListState(
        libraryUsageList.responseData as Array<ScaFilterOption>
      );
      setAreFieldsDisabled({ key: 'libraryUsage', value: false });
      setAreFieldsProcessing({ key: 'libraryUsage', value: true });
      return;
    }
    setAreFieldsDisabled({ key: 'libraryUsage', value: true });
    setAreFieldsProcessing({ key: 'libraryUsage', value: true });
    setUsageListState([]);
  }, [libraryUsageList]);

  useEffect(() => {
    if (
      libraryLicenceList !== null &&
      libraryLicenceList !== undefined &&
      libraryLicenceList?.responseData !== null &&
      libraryLicenceList?.responseData !== undefined &&
      (libraryLicenceList?.responseData as Array<string>).length > 0
    ) {
      setLicensesListState(
        libraryLicenceList.responseData as Array<ScaFilterOption>
      );
      setAreFieldsDisabled({ key: 'libraryLicenceType', value: false });
      setAreFieldsProcessing({ key: 'libraryLicenceType', value: true });
      return;
    }
    setLicensesListState([]);
    setAreFieldsDisabled({ key: 'libraryLicenceType', value: true });
    setAreFieldsProcessing({ key: 'libraryLicenceType', value: true });
  }, [libraryLicenceList]);

  useEffect(() => {
    if (
      environmentsList !== null &&
      environmentsList !== undefined &&
      environmentsList?.responseData !== null &&
      environmentsList?.responseData !== undefined &&
      (environmentsList?.responseData as Array<string>).length > 0
    ) {
      setEnvironmentsListState(
        environmentsList.responseData as Array<ScaFilterOption>
      );
      setAreFieldsDisabled({ key: 'environments', value: false });
      setAreFieldsProcessing({ key: 'environments', value: true });
      return;
    }
    setEnvironmentsListState([]);
    setAreFieldsDisabled({ key: 'environments', value: true });
    setAreFieldsProcessing({ key: 'environments', value: true });
  }, [environmentsList]);

  useEffect(() => {
    if (
      serversList !== null &&
      serversList !== undefined &&
      serversList?.responseData !== null &&
      serversList?.responseData !== undefined &&
      (serversList?.responseData as Array<string>).length > 0
    ) {
      setServersListState(serversList.responseData as Array<ScaFilterOption>);
      setAreFieldsDisabled({ key: 'servers', value: false });
      setAreFieldsProcessing({ key: 'servers', value: true });
      return;
    }
    setServersListState([]);
    setAreFieldsDisabled({ key: 'servers', value: true });
    setAreFieldsProcessing({ key: 'servers', value: true });
  }, [serversList]);

  const allFieldsDone = Object.values(areFieldsProcessing).every(
    (val) => val === true
  );

  useEffect(() => {
    const updateState = <T extends { disabled: boolean; fetching: boolean }>(
      setState: React.Dispatch<React.SetStateAction<T>>,
      state: T
    ) => {
      setState((prevState) => ({
        ...prevState,
        disabled: fetchBackgroundVulnRunner || state.fetching || !allFieldsDone,
      }));
    };

    updateState(setRefreshState, refreshState);
    updateState(setSaveState, saveState);
  }, [
    fetchBackgroundVulnRunner,
    refreshState.fetching,
    buildClearState.fetching,
    saveState.fetching,
    clearState.fetching,
    areFieldsProcessing,
  ]);

  useEffect(() => {
    const response = scaSeverities?.responseData as
      | ScaFilterOption[]
      | undefined;

    if (Array.isArray(response) && response.length > 0) {
      // Step 1: Set disabled based on whether the SCA response includes the keycode.
      let severityData = librarySeverityOptions.map((item) => {
        const isEnabled = response.some((res) => res.keycode === item.keycode);
        return {
          ...item,
          disabled: !isEnabled,
        };
      });

      if (scaFilters) {
        const scaFilterObj = scaFilters as unknown as ScaFiltersTypes;
        severityData = severityData.map((item) => ({
          ...item,
          checked: scaFilterObj.severity?.includes(item.keycode ?? '') ?? false,
        }));
        setLibrarySeverityOptions(severityData);
        return;
      }

      if (
        filters !== null &&
        filters !== undefined &&
        filters?.responseData !== null &&
        filters?.responseData !== undefined
      ) {
        const assessFilters = filters.responseData as AssessFilter;
        const assessSeverity =
          assessFilters.severities !== undefined
            ? assessFilters.severities.toLowerCase().trim()
            : '';

        severityData = severityData.map((item) => {
          const keycodeLower = item.keycode?.toLowerCase() ?? '';
          return {
            ...item,
            checked: !item.disabled && assessSeverity.includes(keycodeLower),
          };
        });

        setLibrarySeverityOptions(severityData);
      } else {
        setLibrarySeverityOptions(severityData);
      }
    } else {
      setLibrarySeverityOptions(
        librarySeverityOptions.map((item) => ({
          ...item,
          checked: false,
          disabled: true,
        }))
      );
    }
  }, [scaSeverities, scaFilters, filters]);

  useEffect(() => {
    const response = scaStatus?.responseData as ScaFilterOption[] | undefined;

    if (Array.isArray(response) && response.length > 0) {
      let statusData = libraryStatusOptions.map((item) => {
        const isEnabled = response.some((res) => res.keycode === item.keycode);
        return {
          ...item,
          disabled: !isEnabled,
        };
      });

      if (scaFilters) {
        const scaFilterObj = scaFilters as unknown as ScaFiltersTypes;
        statusData = statusData.map((item) => ({
          ...item,
          checked: scaFilterObj.status?.includes(item.keycode ?? '') ?? false,
        }));
        setLibraryStatusOptions(statusData);
        return;
      }
      if (
        filters !== null &&
        filters !== undefined &&
        filters?.responseData !== null &&
        filters?.responseData !== undefined
      ) {
        const assessFilters = filters.responseData as AssessFilter;
        const assessStatus =
          assessFilters.status !== undefined
            ? assessFilters.status.toLowerCase().trim()
            : '';

        statusData = statusData.map((item) => {
          const keycodeLower = item.keycode?.toLowerCase() ?? '';
          return {
            ...item,
            checked: !item.disabled && assessStatus.includes(keycodeLower),
          };
        });
        setLibraryStatusOptions(statusData);
      } else {
        setLibraryStatusOptions(statusData);
      }
    } else {
      setLibraryStatusOptions(
        libraryStatusOptions.map((item) => ({
          ...item,
          checked: false,
          disabled: true,
        }))
      );
    }
  }, [filters, scaFilters, scaStatus]);

  // -------------- functions ------------------------

  function handleFilterset<K extends keyof typeof defaultScaFilter>(
    key: K,
    values: (typeof defaultScaFilter)[K]
  ) {
    setScaFilters((prev) => {
      return {
        ...prev,

        [key]: values,
      };
    });
  }
  function callFiltersMethods() {
    if (assessFilter === undefined || assessFilter === null) {
      return;
    }
    [
      { name: 'environments', command: WEBVIEW_COMMANDS.SCA_ENVIRONMENTS_LIST },
      { name: 'servers', command: WEBVIEW_COMMANDS.SCA_SERVERS_LIST },
      { name: 'quickView', command: WEBVIEW_COMMANDS.SCA_QUICKVIEW_LIST },
      {
        name: 'libraryUsage',
        command: WEBVIEW_COMMANDS.SCA_LIBRARY_USAGE_LIST,
      },
      {
        name: 'libraryLicence',
        command: WEBVIEW_COMMANDS.SCA_LIBRARY_LICENSES_LIST,
      },
      { name: 'tag', command: WEBVIEW_COMMANDS.SCA_TAG_LIST },
      { name: 'severities', command: WEBVIEW_COMMANDS.SCA_SEVERITIES },
      { name: 'status', command: WEBVIEW_COMMANDS.SCA_STATUS },
    ].map((item) => {
      webviewPostMessage({
        command: item.command,
        payload: assessFilter,
        screen: WEBVIEW_SCREENS.ASSESS,
      });
    });
    setSaveState({ ...saveState, fetching: false });
    setRefreshState({ ...refreshState, fetching: false });
  }
  function handleSave() {
    const data = {
      ...scaFiltersState,
      appId: assessFilter?.appId ?? '',
      applicationName: assessFilter?.projectName ?? '',
      severity: librarySeverityOptions
        .filter((item) => item.checked)
        .map((item) => item.keycode),
      status: libraryStatusOptions
        .filter((item) => item.checked)
        .map((item) => item.keycode),
    };
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCA_UPDATE_FILTERS,
      payload: data,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SCA_GET_FILTERS,
      payload: [],
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }
  function handleClear() {
    setScaFilters({
      ...scaFiltersState,
      tags: [],
      environments: [],
      licenses: [],
      servers: [],
      usage: [],
      quickView: '',
    });
  }
  function handleOverallClear() {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.COMMON_MESSAGE,
      payload: {
        data: 'scaClear',
        time: Math.random() * 10,
      },
      screen: WEBVIEW_SCREENS.ASSESS,
    });
    setLibrarySeverityOptions(
      librarySeverityOptions.map((item) => ({
        ...item,
        checked: false,
      }))
    );
    setLibraryStatusOptions(
      libraryStatusOptions.map((item) => ({
        ...item,
        checked: false,
      }))
    );
    setScaFilters({
      ...scaFiltersState,
      tags: [],
      environments: [],
      licenses: [],
      servers: [],
      usage: [],
      severity: [],
      sort: '',
      quickView: '',
    });
  }
  async function handleRefresh() {
    handleClear();
    setTagListState([]);
    setUsageListState([]);
    setLicensesListState([]);
    setEnvironmentsListState([]);
    setServersListState([]);
    setQuickViewListState([]);
    setRefreshState({
      ...refreshState,
      fetching: true,
    });
    setSaveState({
      ...saveState,
      fetching: true,
    });

    await callFiltersMethods();
  }

  return (
    <>
      <div style={{ maxWidth: '900px' }}>
        <div className="library-filter-features">
          {/* Application */}
          <div className="feature">
            <div className="label">
              {
                filterLocale?.filters.library?.formFields?.application
                  ?.translate
              }
            </div>
            <div className="feature-fields">
              {assessFilter?.projectName ?? (
                <span style={{ color: '#F44336' }}>
                  {
                    filterLocale?.filters.library?.formFields?.application
                      ?.placeholder
                  }
                </span>
              )}
            </div>
          </div>
          {/* Environments */}
          <div className="feature">
            <div className="label">
              {
                filterLocale?.filters.library?.formFields?.environments
                  ?.translate
              }
            </div>
            <div className="feature-fields">
              <div className="dropdowns">
                <ContrastDropdown
                  id="environments"
                  value={scaFiltersState?.environments ?? []}
                  onChange={(e: { value: string | string[] }) => {
                    handleFilterset('environments', e.value as string[]);
                  }}
                  isDisabled={areFieldsDisabled.environments}
                  hasSearchBox={true}
                  isMultiSelect={true}
                  isClearable={true}
                  placeHolder={
                    filterLocale?.filters.library?.formFields?.environments
                      ?.placeholder
                  }
                >
                  {environmentsListState.map((item, index: number) => {
                    return (
                      <ContrastOption
                        key={index.toString()}
                        id={index.toString()}
                        value={`${item.keycode}`}
                      >
                        {item.label}
                      </ContrastOption>
                    );
                  })}
                </ContrastDropdown>
              </div>
            </div>
          </div>
          {/* Servers */}
          <div className="feature">
            <div className="label">
              {filterLocale?.filters.library?.formFields?.servers?.translate}
            </div>
            <div className="feature-fields">
              <div className="dropdowns">
                <ContrastDropdown
                  id="servers"
                  value={scaFiltersState?.servers || []}
                  onChange={(e: { value: string | string[] }) => {
                    handleFilterset('servers', e.value as string[]);
                  }}
                  isDisabled={areFieldsDisabled.servers}
                  hasSearchBox={true}
                  isMultiSelect={true}
                  isClearable={true}
                  placeHolder={
                    filterLocale?.filters.library?.formFields?.servers
                      ?.placeholder
                  }
                >
                  {serversListState.map((item, index: number) => {
                    return (
                      <ContrastOption
                        key={index.toString()}
                        id={index.toString()}
                        value={`${item.keycode}`}
                      >
                        {item.label}
                      </ContrastOption>
                    );
                  })}
                </ContrastDropdown>
              </div>
            </div>
          </div>
          {/* Quick View */}
          <div className="feature">
            <div className="label">
              {filterLocale?.filters?.library?.formFields?.quickView?.translate}
            </div>
            <div className="feature-fields">
              <div className="dropdowns">
                <ContrastDropdown
                  id="quickView"
                  value={scaFiltersState?.quickView as string}
                  onChange={(e: { value: string | string[] }) => {
                    handleFilterset('quickView', e.value as string);
                  }}
                  isDisabled={areFieldsDisabled.quickView}
                  hasSearchBox={true}
                  isClearable={true}
                  placeHolder={
                    filterLocale?.filters.library?.formFields?.quickView
                      ?.placeholder
                  }
                >
                  {quickViewListState.map((item, index: number) => {
                    return (
                      <ContrastOption
                        key={index.toString()}
                        id={index.toString()}
                        value={`${item.keycode}`}
                        title={
                          <>
                            {item.label}
                            <span style={{ color: 'gray' }}>
                              ({item.count})
                            </span>
                          </>
                        }
                      >
                        {item.label}
                      </ContrastOption>
                    );
                  })}
                </ContrastDropdown>
              </div>
            </div>
          </div>
          {/* Library Usage */}
          <div className="feature">
            <div className="label">
              {
                filterLocale?.filters.library?.formFields?.libraryUsage
                  ?.translate
              }
            </div>
            <div className="feature-fields">
              <div className="dropdowns">
                <ContrastDropdown
                  id="libraryUsage"
                  value={scaFiltersState?.usage ?? []}
                  onChange={(e: { value: string | string[] }) => {
                    handleFilterset('usage', e.value as string[]);
                  }}
                  isDisabled={areFieldsDisabled.libraryUsage}
                  hasSearchBox={true}
                  isMultiSelect={true}
                  isClearable={true}
                  placeHolder={
                    filterLocale?.filters.library?.formFields?.libraryUsage
                      ?.placeholder
                  }
                >
                  {usageListState.map((item, index: number) => {
                    return (
                      <ContrastOption
                        key={index.toString()}
                        id={index.toString()}
                        value={`${item.keycode}`}
                      >
                        {item.label}
                      </ContrastOption>
                    );
                  })}
                </ContrastDropdown>
              </div>
            </div>
          </div>
          {/* Library Licence Type */}
          <div className="feature">
            <div className="label">
              {
                filterLocale?.filters.library?.formFields?.libraryLicenceType
                  ?.translate
              }
            </div>
            <div className="feature-fields">
              <div className="dropdowns">
                <ContrastDropdown
                  id="libraryLicenceType"
                  value={scaFiltersState?.licenses ?? []}
                  onChange={(e: { value: string | string[] }) => {
                    handleFilterset('licenses', e.value as string[]);
                  }}
                  isDisabled={areFieldsDisabled.libraryLicenceType}
                  hasSearchBox={true}
                  isMultiSelect={true}
                  isClearable={true}
                  placeHolder={
                    filterLocale?.filters.library?.formFields
                      ?.libraryLicenceType?.placeholder
                  }
                >
                  {licensesListState.map((item, index: number) => {
                    return (
                      <ContrastOption
                        key={index.toString()}
                        id={index.toString()}
                        value={`${item.keycode}`}
                      >
                        {item.label}
                      </ContrastOption>
                    );
                  })}
                </ContrastDropdown>
              </div>
            </div>
          </div>
          {/* Tags */}
          <div className="feature">
            <div className="label">
              {filterLocale?.filters?.library?.formFields?.tag?.translate}
            </div>
            <div className="feature-fields">
              <div className="dropdowns">
                <ContrastDropdown
                  id="tag"
                  value={scaFiltersState?.tags || []}
                  onChange={(e: { value: string | string[] }) => {
                    handleFilterset('tags', e.value as string[]);
                  }}
                  isDisabled={areFieldsDisabled.tag}
                  hasSearchBox={true}
                  isMultiSelect={true}
                  isClearable={true}
                  placeHolder={
                    filterLocale?.filters.library?.formFields?.tag?.placeholder
                  }
                >
                  {tagListState.map((item, index: number) => {
                    return (
                      <ContrastOption
                        key={index.toString()}
                        id={index.toString()}
                        value={`${item.keycode}`}
                      >
                        {item.label}
                      </ContrastOption>
                    );
                  })}
                </ContrastDropdown>
              </div>
            </div>
          </div>

          <div className="btn-group-container">
            <div className="btn-group">
              <Button
                id="refresh"
                title={
                  filterLocale.buttons?.refresh?.translate ??
                  'Refresh’s Servers, Quick View, Library Usage, Library Licence type and Tags'
                }
                color="btn-blue"
                onClick={async () => {
                  await handleRefresh();
                }}
                isDisable={refreshState.disabled}
                tooltip={
                  filterLocale.tooltips?.libraryRefresh?.translate ?? 'Refresh'
                }
              />

              <Button
                id="buildClear"
                title={filterLocale.buttons?.clear?.translate ?? 'Clear'}
                color="btn-blue"
                onClick={handleClear}
                tooltip={
                  filterLocale.tooltips?.libraryClear?.translate ??
                  'Clear’s Servers, Quick View, Library Usage, Library Licence type and Tags'
                }
                isDisable={buildClearState.disabled}
              />
            </div>
          </div>
          {/* Severities */}
          <div className="feature">
            <div className="label">
              {filterLocale?.filters.library?.formFields?.severity?.translate}
            </div>
            <div className="feature-fields-checkbox" id="severity">
              {librarySeverityOptions.map((item, index) => (
                <React.Fragment key={index}>
                  <ContrastCheckbox
                    checked={item.checked}
                    disabled={item.disabled}
                    onChange={() => {
                      setLibrarySeverityOptions((prevOptions) =>
                        prevOptions.map((option) =>
                          option.keycode === item.keycode
                            ? { ...option, checked: !(option.checked ?? false) }
                            : option
                        )
                      );
                    }}
                  >
                    {item.label}
                  </ContrastCheckbox>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="feature">
            <div className="label">
              {filterLocale?.filters.library?.formFields?.status?.translate}
            </div>
            <div className="feature-fields-checkbox" id="status">
              {libraryStatusOptions.map((item, index) => (
                <React.Fragment key={index}>
                  <ContrastCheckbox
                    checked={item.checked}
                    disabled={item.disabled}
                    onChange={() => {
                      setLibraryStatusOptions((prevOptions) =>
                        prevOptions.map((option) =>
                          option.keycode === item.keycode
                            ? { ...option, checked: !(option.checked ?? false) }
                            : option
                        )
                      );
                    }}
                  >
                    {item.label}
                  </ContrastCheckbox>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="library-filter-footer">
            <Button
              id="run"
              title={filterLocale.buttons?.save?.translate ?? 'Save'}
              color="btn-blue"
              isDisable={saveState.disabled}
              onClick={handleSave}
              tooltip={
                filterLocale?.tooltips?.vulnerabilitySave?.translate ??
                'Saves current selected filter'
              }
            />
            <Button
              id="clear"
              title={filterLocale.buttons?.clear?.translate ?? 'Clear'}
              color="btn-blue"
              isDisable={clearState.disabled}
              onClick={handleOverallClear}
              tooltip={
                filterLocale?.tooltips?.vulnerabilityClear?.translate ??
                'Restores to default value'
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
export { LibraryFilterComponent };
