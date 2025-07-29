import React, { useEffect, useReducer, useState } from 'react';
import {
  AssessLocale,
  dateRangeFilters,
  FilterData,
  sessionMetaDatas,
  SeverityOptions,
  StatusOptions,
} from '../../../../../utils/constant';
import {
  ContrastDropdown,
  ContrastOption,
} from '../../../../../components/DropDown';
import {
  AssessFilter,
  AssessVulnerabilitiesType,
  BuildNumber,
  ConfiguredProject,
  ContrastAssessLocale,
  CustomSessionMetaData,
  CustomSessionSystemProperty,
  CustomSessionSystemValue,
  DateRangeOption,
  DateTimeValue,
  FilterSeverity,
  FilterStatus,
  MostRecentMetaData,
  ReducerTypes,
  Server,
  SeverityOptionsType,
  StatusOptionsType,
  TimeSlotOption,
} from '../../../../../../common/types';
import { Button } from '../../../../../components/Button';
import { ContrastCheckbox } from '../../../../../components/Checkbox';
import { DatePicker } from '../../../../../components/DatePicker';
import {
  convertTimeFormat,
  getTimeRange,
  getCurrentDateString,
} from '../../../../../utils/helper';
import { useSelector } from 'react-redux';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../../../../vscode-extension/utils/constants/commands';
import { webviewPostMessage } from '../../../../../utils/postMessage';
import { RadioGroup } from '../../../../../components/RadioGroup';
import { useDateTime } from '../../../../../hooks/useDateTime';
import ContrastStore from '../../../../../utils/redux/store';
import {
  getAssessEnvironmentsList,
  getAssessTagsList,
  getBuildNumber,
  getCustomSessionMetaData,
  getMostRecentMetaData,
  getServerListbyOrgId,
} from '../../../../../utils/redux/slices/assessFilter';

interface ApplicationEventRes {
  value: string | string[];
  additionalProps?: string | object;
}
const initialState = {
  application: true,
  server: true,
  buildNumber: true,
  environments: true,
  tags: true,
  dateTime: true,
  noneSessionMetaData: true,
  customSessionMetaData: true,
  mostRecentSessionData: true,
};

type FieldKeys = keyof typeof initialState;
type Action = { key: FieldKeys; value: boolean };

function AssessFilterComponent() {
  // ----------- useSelector -----------------
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
  const fetchConfiguredApplications = useSelector(
    (state: ReducerTypes) => state.assessFilter.configuredApplications
  );

  const fetchServerListByOrgId = useSelector(
    (state: ReducerTypes) => state.assessFilter.serverListbyOrgId
  );

  const fetchBuildNumber = useSelector(
    (state: ReducerTypes) => state.assessFilter.buildNumber
  );

  const fetchEnvironments = useSelector(
    (state: ReducerTypes) => state.assessFilter.assessEnvironments
  );

  const fetchTags = useSelector(
    (state: ReducerTypes) => state.assessFilter.assessTags
  );

  const fetchCustomSessionMetaData = useSelector(
    (state: ReducerTypes) => state.assessFilter.customSessionMetaData
  );

  const fetchMostRecentMetaData = useSelector(
    (state: ReducerTypes) => state.assessFilter.mostRecentMetaData
  );
  // -----------  useStates ----------------

  const [filterLocale, updateFilterLocale] = useState(AssessLocale);

  const [applicationList, setApplicationList] = useState<ConfiguredProject[]>(
    []
  );
  const [serverList, setServerList] = useState<Server[]>([]);
  const [buildNumberList, setBuildNumberList] = useState<BuildNumber[]>([]);
  const [tagsList, setTagsList] = useState<BuildNumber[]>([]);
  const [environmentList, setEnvironmentsList] = useState<BuildNumber[]>([]);
  const [sessionMetaData, setSessionMetaData] = useReducer(
    (
      state: typeof sessionMetaDatas,
      action: {
        type: 'entire' | 'specfic';
        id?:
          | 'none-radio'
          | 'custom-session-radio'
          | 'most-recent-session-radio';
        isDisabled?: boolean;
        newState?: typeof sessionMetaDatas;
      }
    ) => {
      switch (action.type) {
        case 'entire': {
          return action.newState ?? state;
        }
        case 'specfic': {
          if (action.id === null) {
            return state;
          }

          return state.map((item) =>
            item.id === action.id
              ? { ...item, isDisabled: action.isDisabled }
              : item
          );
        }
        default:
          return state;
      }
    },
    sessionMetaDatas
  );

  const [activeApplication, setActiveApplication] = useState<string>('');
  const [currentApplication, cloneCurrentApplication] =
    useState<ApplicationEventRes>();
  const [activeServer, setActiveServer] = useState<string[]>([]);
  const [activeBuildNumber, setActiveBuildNumber] = useState<string>('');
  const [activeEnvironment, setActiveEnvironment] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeSessionMetadata, setActiveSessionMetadata] = useState('1');
  const [customSessionMetadata, cloneCustomSessionMetadata] =
    useState<CustomSessionMetaData[]>();
  const [defaultSessionMetadata, setDefaultSessionMetadata] = useState<{
    systemProperties: CustomSessionSystemProperty[] | [];
    systemValues: CustomSessionSystemValue[] | [];
  }>({
    systemProperties: [],
    systemValues: [],
  });
  const [activeCustomSessionMetadata, setActiveCustomsSessionMetadata] =
    useState({
      systemProperty: '',
      systemValue: '',
    });

  const [mostRecentMetaData, cloneMostRecentMeteData] = useState('');
  const [defaultMostRecentMetaData, setDefaultMostRecentMetaData] =
    useState('');

  const [areFieldsDisabled, setAreFieldsDisabled] = useReducer(
    (state: typeof initialState, action: Action) => ({
      ...state,
      [action.key]: action.value,
    }),
    initialState
  );

  const [refreshState, setRefreshState] = useState({
    disabled: true,
    fetching: true,
  });

  const [buildClearState, setBuildClearState] = useState({
    disabled: false,
    fetching: true,
  });

  const [runState, setRunState] = useState({
    disabled: true,
    fetching: true,
  });

  const [clearState, setClearState] = useState({
    disabled: false,
    fetching: true,
  });

  // -> servity & status States

  const [severity, updateSeverity] = useState<FilterSeverity>(
    FilterData.severity
  );
  const [status, updateStatus] = useState<FilterStatus>({
    REPORTED: FilterData.status.REPORTED,
    CONFIRMED: FilterData.status.CONFIRMED,
    SUSPICIOUS: FilterData.status.SUSPICIOUS,
    NOT_A_PROBLEM: FilterData.status.NOT_A_PROBLEM,
    REMEDIATED: FilterData.status.REMEDIATED,
    FIXED: FilterData.status.FIXED,
  });
  const [severityOptions, setSeverityOptions] =
    useState<SeverityOptionsType>(SeverityOptions);
  const [statusOptions, setStatusOptions] = useState<StatusOptionsType>([
    ...StatusOptions.filter(
      (item) => !['REOPENED', 'REMEDIATED_AUTO_VERIFIED'].includes(item.type)
    ),
  ]);

  // -> Date Filter States

  const dateRangeOptions: DateRangeOption[] = dateRangeFilters;
  const [activeDateTimeFilter, setActiveDateTimeFilter] = useState('1');
  const [startDateTime, setStartDateTime] = useState<DateTimeValue>({
    date: null,
    time: null,
  });
  const [endDateTime, setEndDateTime] = useState<DateTimeValue>({
    date: null,
    time: null,
  });
  const [startTimeSlotOptions, setStartTimeSlotOptions] = useState<
    TimeSlotOption[]
  >([]);
  const [endTimeSlotOptions, setEndTimeSlotOptions] = useState<
    TimeSlotOption[]
  >([]);
  const [endMinDate, setEndMinDate] = useState<string | null>(null);

  const [dataPersist, setDataPersist] = useState<{
    isPersisiting: boolean;
    data: null | AssessFilter;
  }>({
    isPersisiting: false,
    data: null,
  });

  // ----------------------- Custom Hooks -------------------------
  const { fromTimeSlotOptions, toTimeSlotOptions } = useDateTime({
    fromDateTime: startDateTime,
    toDateTime: endDateTime,
    updateFromDateTime: setStartDateTime,
    updateToDateTime: setEndDateTime,
    setToTimeSlot: setEndTimeSlotOptions,
    setFromTimeSlot: setStartTimeSlotOptions,
  });

  // ------------ useEffect ----------------

  useEffect(() => {
    if (i18nData === null || i18nData === undefined) {
      return;
    }
    const { filters, tooltips, buttons } =
      i18nData as unknown as ContrastAssessLocale;
    if (filters.assess === null) {
      return;
    }

    updateFilterLocale({
      filters,
      buttons,
      tooltips,
    });
    const formFields = filters?.assess?.formFields;
    const i18nSeverityOptions = severityOptions.map((item, index) => {
      return {
        ...item,
        label: formFields?.severity?.options?.[index]?.translate ?? item.label,
      };
    });
    const i18nStatusOptions = statusOptions.map((item, index) => {
      return {
        ...item,
        label: formFields?.status?.options?.[index]?.translate ?? item.label,
      };
    });
    setSeverityOptions(i18nSeverityOptions);
    setStatusOptions(i18nStatusOptions);
    const sessionMetaData = [...sessionMetaDatas];
    sessionMetaData.forEach((meta) => {
      filters.assess?.formFields?.session_metadata?.options?.forEach((item) => {
        if (meta.id === item.name) {
          meta.label = item.translate;
        }
      });
    });

    setSessionMetaData({
      type: 'entire',
      newState: sessionMetaData,
    });
  }, [i18nData]);

  useEffect(() => {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.ASSESS_GET_FILTERS,
      payload: [],
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }, []);

  useEffect(() => {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.GET_CONFIGURED_APPLICATIONS,
      payload: null,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  }, []);

  useEffect(() => {
    if (
      getPersistFilters !== null &&
      getPersistFilters !== undefined &&
      getPersistFilters?.responseData !== null &&
      getPersistFilters?.responseData !== undefined
    ) {
      if (applicationList.length > 0) {
        setDataPersist({
          isPersisiting: true,
          data: getPersistFilters?.responseData as AssessFilter,
        });
        const persist = getPersistFilters?.responseData as AssessFilter;
        const { startDate, endDate, dateFilter, projectId } = persist;

        setActiveApplication(`${projectId}`);
        handleApplicationChange(
          {
            value: `${projectId}`,
            additionalProps: persist,
          },
          0
        );

        setActiveDateTimeFilter((dateFilter as string) ?? '1');
        if (dateFilter === '7') {
          setAreFieldsDisabled({ key: 'dateTime', value: false });
          setStartDateTime({
            date: startDate?.date ?? '',
            time: startDate?.time ?? '',
          });
          setEndDateTime({
            date: endDate?.date ?? '',
            time: endDate?.time ?? '',
          });
          setEndMinDate(startDate?.date ?? '');
        } else {
          setEndMinDate('');
          setAreFieldsDisabled({ key: 'dateTime', value: true });
        }

        let severityData = severity;
        let statusData = status;
        Object.entries(severityData).map(([iterate]) => {
          severityData = {
            ...severityData,
            [iterate]: false,
          };
        });

        Object.entries(statusData).map(([iterate]) => {
          statusData = {
            ...statusData,
            [iterate]: false,
          };
        });

        persist.severities?.split(',').map((item) => {
          severityData = {
            ...severityData,
            [item]: true,
          };
        });

        persist.status?.split(',').map((item) => {
          statusData = {
            ...statusData,
            [item]: true,
          };
        });

        updateStatus(statusData);
        updateSeverity(severityData);
      }
    } else {
      setDataPersist({
        data: null,
        isPersisiting: false,
      });
      clearSessionMetadata();
      setSessionMetaData({
        type: 'specfic',
        id: 'custom-session-radio',
        isDisabled: true,
      });
      setSessionMetaData({
        type: 'specfic',
        id: 'most-recent-session-radio',
        isDisabled: true,
      });
      clearServer();
      clearBuildNumber();
      clearEnvironment();
      clearTags();
      setActiveBuildNumber('');
      setActiveEnvironment([]);
      setActiveServer([]);
      setActiveTags([]);
      updateSeverity(FilterData.severity);
      updateStatus({
        REPORTED: FilterData.status.REPORTED,
        CONFIRMED: FilterData.status.CONFIRMED,
        SUSPICIOUS: FilterData.status.SUSPICIOUS,
        NOT_A_PROBLEM: FilterData.status.NOT_A_PROBLEM,
        REMEDIATED: FilterData.status.REMEDIATED,
        FIXED: FilterData.status.FIXED,
      });

      setActiveDateTimeFilter('1');
      clearDateTime();

      if (applicationList.length > 0) {
        setActiveApplication(`${applicationList[0]?.projectId}`);
        handleApplicationChange(
          {
            value: `${applicationList[0].projectId}`,
            additionalProps: applicationList[0],
          },
          0
        );
      } else {
        setRunState({
          ...runState,
          disabled: true,
        });
        setRefreshState({
          ...refreshState,
          disabled: true,
        });
      }
    }
  }, [getPersistFilters, applicationList]);

  useEffect(() => {
    if (
      fetchConfiguredApplications !== null &&
      fetchConfiguredApplications !== undefined &&
      fetchConfiguredApplications.responseData !== null &&
      (fetchConfiguredApplications.responseData as Array<string>).length > 0
    ) {
      const response =
        fetchConfiguredApplications.responseData as ConfiguredProject[];
      const assessResponse = response.filter(
        (item) => item.source === 'assess'
      );
      setApplicationList(assessResponse);
      setAreFieldsDisabled({ key: 'application', value: false });
      if (assessResponse.length > 0) {
        setRunState({
          ...runState,
          fetching: false,
        });
      }
    } else {
      ContrastStore.dispatch(getServerListbyOrgId(null));
      ContrastStore.dispatch(getBuildNumber(null));
      ContrastStore.dispatch(getAssessEnvironmentsList(null));
      ContrastStore.dispatch(getAssessTagsList(null));
      ContrastStore.dispatch(getCustomSessionMetaData(null));
      ContrastStore.dispatch(getMostRecentMetaData(null));
    }
  }, [fetchConfiguredApplications]);

  useEffect(() => {
    if (
      fetchServerListByOrgId !== null &&
      fetchServerListByOrgId !== undefined &&
      fetchServerListByOrgId.responseData !== null &&
      (fetchServerListByOrgId.responseData as Array<object>).length > 0
    ) {
      const response = fetchServerListByOrgId?.responseData as Server[];
      setServerList(response);
      setAreFieldsDisabled({ key: 'server', value: false });
      if (response.length > 0) {
        if (dataPersist.isPersisiting && dataPersist?.data !== null) {
          const { servers } = dataPersist?.data;
          if (servers !== null && servers !== undefined) {
            setActiveServer(servers as string[]);
          } else {
            setAreFieldsDisabled({ key: 'server', value: true });
            setServerList([]);
            setActiveServer([]);
          }
        } else {
          setActiveServer([`${response[0].server_id}`]);
        }
      }
    } else {
      setServerList([]);
      setActiveServer([]);
    }
  }, [fetchServerListByOrgId]);

  useEffect(() => {
    if (
      fetchBuildNumber !== null &&
      fetchBuildNumber !== undefined &&
      fetchBuildNumber.responseData !== null &&
      (fetchBuildNumber.responseData as Array<object>).length > 0
    ) {
      const response = fetchBuildNumber?.responseData as BuildNumber[];
      setAreFieldsDisabled({ key: 'buildNumber', value: false });
      setBuildNumberList(response);
      if (response.length > 0) {
        if (dataPersist.isPersisiting && dataPersist?.data !== null) {
          const { appVersionTags } = dataPersist?.data;
          if (appVersionTags !== null && appVersionTags !== undefined) {
            const buildNumber = (appVersionTags as Array<string>)[0];
            setActiveBuildNumber(buildNumber);
          } else {
            setAreFieldsDisabled({ key: 'buildNumber', value: true });
            setBuildNumberList([]);
            setActiveBuildNumber('');
          }
        } else {
          setActiveBuildNumber(response[0].keycode);
        }
      }
    } else {
      setBuildNumberList([]);
      setActiveBuildNumber('');
    }
  }, [fetchBuildNumber]);

  useEffect(() => {
    if (
      fetchEnvironments !== null &&
      fetchEnvironments !== undefined &&
      fetchEnvironments.responseData !== null &&
      (fetchEnvironments.responseData as Array<object>).length > 0
    ) {
      const response = fetchEnvironments?.responseData as BuildNumber[];
      setEnvironmentsList(response);
      setAreFieldsDisabled({ key: 'environments', value: false });
      if (response.length > 0) {
        if (dataPersist.isPersisiting && dataPersist?.data !== null) {
          const { environments } = dataPersist?.data;
          if (environments !== null && environments !== undefined) {
            const getEnvironment = environments;
            setActiveEnvironment(getEnvironment);
          } else {
            setAreFieldsDisabled({ key: 'environments', value: true });
            setEnvironmentsList([]);
            setActiveEnvironment([]);
          }
        } else {
          setActiveEnvironment([response[0].keycode]);
        }
      }
    } else {
      setEnvironmentsList([]);
      setActiveEnvironment([]);
    }
  }, [fetchEnvironments, getPersistFilters]);

  useEffect(() => {
    if (
      fetchTags !== null &&
      fetchTags !== undefined &&
      fetchTags.responseData !== null &&
      (fetchTags.responseData as Array<object>).length > 0
    ) {
      const response = fetchTags?.responseData as BuildNumber[];
      setAreFieldsDisabled({ key: 'tags', value: false });
      setTagsList(response);
      if (response.length > 0) {
        if (dataPersist.isPersisiting && dataPersist?.data !== null) {
          const { tags } = dataPersist?.data;
          if (tags !== null && tags !== undefined) {
            const getTags = tags;
            setActiveTags(getTags);
          } else {
            setAreFieldsDisabled({ key: 'tags', value: true });
            setTagsList([]);
            setActiveTags([]);
          }
        } else {
          setActiveTags([response[0].keycode]);
        }
      }
    } else {
      setTagsList([]);
      setActiveTags([]);
    }
  }, [fetchTags]);

  useEffect(() => {
    if (
      fetchCustomSessionMetaData !== null &&
      fetchCustomSessionMetaData !== undefined &&
      fetchCustomSessionMetaData.responseData !== null &&
      (fetchCustomSessionMetaData.responseData as Array<object>).length > 0
    ) {
      const response = fetchCustomSessionMetaData?.responseData as
        | CustomSessionMetaData[]
        | [];
      cloneCustomSessionMetadata(response);

      setSessionMetaData({
        type: 'specfic',
        id: 'custom-session-radio',
        isDisabled: false,
      });

      if (dataPersist.isPersisiting && dataPersist?.data !== null) {
        const persist = dataPersist.data;
        const sessionMetaData = persist.activeSessionMetadata as string;
        handleSessionMetadataChange(sessionMetaData);
      }
    } else {
      setActiveSessionMetadata('1');
      cloneCustomSessionMetadata([]);
      setDefaultSessionMetadata({
        systemProperties: [],
        systemValues: [],
      });
      setActiveCustomsSessionMetadata({
        systemProperty: '',
        systemValue: '',
      });

      setSessionMetaData({
        type: 'specfic',
        id: 'custom-session-radio',
        isDisabled: true,
      });
    }
  }, [fetchCustomSessionMetaData]);

  useEffect(() => {
    if (
      fetchMostRecentMetaData?.code === 200 &&
      fetchMostRecentMetaData !== null &&
      fetchMostRecentMetaData !== undefined &&
      fetchMostRecentMetaData.responseData !== null &&
      (fetchMostRecentMetaData.responseData as Array<object>).length > 0
    ) {
      const response = fetchMostRecentMetaData.responseData as
        | MostRecentMetaData[]
        | [];
      cloneMostRecentMeteData(response[0].agentSessionId);

      setSessionMetaData({
        type: 'specfic',
        id: 'most-recent-session-radio',
        isDisabled: false,
      });
    } else {
      cloneMostRecentMeteData('');
      setActiveSessionMetadata('1');
      setDefaultMostRecentMetaData('');
      setSessionMetaData({
        type: 'specfic',
        id: 'most-recent-session-radio',
        isDisabled: true,
      });
    }

    if (applicationList.length > 0) {
      setBuildClearState({
        ...buildClearState,
        fetching: false,
      });

      setRefreshState({
        ...buildClearState,
        fetching: false,
      });

      setRunState({
        ...runState,
        fetching: false,
      });

      setClearState({
        ...clearState,
        fetching: false,
      });
    }
  }, [fetchMostRecentMetaData]);

  useEffect(() => {
    setApplicationList([]);
    if (applicationList.length > 0) {
      setActiveApplication(applicationList[0]?.projectId as string);
    }
  }, []);

  useEffect(() => {
    if (fromTimeSlotOptions.length > 0) {
      setStartTimeSlotOptions(fromTimeSlotOptions);
      let slot = fromTimeSlotOptions[0].label;
      if (
        dataPersist.data &&
        dataPersist.isPersisiting &&
        dataPersist.data.dateFilter === '7'
      ) {
        slot = dataPersist.data.startDate?.time as string;
      }
      setStartDateTime((prev) => ({
        ...prev,
        time: slot,
      }));
    }
  }, [fromTimeSlotOptions]);

  useEffect(() => {
    if (toTimeSlotOptions.length > 0) {
      setEndTimeSlotOptions(toTimeSlotOptions);
      let slot = toTimeSlotOptions[0].label;
      if (
        dataPersist.data &&
        dataPersist.isPersisiting &&
        dataPersist.data.dateFilter === '7'
      ) {
        slot = dataPersist.data.endDate?.time as string;
      }
      setEndDateTime((prev) => ({
        ...prev,
        time: slot,
      }));
    }
  }, [toTimeSlotOptions]);

  useEffect(() => {
    const updateState = <T extends { disabled: boolean; fetching: boolean }>(
      setState: React.Dispatch<React.SetStateAction<T>>,
      state: T
    ) => {
      setState((prevState) => ({
        ...prevState,
        disabled:
          fetchBackgroundVulnRunner ||
          fetchRefreshBackgroundVulnRunnerAcrossIds ||
          state.fetching,
      }));
    };

    updateState(setRefreshState, refreshState);
    updateState(setRunState, runState);
  }, [
    fetchBackgroundVulnRunner,

    fetchRefreshBackgroundVulnRunnerAcrossIds,
    refreshState.fetching,
    buildClearState.fetching,
    runState.fetching,
    clearState.fetching,
  ]);

  useEffect(() => {
    setAreFieldsDisabled({
      key: 'application',
      value: fetchBackgroundVulnRunner,
    });
  }, [fetchBackgroundVulnRunner, fetchConfiguredApplications]);

  // ------------- Methods ------------------

  const clearServer = () => {
    setActiveServer([]);
    setServerList([]);
  };

  const clearBuildNumber = () => {
    setActiveBuildNumber('');
    setBuildNumberList([]);
  };

  const clearEnvironment = () => {
    setActiveEnvironment([]);
    setEnvironmentsList([]);
  };

  const clearTags = () => {
    setActiveTags([]);
    setTagsList([]);
  };

  const clearSessionMetadata = () => {
    setDefaultSessionMetadata({
      systemProperties: [],
      systemValues: [],
    });
    setActiveCustomsSessionMetadata({
      systemProperty: '',
      systemValue: '',
    });

    setDefaultMostRecentMetaData('');
    setActiveSessionMetadata('1');
  };

  const clearDateTime = () => {
    setStartDateTime({ date: null, time: null });
    setEndDateTime({ date: null, time: null });
    setEndMinDate('');
  };

  const fetchSystemValuesByPropertyId = (propertyId: string) => {
    return customSessionMetadata?.filter((item) => item.id === propertyId);
  };

  const onRefresh = (additionalProps: ConfiguredProject) => {
    if (additionalProps !== undefined) {
      setRefreshState({
        ...refreshState,
        fetching: true,
      });
      setBuildClearState({
        ...buildClearState,
        fetching: true,
      });
      setRunState({
        ...runState,
        fetching: true,
      });
      setClearState({
        ...clearState,
        fetching: true,
      });
      setAreFieldsDisabled({ key: 'server', value: true });
      setAreFieldsDisabled({ key: 'buildNumber', value: true });
      setAreFieldsDisabled({ key: 'environments', value: true });
      setAreFieldsDisabled({ key: 'tags', value: true });
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.GET_SERVER_LIST_BY_ORG_ID,
        payload: additionalProps,
        screen: WEBVIEW_SCREENS.ASSESS,
      });

      webviewPostMessage({
        command: WEBVIEW_COMMANDS.GET_BUILD_NUMBER,
        payload: additionalProps,
        screen: WEBVIEW_SCREENS.ASSESS,
      });

      webviewPostMessage({
        command: WEBVIEW_COMMANDS.GET_ASSESS_ENVIRONMENTS,
        payload: additionalProps,
        screen: WEBVIEW_SCREENS.ASSESS,
      });

      webviewPostMessage({
        command: WEBVIEW_COMMANDS.GET_ASSESS_TAGS,
        payload: additionalProps,
        screen: WEBVIEW_SCREENS.ASSESS,
      });

      webviewPostMessage({
        command: WEBVIEW_COMMANDS.GET_CUSTOM_SESSION_METADATA,
        payload: additionalProps,
        screen: WEBVIEW_SCREENS.ASSESS,
      });

      webviewPostMessage({
        command: WEBVIEW_COMMANDS.GET_MOST_RECENT_METADATA,
        payload: additionalProps,
        screen: WEBVIEW_SCREENS.ASSESS,
      });
    }
  };

  const handleApplicationChange = (
    e: ApplicationEventRes,
    projectChangesCount: number
  ) => {
    setServerList([]);
    setBuildNumberList([]);
    setEnvironmentsList([]);
    setTagsList([]);
    if (projectChangesCount > 0) {
      setDataPersist({
        data: null,
        isPersisiting: false,
      });
    }
    if (e.additionalProps !== undefined) {
      cloneCurrentApplication(e);
      if (projectChangesCount > 0) {
        cloneCustomSessionMetadata([]);
        clearSessionMetadata();
      }
      setSessionMetaData({
        type: 'entire',
        newState: sessionMetaData.map((item) => ({
          ...item,
          isDisabled: item.id !== 'none-radio',
        })),
      });
      onRefresh(e.additionalProps as ConfiguredProject);
    }

    setActiveApplication(e.value as string);
  };

  const handleServerChange = (e: { value: string | string[] }) => {
    setActiveServer(e.value as string[]);
  };

  const handleEnvironmentChange = (e: { value: string | string[] }) => {
    setActiveEnvironment(e.value as string[]);
  };

  const handleTagsChange = (e: { value: string | string[] }) => {
    setActiveTags(e.value as string[]);
  };

  const handleBuildNumberChange = (e: { value: string | string[] }) => {
    setActiveBuildNumber(e.value as string);
  };

  const handleBuildRefreshChange = () => {
    setDataPersist({
      data: null,
      isPersisiting: false,
    });
    setServerList([]);
    setBuildNumberList([]);
    setEnvironmentsList([]);
    setTagsList([]);

    setActiveServer([]);
    setActiveBuildNumber('');
    setActiveEnvironment([]);
    setActiveTags([]);
    cloneCustomSessionMetadata([]);
    clearSessionMetadata();
    if (currentApplication !== undefined) {
      onRefresh(currentApplication?.additionalProps as ConfiguredProject);
    }

    setSessionMetaData({
      type: 'specfic',
      id: 'custom-session-radio',
      isDisabled: true,
    });

    setSessionMetaData({
      type: 'specfic',
      id: 'most-recent-session-radio',
      isDisabled: true,
    });
  };

  const clearReduxData = () => {
    ContrastStore.dispatch(getServerListbyOrgId(null));
    ContrastStore.dispatch(getBuildNumber(null));
    ContrastStore.dispatch(getAssessEnvironmentsList(null));
    ContrastStore.dispatch(getAssessTagsList(null));
    ContrastStore.dispatch(getCustomSessionMetaData(null));
    ContrastStore.dispatch(getMostRecentMetaData(null));
  };

  const handleBuildClearChange = () => {
    setDataPersist({
      data: null,
      isPersisiting: false,
    });
    clearBuildNumber();
    clearServer();
    clearEnvironment();
    clearTags();

    setAreFieldsDisabled({ key: 'buildNumber', value: true });
    setAreFieldsDisabled({ key: 'server', value: true });
    setAreFieldsDisabled({ key: 'environments', value: true });
    setAreFieldsDisabled({ key: 'tags', value: true });
    clearReduxData();
  };

  const handleDateRangeFilterUpdate = (e: { value: string | string[] }) => {
    const value = e.value;
    setActiveDateTimeFilter(value as string);
    if (value === '7') {
      setAreFieldsDisabled({ key: 'dateTime', value: false });
      const currentDate = getCurrentDateString();
      setStartDateTime((prev) => ({ ...prev, date: currentDate, time: null }));
      setEndDateTime((prev) => ({ ...prev, date: currentDate, time: null }));
      setEndMinDate(currentDate);
      return;
    }
    setAreFieldsDisabled({ key: 'dateTime', value: true });

    clearDateTime();
  };

  const handleDateSelectionUpdate = (
    type: 'from' | 'to',
    date: string | null
  ) => {
    if (type === 'from') {
      setStartTimeSlotOptions([]);
      setStartDateTime((prev) => ({ ...prev, date, time: null }));
      setEndMinDate(date);
    } else {
      setEndTimeSlotOptions([]);
      setEndDateTime((prev) => ({ ...prev, date, time: null }));
    }
  };

  const handleTimeSlotSelectionUpdate = (type: 'from' | 'to', time: string) => {
    if (type === 'from') {
      setStartDateTime((prev) => ({ ...prev, time }));
    } else {
      setEndDateTime((prev) => ({ ...prev, time }));
    }
  };

  const handleSystemPropertyChange = (e: { value: string | string[] }) => {
    let systemValue: string = '';
    const sliceSystemValues = fetchSystemValuesByPropertyId(e.value as string);
    if (sliceSystemValues !== undefined && sliceSystemValues?.length > 0) {
      const systemValues: CustomSessionSystemValue[] | [] =
        sliceSystemValues[0].values ?? [];
      setDefaultSessionMetadata({
        ...defaultSessionMetadata,
        systemValues: systemValues,
      });
      systemValue = sliceSystemValues[0].values[0].value ?? '';
    }
    setActiveCustomsSessionMetadata({
      systemProperty: e.value as string,
      systemValue,
    });
  };

  const handleSystemValueChange = (e: { value: string | string[] }) => {
    setActiveCustomsSessionMetadata({
      ...activeCustomSessionMetadata,
      systemValue: e.value as string,
    });
  };
  const handleSessionMetadataChange = (e: string) => {
    setActiveSessionMetadata(e);
    setDefaultMostRecentMetaData('');
    setDefaultSessionMetadata({
      systemProperties: [],
      systemValues: [],
    });
    if (e === '2') {
      let cloneDefaultSessionMetadataState = { ...defaultSessionMetadata };
      let cloneActiveCustomsSessionMetadataState = {
        ...activeCustomSessionMetadata,
      };
      if (customSessionMetadata !== undefined) {
        const sliceSystemProperties = customSessionMetadata.map((item) => {
          return {
            id: item.id,
            label: item.label,
          };
        });
        if (sliceSystemProperties.length > 0) {
          cloneDefaultSessionMetadataState = {
            ...cloneDefaultSessionMetadataState,
            systemProperties: sliceSystemProperties,
          };
          let sliceSystemPropertiesId = sliceSystemProperties[0].id ?? '';
          if (dataPersist.data && dataPersist.isPersisiting) {
            const filtredSystemProperties = sliceSystemProperties.filter(
              (item) =>
                item.id === dataPersist.data?.metadataFilters?.[0]?.fieldID
            );
            if (filtredSystemProperties.length > 0) {
              sliceSystemPropertiesId = filtredSystemProperties[0].id;
            }
          }
          cloneActiveCustomsSessionMetadataState = {
            ...cloneActiveCustomsSessionMetadataState,
            systemProperty: sliceSystemPropertiesId,
          };
          const systemValues = fetchSystemValuesByPropertyId(
            cloneActiveCustomsSessionMetadataState.systemProperty
          ) as CustomSessionMetaData[] | [];
          if (systemValues !== undefined && systemValues.length > 0) {
            cloneDefaultSessionMetadataState = {
              ...cloneDefaultSessionMetadataState,
              systemValues: systemValues[0].values,
            };
            if (cloneDefaultSessionMetadataState.systemValues.length > 0) {
              let systemValue =
                cloneDefaultSessionMetadataState.systemValues[0];
              if (systemValues !== undefined && systemValues.length > 0) {
                if (dataPersist.data && dataPersist.isPersisiting) {
                  const matchValue = dataPersist.data?.metadataFilters?.[0]
                    ?.values?.[0] as string;
                  const filtredSessionMetaDataState =
                    cloneDefaultSessionMetadataState.systemValues.filter(
                      (item) => item.value === matchValue
                    );
                  if (filtredSessionMetaDataState.length > 0) {
                    systemValue = filtredSessionMetaDataState[0];
                  }
                }
              }
              cloneActiveCustomsSessionMetadataState = {
                ...cloneActiveCustomsSessionMetadataState,
                systemValue: systemValue.value as string,
              };
            }
            setDefaultSessionMetadata(cloneDefaultSessionMetadataState);
            setActiveCustomsSessionMetadata(
              cloneActiveCustomsSessionMetadataState
            );
          }
        }
      }
    } else if (e === '3') {
      setDefaultMostRecentMetaData(mostRecentMetaData);
    }
  };

  const handleClearAll = () => {
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.COMMON_MESSAGE,
      payload: {
        data: 'vulnerabilityClear',
        time: Math.random() * 10,
      },
      screen: WEBVIEW_SCREENS.ASSESS,
    });

    setDataPersist({
      data: null,
      isPersisiting: false,
    });
    clearEnvironment();
    clearServer();
    clearBuildNumber();
    clearTags();
    const updatedSeverity = { ...severity };
    const updatedStatus = { ...status };

    severityOptions.forEach((item) => {
      updatedSeverity[item.type] = false;
    });

    statusOptions.forEach((item) => {
      updatedStatus[item.type] = false;
    });

    setActiveEnvironment([]);
    setActiveDateTimeFilter('1');
    setActiveBuildNumber('');
    setActiveServer([]);
    setActiveTags([]);
    updateSeverity(updatedSeverity);
    updateStatus(updatedStatus);

    clearDateTime();
    clearSessionMetadata();
    setAreFieldsDisabled({ key: 'environments', value: true });
    setAreFieldsDisabled({ key: 'server', value: true });
    setAreFieldsDisabled({ key: 'buildNumber', value: true });
    setAreFieldsDisabled({ key: 'tags', value: true });
    setAreFieldsDisabled({ key: 'dateTime', value: true });
    clearReduxData();
  };

  const handleSave = () => {
    if (!currentApplication) {
      return;
    }

    const props = currentApplication.additionalProps as ConfiguredProject;
    const concatSeverityStatus = (data: typeof severity | typeof status) => {
      const result = Object.entries(data)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(',');

      return result.endsWith(',') ? result.slice(0, -1) : result;
    };
    const payload: AssessVulnerabilitiesType & Partial<ConfiguredProject> = {
      id: props.id,
      source: props.source,
      contrastURL: props.contrastURL,
      userName: props.userName,
      organizationId: props.organizationId,
      organizationName: props.organizationName,
      apiKey: props.apiKey,
      projectId: props.projectId,
      minute: props.minute,
      orgId: props.organizationId,
      appId: props.projectId,
      projectName: props.projectName,
      serviceKey: props.serviceKey,
      severities: concatSeverityStatus(severity),
      status: concatSeverityStatus(status),
      dateFilter: activeDateTimeFilter,
      activeSessionMetadata: activeSessionMetadata,
    };

    if (serverList.length > 0 && activeServer.length > 0) {
      payload.servers = activeServer as string[];
    }
    if (environmentList.length > 0 && environmentList.length > 0) {
      payload.environments = activeEnvironment as unknown as string[];
    }
    if (activeTags.length > 0 && activeTags.length > 0) {
      payload.tags = activeTags as string[];
    }
    if (buildNumberList.length > 0 && activeBuildNumber) {
      payload.appVersionTags = [activeBuildNumber as string];
    }

    if (
      activeSessionMetadata === '2' &&
      activeCustomSessionMetadata.systemProperty
    ) {
      const metadataFilter: Record<string, string | string[]> = {
        fieldID: activeCustomSessionMetadata.systemProperty,
      };
      if (activeCustomSessionMetadata.systemValue) {
        metadataFilter.values = [activeCustomSessionMetadata.systemValue];
      }
      payload.metadataFilters = [
        metadataFilter,
      ] as AssessVulnerabilitiesType['metadataFilters'];
    }

    if (activeSessionMetadata === '3' && defaultMostRecentMetaData) {
      payload.agentSessionId = defaultMostRecentMetaData;
    }

    if (activeDateTimeFilter !== '1' && activeDateTimeFilter !== '7') {
      const date = getTimeRange(activeDateTimeFilter);
      payload.startDate = {
        date: startDateTime.date ?? '',
        time: startDateTime.time ?? '',
        timeStamp: date?.startDateTimeStamp ?? 0,
        dateTime: date?.startDateTimeFormatted ?? '',
      };
    }

    if (activeDateTimeFilter !== '1' && activeDateTimeFilter === '7') {
      const date = getTimeRange(
        activeDateTimeFilter,
        startDateTime,
        endDateTime
      );

      payload.startDate = {
        date: startDateTime.date ?? '',
        time: startDateTime.time ?? '',
        timeStamp: date?.startDateTimeStamp ?? 0,
        dateTime: date?.startDateTimeFormatted ?? '',
      };

      payload.endDate = {
        date: endDateTime.date ?? '',
        time: endDateTime.time ?? '',
        timeStamp: date?.endDateTimeStamp ?? 0,
        dateTime: date?.endDateTimeFormatted ?? '',
      };
    }

    webviewPostMessage({
      command: WEBVIEW_COMMANDS.ASSESS_UPDATE_FILTERS,
      payload: payload,
      screen: WEBVIEW_SCREENS.ASSESS,
    });
  };
  // ------------- Render ----------------------
  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="assess-filter-features">
        {/* Application */}
        <div className="feature">
          <div className="label">
            {filterLocale?.filters.assess?.formFields?.application?.translate}
          </div>
          <div className="dropdowns">
            <ContrastDropdown
              id="application"
              value={activeApplication}
              onChange={(e: ApplicationEventRes) => {
                handleApplicationChange(e, 1);
              }}
              isDisabled={areFieldsDisabled.application}
              placeHolder={
                filterLocale?.filters.assess?.formFields?.application
                  ?.placeholder
              }
              hasSearchBox={true}
            >
              {applicationList.map((item: ConfiguredProject, index: number) => {
                return (
                  <ContrastOption
                    id={index.toString()}
                    value={item.projectId ?? ''}
                    additionalProps={item}
                  >
                    {item.projectName}
                  </ContrastOption>
                );
              })}
            </ContrastDropdown>
          </div>
        </div>
        {/* Environments */}
        <div className="feature">
          <div className="label">
            {
              filterLocale?.filters.assess?.formFields?.environments
                ?.noEnvironmentFound?.translate
            }
          </div>
          <div className="dropdowns">
            <ContrastDropdown
              id="environments"
              value={activeEnvironment}
              onChange={(e: { value: string | string[] }) => {
                handleEnvironmentChange(e);
              }}
              placeHolder={
                environmentList.length >= 1
                  ? filterLocale?.filters.assess?.formFields?.environments
                      ?.selectEnvironment?.placeholder
                  : filterLocale?.filters.assess?.formFields?.environments
                      ?.noEnvironmentFound?.placeholder
              }
              isDisabled={areFieldsDisabled.environments}
              hasSearchBox={true}
              isMultiSelect={true}
              isClearable={true}
            >
              {environmentList.map((item, index: number) => {
                return (
                  <ContrastOption
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
        {/* Server */}
        <div className="feature">
          <div className="label">
            {
              filterLocale?.filters.assess?.formFields?.server?.noServerFound
                ?.translate
            }
          </div>
          <div className="dropdowns">
            <ContrastDropdown
              id="server"
              value={activeServer}
              onChange={(e: { value: string | string[] }) => {
                handleServerChange(e);
              }}
              placeHolder={
                serverList.length >= 1
                  ? filterLocale?.filters.assess?.formFields?.server
                      ?.selectServer?.placeholder
                  : filterLocale?.filters.assess?.formFields?.server
                      ?.noServerFound?.placeholder
              }
              isDisabled={areFieldsDisabled.server}
              hasSearchBox={true}
              isMultiSelect={true}
              isClearable={true}
            >
              {serverList.map((item, index: number) => {
                return (
                  <ContrastOption
                    id={index.toString()}
                    value={`${item.server_id}`}
                  >
                    {item.name}
                  </ContrastOption>
                );
              })}
            </ContrastDropdown>
          </div>
        </div>
        {/* DataRange */}
        <div className="feature">
          <div className="label">
            {filterLocale?.filters.assess?.formFields?.Filter?.translate}
          </div>
          <div className="feature-fields">
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
              <div style={{ marginTop: '4px' }}>
                <ContrastDropdown
                  id="dateRange"
                  value={`${activeDateTimeFilter}`}
                  onChange={handleDateRangeFilterUpdate}
                >
                  {dateRangeOptions.map((item) => (
                    <ContrastOption
                      id={`dateRange${item.filterId}`}
                      value={`${item.filterId}`}
                    >
                      {item.label}
                    </ContrastOption>
                  ))}
                </ContrastDropdown>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <table>
                  {['From', 'To'].map((label, index) => (
                    <tbody>
                      <tr>
                        <td>
                          <span style={{ whiteSpace: 'nowrap' }}>
                            {filterLocale?.filters.assess?.formFields?.Filter?.options?.find(
                              (item) => item.name === label
                            )?.translate ?? ''}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '10px',
                            }}
                          >
                            <DatePicker
                              id={`${label.toLowerCase()}Date`}
                              value={
                                index === 0
                                  ? startDateTime.date
                                  : endDateTime.date
                              }
                              max={getCurrentDateString()}
                              min={index === 1 ? endMinDate : undefined}
                              onDateChange={(date) => {
                                handleDateSelectionUpdate(
                                  label.toLowerCase() as 'from' | 'to',
                                  date
                                );
                                setDataPersist({
                                  data: null,
                                  isPersisiting: false,
                                });
                              }}
                              disabled={areFieldsDisabled.dateTime}
                            />
                            <div style={{ width: '75px' }}>
                              <ContrastDropdown
                                id={`${label.toLowerCase()}Slots`}
                                value={
                                  label === 'From'
                                    ? (startDateTime.time ?? '')
                                    : (endDateTime.time ?? '')
                                }
                                onChange={(e: { value: string | string[] }) => {
                                  handleTimeSlotSelectionUpdate(
                                    label.toLowerCase() as 'from' | 'to',
                                    e.value as string
                                  );
                                  setDataPersist({
                                    data: null,
                                    isPersisiting: false,
                                  });
                                }}
                                isDisabled={areFieldsDisabled.dateTime}
                              >
                                {(index === 0
                                  ? startTimeSlotOptions
                                  : endTimeSlotOptions
                                ).map((item) => (
                                  <ContrastOption
                                    id={`${item.slotId}`}
                                    value={item.label}
                                  >
                                    {convertTimeFormat(item.label)}
                                  </ContrastOption>
                                ))}
                              </ContrastDropdown>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  ))}
                </table>
              </div>
            </div>
          </div>
        </div>
        {/* Tags */}
        <div className="feature">
          <div className="label">
            {
              filterLocale?.filters.assess?.formFields?.tags?.noTagFound
                ?.translate
            }
          </div>
          <div className="dropdowns">
            <ContrastDropdown
              id="tags"
              value={activeTags}
              onChange={(e: { value: string | string[] }) => {
                handleTagsChange(e);
              }}
              placeHolder={
                tagsList.length >= 1
                  ? filterLocale?.filters.assess?.formFields?.tags?.selectTag
                      ?.placeholder
                  : filterLocale?.filters.assess?.formFields?.tags?.noTagFound
                      ?.placeholder
              }
              isDisabled={areFieldsDisabled.tags}
              hasSearchBox={true}
              isMultiSelect={true}
              isClearable={true}
            >
              {tagsList.map((item, index: number) => {
                return (
                  <ContrastOption
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
        {/*Severity */}
        <div className="feature">
          <div className="label">
            {filterLocale?.filters.assess?.formFields?.severity?.translate}
          </div>
          <div className="feature-fields" id="severity">
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
        {/* Status */}
        <div className="feature">
          <div className="label">
            {filterLocale?.filters.assess?.formFields?.status?.translate}
          </div>
          <div className="feature-fields" id="status">
            {statusOptions.map((item, index) => {
              return (
                <ContrastCheckbox
                  key={index}
                  checked={status[item.type]}
                  onChange={() =>
                    updateStatus({
                      ...status,
                      [item.type]: !(status[item.type] ?? false),
                    })
                  }
                >
                  {item.label}
                </ContrastCheckbox>
              );
            })}
          </div>
        </div>
        {/* Session Metadata */}
        <div className="feature">
          <div className="label">
            {
              filterLocale?.filters.assess?.formFields?.session_metadata
                ?.translate
            }
          </div>
          <div className="session-metaData">
            <RadioGroup
              data={sessionMetaData}
              onChange={(e: string) => handleSessionMetadataChange(e)}
              value={activeSessionMetadata}
            />
            {activeSessionMetadata === '2' ? (
              <div className="meta-data-dropdowns">
                <div className="dropdowns">
                  <ContrastDropdown
                    id="system-property"
                    value={activeCustomSessionMetadata.systemProperty}
                    onChange={handleSystemPropertyChange}
                    placeHolder="System property"
                  >
                    {defaultSessionMetadata.systemProperties.map((item) => (
                      <ContrastOption id={`${item.id}`} value={`${item.id}`}>
                        {item.label}
                      </ContrastOption>
                    ))}
                  </ContrastDropdown>
                </div>
                <div className="dropdowns">
                  <ContrastDropdown
                    id="system-value"
                    value={activeCustomSessionMetadata.systemValue}
                    onChange={handleSystemValueChange}
                    placeHolder="value"
                  >
                    {defaultSessionMetadata.systemValues.map((item) => (
                      <ContrastOption
                        id={`${item.value}`}
                        value={`${item.value}`}
                      >
                        {item.value}
                      </ContrastOption>
                    ))}
                  </ContrastDropdown>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* BuildNumber */}
        <div className="feature">
          <div className="label">
            {
              filterLocale?.filters.assess?.formFields?.buildNumber
                ?.noBuildNumberFound?.translate
            }
          </div>
          <div className="build-feature">
            <div className="dropdowns">
              <ContrastDropdown
                id="buildNumber"
                value={activeBuildNumber}
                onChange={(e: { value: string | string[] }) => {
                  handleBuildNumberChange(e);
                }}
                placeHolder={
                  buildNumberList.length >= 1
                    ? filterLocale?.filters.assess?.formFields?.buildNumber
                        ?.selectBuildNumber?.placeholder
                    : filterLocale?.filters.assess?.formFields?.buildNumber
                        ?.noBuildNumberFound?.placeholder
                }
                isDisabled={areFieldsDisabled.buildNumber}
                hasSearchBox={true}
                isClearable={true}
              >
                {buildNumberList.map((item, index: number) => {
                  return (
                    <ContrastOption
                      id={index.toString()}
                      value={item.keycode ?? ''}
                    >
                      {item.label}
                    </ContrastOption>
                  );
                })}
              </ContrastDropdown>
            </div>
            <div className="build-btns">
              <Button
                id="refresh"
                title={filterLocale?.buttons?.refresh?.translate ?? 'Refresh'}
                color="btn-blue"
                onClick={() => {
                  handleBuildRefreshChange();
                }}
                isDisable={refreshState.disabled}
                tooltip={
                  filterLocale?.tooltips?.refreshServersAndBuildNumbers
                    .translate ?? ''
                }
              />

              <Button
                id="buildClear"
                title={filterLocale?.buttons?.clear?.translate ?? 'Clear'}
                color="btn-blue"
                onClick={() => handleBuildClearChange()}
                isDisable={buildClearState.disabled}
                tooltip={
                  filterLocale?.tooltips?.clearsServersAndBuildNumbers
                    .translate ?? ''
                }
              />
            </div>
          </div>
        </div>

        <div className="assess-footer">
          <Button
            id="run"
            title={filterLocale?.buttons?.save?.translate ?? 'Save'}
            color="btn-blue"
            onClick={async () => {
              handleSave();
            }}
            isDisable={runState.disabled}
            tooltip={
              filterLocale?.tooltips?.vulnerabilitySave?.translate ??
              'Saves current selected filter'
            }
          />
          <Button
            id="clear"
            title={filterLocale?.buttons?.clear?.translate ?? 'Clear'}
            color="btn-blue"
            onClick={() => {
              handleClearAll();
            }}
            isDisable={clearState.disabled}
            tooltip={
              filterLocale?.tooltips?.vulnerabilityClear?.translate ??
              'Restores to default value'
            }
          />
        </div>
      </div>
    </div>
  );
}

export default AssessFilterComponent;
