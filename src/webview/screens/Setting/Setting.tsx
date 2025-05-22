import React, { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import Input from '../../components/Input';
import { ContrastDropdown, ContrastOption } from '../../components/DropDown';
import { useSelector } from 'react-redux';
import OrganizationTable from '../../components/Settings/OrganizationTable';
import {
  WEBVIEW_COMMANDS,
  WEBVIEW_SCREENS,
} from '../../../vscode-extension/utils/constants/commands';
import { Button } from '../../components/Button';
import { settingLocale } from '../../utils/constant';
import { webviewPostMessage } from '../../utils/postMessage';
import {
  PrimaryConfigValidation,
  PrimaryConfig,
  ConfigInputValidation,
  SecondaryConfigValidation,
  SecondaryConfig,
  ConfiguredProject,
  ContrastSettingsLocales,
  ReducerTypes,
  LocalizationJSON,
} from '../../../common/types';
import ContrastStore from '../../utils/redux/store';
import { setCancelStateWhileDelete } from '../../utils/redux/slices/projectsSlice';
import { Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface UnConfiguredProject {
  name: string;
  id: string | number;
}

function ThrowError({ fieldData }: { fieldData: ConfigInputValidation }) {
  return (
    <>
      {Boolean(fieldData.valid) === false && Boolean(fieldData.touched) && (
        <div className="error-message" id="error-message">
          {fieldData.message}
        </div>
      )}
    </>
  );
}

function Setting() {
  // ----------------------- use Selectors -------------------------------------
  const i18nData = useSelector((state: ReducerTypes) => state.i10ln.data);
  const getAllProjectList = useSelector(
    (state: ReducerTypes) => state.project.allProjectList
  );

  const getAllApplicationList = useSelector(
    (state: ReducerTypes) => state.project.allApplicationList
  );

  const deleteResponse = useSelector(
    (state: ReducerTypes) => state.project.configuredProjectDelete
  );

  const cancelStateWhileDelete = useSelector(
    (state: ReducerTypes) => state.project.cancelStateWhileDelete
  );

  const fetchSettingActions = useSelector(
    (state: ReducerTypes) => state.project.settingActions
  );

  const fetchRefreshBackgroundVulnRunnerAcrossIds = useSelector(
    (state: ReducerTypes) =>
      state.assessFilter.refreshBackgroundVulnRunnerAcrossIds
  );

  const fetchScanRetrievelDetectAcrossIds = useSelector(
    (state: ReducerTypes) => state.scan.scanRetrievelDetectAcrossIds
  );

  const getConfiguredProjects = useSelector(
    (state: ReducerTypes) => state.project.configuredProjects
  );

  const addResponse = useSelector(
    (state: ReducerTypes) => state.project.addConfigureProject
  );
  const editResponse = useSelector(
    (state: ReducerTypes) => state.project.updateConfigureProject
  );

  // ------------------------ use States ----------------------------------------

  const [isDisabledSource, setIsDisabledSource] = useState(false);

  const [activeProjectId, cloneActiveProjectId] = useState<string | null>(null);

  const [i18nFields, updateI18nFields] =
    useState<ContrastSettingsLocales>(settingLocale);

  const [actionButton, setActionButton] = useState<number>(0);

  const [listOfProjects, setListOfProjects] = useState<
    [] | UnConfiguredProject[]
  >([]);

  const [configuredProjectsList, updateConfiguredProjectsList] = useState<
    ConfiguredProject[]
  >([]);

  const [commonButton, updateCommonButton] = useState({
    retreive: true,
    save: true,
  });

  const [saveButton, updateSaveButton] = useState(true);

  const [cancelButton, updateCancelButton] = useState(false);

  const [defaultParamterPatch, updateDefaultParamsPatch] = useState(true);

  const [instanceBehaviour, setInstanceBehaviour] = useState(false);

  const [primaryConfigurationParams, setPrimaryConfigurationParams] =
    useState<PrimaryConfig>({
      source: 'assess',
      contrastURL: '',
      userName: '',
      serviceKey: '',
      apiKey: '',
      organizationId: '',
    });

  const [secondaryConfigurationParams, setSecondaryConfigurationParams] =
    useState<Record<string, string>>({
      project: '',
      minute: '1440',
      id: '',
    });

  const [primaryConfigureValidation, setPrimaryConfigureValidation] =
    useState<PrimaryConfigValidation>({
      source: { touched: false, valid: true },
      contrastURL: {
        touched: false,
        valid: true,
        message: i18nFields.errorMessages.contrastURL.required.translate,
      },
      userName: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.userName.required.translate,
      },
      serviceKey: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.serviceKey.required.translate,
      },
      apiKey: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.apiKey.required.translate,
      },
      organizationId: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.organizationId.required.translate,
      },
    });

  const [secondaryConfigureValidation, setSecondaryConfigureValidation] =
    useState<SecondaryConfigValidation>({
      projectName: { touched: false, valid: false },
      minute: {
        touched: false,
        valid: true,
        message: i18nFields.errorMessages.minute.required.translate,
      },
    });

  const [activeConfiguredProject, updateActiveConfiguredProject] =
    useState<ConfiguredProject | null>(null);

  const [deselectRow, updateDeselect] = useState(false);
  // ----------------------- use Effects ----------------------------------

  useEffect(() => {
    if (
      getConfiguredProjects !== null &&
      getConfiguredProjects?.responseData !== null &&
      getConfiguredProjects?.responseData !== undefined &&
      (getConfiguredProjects?.responseData as ConfiguredProject[]).length > 0
    ) {
      const configuredProjects =
        getConfiguredProjects.responseData as ConfiguredProject[];

      updateConfiguredProjectsList(configuredProjects);
      if (defaultParamterPatch === true) {
        const {
          source,
          contrastURL,
          userName,
          serviceKey,
          apiKey,
          organizationId,
        } = configuredProjects[0];
        setPrimaryConfigurationParams({
          source,
          contrastURL,
          userName,
          serviceKey,
          apiKey,
          organizationId,
        });

        setPrimaryConfigureValidation({
          apiKey: {
            ...primaryConfigureValidation.apiKey,
            valid: true,
            touched: true,
          },
          contrastURL: {
            ...primaryConfigureValidation.contrastURL,
            valid: true,
            touched: true,
          },
          organizationId: {
            ...primaryConfigureValidation.organizationId,
            valid: true,
            touched: true,
          },
          serviceKey: {
            ...primaryConfigureValidation.serviceKey,
            valid: true,
            touched: true,
          },
          source: {
            ...primaryConfigureValidation.source,
            valid: true,
            touched: true,
          },
          userName: {
            ...primaryConfigureValidation.userName,
            valid: true,
            touched: true,
          },
        });
      }
    } else {
      updateConfiguredProjectsList([]);
    }
  }, [getConfiguredProjects]);

  useEffect(() => {
    const allValid = Object.values(primaryConfigureValidation).every(
      (item: ConfigInputValidation) => item.valid
    );
    updateCommonButton((prev) => ({
      ...prev,
      retreive: !allValid,
    }));
  }, [primaryConfigureValidation]);

  useEffect(() => {
    const primaryValid = Object.values(primaryConfigureValidation).every(
      (item: ConfigInputValidation) => item.valid
    );
    const secondaryValid = Object.values(secondaryConfigureValidation).every(
      (item: ConfigInputValidation) => item.valid
    );
    const isButtonEnabled = primaryValid && secondaryValid;

    updateCommonButton((prev) => ({
      ...prev,
      save: !isButtonEnabled,
    }));
  }, [primaryConfigureValidation, secondaryConfigureValidation]);

  useEffect(() => {
    if (i18nData !== null && i18nData !== undefined) {
      const { formFields, others, errorMessages, buttons } =
        i18nData as LocalizationJSON['contrastSettings'];
      const {
        apiKey,
        contrastURL,
        organizationId,
        serviceKey,
        source,
        userName,
        projectName,
        applicationName,
        vulnerabilityRefreshCycle,
      } = formFields;

      updateI18nFields({
        apiKey,
        contrastURL,
        organizationId,
        serviceKey,
        source,
        projectName,
        applicationName,
        userName,
        vulnerabilityRefreshCycle,
        minute: others?.minute,
        buttons: buttons,
        errorMessages,
      });
    }
  }, [i18nData]);

  useEffect(() => {
    if (getAllProjectList !== null && getAllProjectList.responseData !== null) {
      const content = getAllProjectList.responseData as UnConfiguredProject[];
      const filteredProjects: UnConfiguredProject[] = filterUnConfiguredProject(
        content,
        'scan'
      );
      let id: string = '';
      let project: string = '';

      if (activeConfiguredProject !== null) {
        filteredProjects.push({
          name: activeConfiguredProject.projectName,
          id: activeConfiguredProject.projectId as string,
        });
        setListOfProjects(filteredProjects);
        id = activeConfiguredProject.projectId ?? '';
        project = activeConfiguredProject.projectName ?? '';
      } else {
        setListOfProjects(filteredProjects);
        id = filteredProjects[0]?.id as string; // Ensure id is always a string
        project = filteredProjects[0]?.name ?? ''; // Ensure project is always a string
      }

      setPrimaryConfigureValidation({
        apiKey: {
          ...primaryConfigureValidation.apiKey,
          valid: true,
          touched: true,
        },
        contrastURL: {
          ...primaryConfigureValidation.contrastURL,
          valid: true,
          touched: true,
        },
        organizationId: {
          ...primaryConfigureValidation.organizationId,
          valid: true,
          touched: true,
        },
        serviceKey: {
          ...primaryConfigureValidation.serviceKey,
          valid: true,
          touched: true,
        },
        source: {
          ...primaryConfigureValidation.source,
          valid: true,
          touched: true,
        },
        userName: {
          ...primaryConfigureValidation.userName,
          valid: true,
          touched: true,
        },
      });
      updateCancelButton(false);

      setSecondaryConfigurationParams({
        ...secondaryConfigurationParams,
        id: id,
        project: project,
      });

      setSecondaryConfigureValidation({
        ...secondaryConfigureValidation,
        projectName: { touched: true, valid: true },
        projectId: { touched: true, valid: true },
      });
    }
    updateCommonButton({
      ...commonButton,
      retreive: false,
    });
    setIsDisabledSource(false);
  }, [getAllProjectList]);

  useEffect(() => {
    if (
      getAllApplicationList !== null &&
      getAllApplicationList.responseData !== null
    ) {
      const content =
        getAllApplicationList.responseData as UnConfiguredProject[];
      const filteredProjects: UnConfiguredProject[] = filterUnConfiguredProject(
        content,
        'assess'
      );
      let id: string = '';
      let project: string = '';

      if (activeConfiguredProject !== null) {
        filteredProjects.push({
          name: activeConfiguredProject.projectName,
          id: activeConfiguredProject.projectId as string,
        });
        setListOfProjects(filteredProjects);
        id = activeConfiguredProject.projectId ?? '';
        project = activeConfiguredProject.projectName ?? '';
      } else {
        setListOfProjects(filteredProjects);
        id = filteredProjects[0]?.id as string; // Ensure id is always a string
        project = filteredProjects[0]?.name ?? ''; // Ensure project is always a string
      }

      setPrimaryConfigureValidation({
        apiKey: {
          ...primaryConfigureValidation.apiKey,
          valid: true,
          touched: true,
        },
        contrastURL: {
          ...primaryConfigureValidation.contrastURL,
          valid: true,
          touched: true,
        },
        organizationId: {
          ...primaryConfigureValidation.organizationId,
          valid: true,
          touched: true,
        },
        serviceKey: {
          ...primaryConfigureValidation.serviceKey,
          valid: true,
          touched: true,
        },
        source: {
          ...primaryConfigureValidation.source,
          valid: true,
          touched: true,
        },
        userName: {
          ...primaryConfigureValidation.userName,
          valid: true,
          touched: true,
        },
      });

      updateCancelButton(false);

      setSecondaryConfigurationParams({
        ...secondaryConfigurationParams,
        id: id,
        project: project,
      });

      setSecondaryConfigureValidation({
        ...secondaryConfigureValidation,
        projectName: { touched: true, valid: true },
        projectId: { touched: true, valid: true },
      });
    }
    updateCommonButton({
      ...commonButton,
      retreive: false,
    });
    setIsDisabledSource(false);
  }, [getAllApplicationList]);

  useEffect(() => {
    setListOfProjects([]);
    updateCommonButton({ retreive: true, save: true });
    setPrimaryConfigureValidation({
      source: { touched: false, valid: true },
      contrastURL: {
        touched: false,
        valid: true,
        message: i18nFields.errorMessages.contrastURL.required.translate,
      },
      userName: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.userName.required.translate,
      },
      serviceKey: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.serviceKey.required.translate,
      },
      apiKey: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.apiKey.required.translate,
      },
      organizationId: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.organizationId.required.translate,
      },
    });

    setSecondaryConfigureValidation({
      projectName: { touched: false, valid: false },
      minute: {
        touched: false,
        valid: true,
        message: i18nFields.errorMessages.minute.required.translate,
      },
    });
    webviewPostMessage({
      command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
      payload: [],
      screen: WEBVIEW_SCREENS.SETTING,
    });
  }, []);

  useEffect(() => {
    if (addResponse !== null) {
      const content = addResponse.responseData;
      if (content !== null) {
        setListOfProjects([]);
        updateCancelButton(false);
        updateDeselect(true);
        setSecondaryConfigureValidation({
          ...secondaryConfigureValidation,
          projectName: {
            ...secondaryConfigureValidation.projectName,
            valid: false,
            touched: false,
          },
        });
        setSecondaryConfigurationParams({
          project: '',
          minute: '1440',
          id: '',
        });

        webviewPostMessage({
          command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
          payload: [],
          screen: WEBVIEW_SCREENS.SETTING,
        });
      }
    }
  }, [addResponse]);

  useEffect(() => {
    if (editResponse !== null) {
      const content = editResponse.responseData;
      if (content !== null) {
        setListOfProjects([]);
        updateDeselect(true);
        updateCancelButton(false);
        setSecondaryConfigureValidation({
          ...secondaryConfigureValidation,
          projectName: {
            ...secondaryConfigureValidation.projectName,
            valid: false,
            touched: false,
          },
        });
        setSecondaryConfigurationParams({
          project: '',
          minute: '1440',
          id: '',
        });
        setActionButton(0);
        updateActiveConfiguredProject(null);
        webviewPostMessage({
          command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
          payload: [],
          screen: WEBVIEW_SCREENS.SETTING,
        });
      }
    }
    setIsDisabledSource(false);
  }, [editResponse]);

  useEffect(() => {
    if (deleteResponse !== null && deleteResponse !== undefined) {
      const content = deleteResponse.responseData;
      if (content !== undefined && content !== null) {
        handleClear();
        webviewPostMessage({
          command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
          payload: [],
          screen: WEBVIEW_SCREENS.SETTING,
        });
      }
    }
  }, [deleteResponse]);

  useEffect(() => {
    if (
      commonButton.save === false &&
      cancelStateWhileDelete === false &&
      fetchSettingActions === false &&
      fetchRefreshBackgroundVulnRunnerAcrossIds === false &&
      fetchScanRetrievelDetectAcrossIds === false
    ) {
      updateSaveButton(false);
    } else {
      updateSaveButton(true);
    }

    updateCancelButton(cancelStateWhileDelete);
  }, [
    cancelStateWhileDelete,
    commonButton,
    fetchSettingActions,
    fetchRefreshBackgroundVulnRunnerAcrossIds,
    fetchScanRetrievelDetectAcrossIds,
  ]);

  useEffect(() => {
    setInstanceBehaviour(fetchSettingActions);
    if (fetchSettingActions === false) {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
        payload: [],
        screen: WEBVIEW_SCREENS.SETTING,
      });
      updateDeselect(true);
      setSecondaryConfigurationParams({
        project: '',
        minute: '1440',
        id: '',
      });

      setSecondaryConfigureValidation({
        projectName: { touched: false, valid: false },
        minute: {
          touched: false,
          valid: true,
          message: i18nFields.errorMessages.minute.required.translate,
        },
      });
      setListOfProjects([]);
      setActionButton(0);
    }
  }, [fetchSettingActions]);
  // ------------------------------ Methods ----------------------------------

  const primaryValidator = (name: keyof PrimaryConfig, value: string) => {
    let isValid = value !== '';
    const prevState = primaryConfigureValidation[name as keyof PrimaryConfig];
    let message = prevState.message;

    switch (name) {
      case 'userName':
        {
          if (value.length > 0) {
            const emailPattern =
              /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            isValid = emailPattern.test(value);
            message =
              prevState.valid === true
                ? ''
                : i18nFields.errorMessages.userName.invalid.translate;
          } else {
            isValid = false;
            message = i18nFields.errorMessages.userName.required.translate;
          }
        }
        break;
      case 'contrastURL':
        {
          if (value.length > 0) {
            const urlPattern = /^(https:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
            isValid = urlPattern.test(value);
            message = isValid
              ? ''
              : i18nFields.errorMessages.contrastURL.invalid.translate;
          } else {
            isValid = false;
            message = i18nFields.errorMessages.contrastURL.required.translate;
          }
        }
        break;
      default:
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message = (i18nFields.errorMessages as any)[name].required.translate;
        }
        break;
    }

    setPrimaryConfigureValidation((prev: PrimaryConfigValidation) => {
      const updatedState = {
        ...prev,
        [name]: { ...prevState, touched: true, valid: isValid, message },
      };

      updateCommonButton((prev) => ({
        ...prev,
        retreive: !Object.values(updatedState).every(
          (item: ConfigInputValidation) => item.valid
        ),
      }));
      return updatedState;
    });
  };

  const secondaryValidator = (name: keyof SecondaryConfig, value: string) => {
    const prevState = secondaryConfigureValidation[name];
    let isValid = value.trim() !== ''; // Basic required field validation
    let message = prevState?.message;

    switch (name) {
      case 'minute': {
        if (value.length > 0) {
          const numberPattern = /^\d+$/;

          if (numberPattern.test(value)) {
            isValid = true;
            message = '';
          }
        } else {
          message = i18nFields.errorMessages.minute.required.translate;
        }

        break;
      }
    }
    setSecondaryConfigureValidation((prev: SecondaryConfigValidation) => {
      const updatedState = {
        ...prev,
        [name]: { ...prevState, touched: true, valid: isValid, message },
      };

      return updatedState; // Return the updated state
    });
  };

  const primaryHandleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const {
      name,
      value,
    }: { name: string | keyof PrimaryConfig; value: string | number } =
      e.target;
    setPrimaryConfigurationParams({
      ...primaryConfigurationParams,
      [name]: value.trim(),
    });
    primaryValidator(name as keyof PrimaryConfig, value.trim());
  };

  const secondaryHandleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value }: { name: string; value: string | number } = e.target;
    if (name === 'minute') {
      if (
        value === '' ||
        (/^\d+$/.test(value) && +value > 0 && +value <= 4320)
      ) {
        setSecondaryConfigurationParams({
          ...secondaryConfigurationParams,
          [name]: value.trim(),
        });
        secondaryValidator(name, value.trim());
      }
    }
  };

  const filterUnConfiguredProject = (
    content: UnConfiguredProject[],
    source: 'scan' | 'assess'
  ) => {
    if (configuredProjectsList?.length > 0 && configuredProjectsList !== null) {
      const projectName = configuredProjectsList
        .filter((item) => item.source === source)
        .map((val: ConfiguredProject) => {
          return val.projectName.trim();
        });
      const filterData = content.filter((val: { name: string }) => {
        return !projectName.includes(val.name.trim());
      });
      return filterData;
    }
    return content;
  };

  const getAllProjects = () => {
    setIsDisabledSource(true);
    setListOfProjects([]);
    setSecondaryConfigurationParams({
      ...secondaryConfigurationParams,
      project: '',
      id: '',
    });
    if (primaryConfigurationParams.source === 'scan') {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS,
        payload: primaryConfigurationParams,
        screen: WEBVIEW_SCREENS.SETTING,
      });
    }

    if (primaryConfigurationParams.source === 'assess') {
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SETTING_GET_ALL_APPLICATIONS,
        payload: primaryConfigurationParams,
        screen: WEBVIEW_SCREENS.SETTING,
      });
    }
    updateCommonButton({
      ...commonButton,
      retreive: true,
    });
    updateCancelButton(true);
  };

  const handleCrudOperation = () => {
    let newProject: ConfiguredProject = {
      ...primaryConfigurationParams,
      minute: secondaryConfigurationParams.minute,
      projectName: secondaryConfigurationParams?.project,
      projectId: secondaryConfigurationParams?.id,
    };

    if (actionButton !== 0) {
      newProject = { ...newProject, id: activeConfiguredProject?.id };
      if (activeConfiguredProject === null) {
        newProject = {
          ...newProject,
          id: activeProjectId as string,
        };
      }
    }
    switch (actionButton) {
      case 0:
        {
          webviewPostMessage({
            command: WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE,
            payload: newProject,
            screen: WEBVIEW_SCREENS.SETTING,
          });
        }
        break;
      case 1:
        {
          updateDefaultParamsPatch(false);
          webviewPostMessage({
            command: WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT,
            payload: newProject,
            screen: WEBVIEW_SCREENS.SETTING,
          });
        }
        break;
      case 2:
        {
          webviewPostMessage({
            command: WEBVIEW_COMMANDS.SETTING_GET_CONFIGURE_PROJECTS,
            payload: [],
            screen: WEBVIEW_SCREENS.SETTING,
          });
        }
        break;
    }
    updateCommonButton({
      ...commonButton,
      save: true,
    });
    updateCancelButton(true);
  };

  const handleClear = () => {
    updateDeselect(true);
    updateDefaultParamsPatch(true);
    setPrimaryConfigurationParams({
      source: 'assess',
      contrastURL: '',
      userName: '',
      serviceKey: '',
      apiKey: '',
      organizationId: '',
    });

    setPrimaryConfigureValidation({
      source: { touched: false, valid: true },
      contrastURL: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.contrastURL.required.translate,
      },
      userName: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.userName.required.translate,
      },
      serviceKey: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.serviceKey.required.translate,
      },
      apiKey: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.apiKey.required.translate,
      },
      organizationId: {
        touched: false,
        valid: false,
        message: i18nFields.errorMessages.organizationId.required.translate,
      },
    });

    setSecondaryConfigurationParams({
      project: '',
      minute: '1440',
      id: '',
    });

    setSecondaryConfigureValidation({
      projectName: { touched: false, valid: false },
      minute: {
        touched: false,
        valid: true,
        message: i18nFields.errorMessages.minute.required.translate,
      },
    });

    setListOfProjects([]);
    setActionButton(0);
  };

  const onDelete = (e: ConfiguredProject) => {
    if (instanceBehaviour === false) {
      ContrastStore.dispatch(setCancelStateWhileDelete(true));
      webviewPostMessage({
        command: WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT,
        payload: e,
        screen: WEBVIEW_SCREENS.SETTING,
      });
    }
  };

  const getSelectedProject = (selectedConfiguredProject: ConfiguredProject) => {
    updateCommonButton({
      ...commonButton,
      save: true,
      retreive: true,
    });
    setIsDisabledSource(true);
    updateCancelButton(true);
    if (selectedConfiguredProject !== null) {
      const {
        apiKey,
        contrastURL,
        organizationId,
        serviceKey,
        source,
        userName,
        minute,
      } = selectedConfiguredProject;
      setActionButton(1);

      updateActiveConfiguredProject(selectedConfiguredProject);
      cloneActiveProjectId(selectedConfiguredProject.id as string);
      setPrimaryConfigurationParams({
        apiKey: selectedConfiguredProject.apiKey,
        contrastURL: selectedConfiguredProject.contrastURL,
        organizationId: selectedConfiguredProject.organizationId,
        serviceKey: selectedConfiguredProject.serviceKey,
        source: selectedConfiguredProject.source,
        userName: selectedConfiguredProject.userName,
      });

      setSecondaryConfigurationParams({
        project: '',
        minute: typeof minute === 'string' ? minute : `${minute}`,
        id: '',
      });

      setListOfProjects([]);

      if (source === 'scan') {
        webviewPostMessage({
          command: WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS,
          payload: {
            apiKey: apiKey,
            contrastURL: contrastURL,
            organizationId: organizationId,
            serviceKey: serviceKey,
            source: source,
            userName: userName,
          },
          screen: WEBVIEW_SCREENS.SETTING,
        });
      }

      if (source === 'assess') {
        webviewPostMessage({
          command: WEBVIEW_COMMANDS.SETTING_GET_ALL_APPLICATIONS,
          payload: {
            apiKey: apiKey,
            contrastURL: contrastURL,
            organizationId: organizationId,
            serviceKey: serviceKey,
            source: source,
            userName: userName,
          },
          screen: WEBVIEW_SCREENS.SETTING,
        });
      }
    } else {
      setActionButton(0);
    }
  };

  const handleSource = (e: { value: string | string[] }) => {
    setListOfProjects([]);
    updateActiveConfiguredProject(null);
    setSecondaryConfigureValidation({
      ...secondaryConfigureValidation,
      projectId: {
        ...secondaryConfigureValidation['projectId'],
        valid: false,
        touched: false,
      },
      projectName: {
        ...secondaryConfigureValidation['projectName'],
        valid: false,
        touched: false,
      },
    });
    setPrimaryConfigurationParams({
      ...primaryConfigurationParams,
      source: e.value as string,
    });
  };
  return (
    <>
      <div className="settingFormDiv">
        <table className="settingFormTable1">
          <tbody>
            <tr>
              <td>{i18nFields?.source?.translate}</td>
              <td>
                <div className="source-dropdown">
                  <ContrastDropdown
                    id="source"
                    value={primaryConfigurationParams.source}
                    onChange={(e: { value: string | string[] }) => {
                      handleSource(e);
                    }}
                    isDisabled={isDisabledSource}
                  >
                    <ContrastOption id="scan" value={'scan'}>
                      Scan
                    </ContrastOption>
                    <ContrastOption id="assess" value={'assess'}>
                      Assess
                    </ContrastOption>
                  </ContrastDropdown>
                </div>
              </td>
            </tr>
            <tr>
              <td>{i18nFields.contrastURL?.translate}</td>
              <td>
                <div className="form-field">
                  <div className="withHelpIcon">
                    <Input
                      id="contrastURL"
                      type="text"
                      value={primaryConfigurationParams.contrastURL}
                      name="contrastURL"
                      placeholder={i18nFields.contrastURL?.placeholder ?? ''}
                      onChange={primaryHandleInput}
                    />
                    <Tooltip
                      title={`${i18nFields.contrastURL?.note}: https://<instance-url>.com`}
                      children={
                        <InfoIcon
                          fontSize="small"
                          color="primary"
                          style={{ cursor: 'pointer' }}
                        ></InfoIcon>
                      }
                    ></Tooltip>
                  </div>
                  <ThrowError
                    fieldData={primaryConfigureValidation['contrastURL']}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td>{i18nFields?.userName?.translate}</td>
              <td>
                <div className="form-field">
                  <div className="withHelpIcon">
                    <Input
                      id="userName"
                      name="userName"
                      type="text"
                      value={primaryConfigurationParams.userName}
                      placeholder={i18nFields.userName?.placeholder ?? ''}
                      onChange={primaryHandleInput}
                    />
                    <Tooltip
                      title={i18nFields.userName?.note}
                      children={
                        <InfoIcon
                          fontSize="small"
                          color="primary"
                          style={{ cursor: 'pointer' }}
                        ></InfoIcon>
                      }
                    ></Tooltip>
                  </div>
                  <ThrowError
                    fieldData={primaryConfigureValidation['userName']}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td>{i18nFields?.organizationId?.translate}</td>
              <td>
                <div className="form-field">
                  <Input
                    id="organizationId"
                    name="organizationId"
                    type="text"
                    value={primaryConfigurationParams.organizationId}
                    placeholder={i18nFields.organizationId?.placeholder ?? ''}
                    onChange={primaryHandleInput}
                  />
                  <ThrowError
                    fieldData={primaryConfigureValidation['organizationId']}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td>{i18nFields.apiKey?.translate}</td>
              <td>
                <div className="form-field">
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type="password"
                    value={primaryConfigurationParams.apiKey}
                    placeholder={i18nFields.apiKey?.placeholder ?? ''}
                    onChange={primaryHandleInput}
                  />
                  <ThrowError
                    fieldData={primaryConfigureValidation['apiKey']}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td>{i18nFields.serviceKey?.translate}</td>
              <td>
                <div className="form-field">
                  <Input
                    id="serviceKey"
                    name="serviceKey"
                    type="password"
                    value={primaryConfigurationParams.serviceKey}
                    placeholder={i18nFields.serviceKey?.placeholder ?? ''}
                    onChange={primaryHandleInput}
                  />
                  <ThrowError
                    fieldData={primaryConfigureValidation['serviceKey']}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td></td>
              <td>
                <div>
                  <Button
                    id="retrieve-btn"
                    isDisable={commonButton.retreive}
                    className="mt_5 mb_5 float-right"
                    title={i18nFields.buttons?.retrieve.translate ?? ''}
                    onClick={() => getAllProjects()}
                    color="btn-blue"
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td>
                {primaryConfigurationParams.source === 'scan'
                  ? i18nFields.projectName?.translate
                  : null}
                {primaryConfigurationParams.source === 'assess'
                  ? i18nFields.applicationName?.translate
                  : null}
              </td>
              <td>
                <div className="project-dropdown">
                  <ContrastDropdown
                    id="projects"
                    value={secondaryConfigurationParams.id}
                    onChange={(e: {
                      children: ReactNode;
                      value: string | string[];
                    }) => {
                      setSecondaryConfigurationParams({
                        ...secondaryConfigurationParams,
                        project: String(e.children),
                        id: e.value as string,
                      });
                    }}
                    hasSearchBox={true}
                  >
                    {listOfProjects !== null && listOfProjects.length > 0
                      ? listOfProjects.map((item: UnConfiguredProject) => (
                          <ContrastOption
                            key={item.id}
                            id={item.name}
                            value={item.id as string}
                          >
                            {item.name}
                          </ContrastOption>
                        ))
                      : []}
                  </ContrastDropdown>
                </div>
              </td>
            </tr>
            <tr>
              <td>{i18nFields.vulnerabilityRefreshCycle?.translate}</td>
              <td>
                <div className="form-field">
                  <div className="minute-form-field">
                    <Input
                      id="minute"
                      type="text"
                      name="minute"
                      value={secondaryConfigurationParams.minute}
                      className="w-80"
                      placeholder="0000"
                      onChange={secondaryHandleInput}
                    />{' '}
                    <span>({i18nFields.minute?.translate})</span>
                  </div>
                  <ThrowError
                    fieldData={secondaryConfigureValidation['minute']}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ width: '680px' }}>
        <OrganizationTable
          dataSource={configuredProjectsList}
          onChange={getSelectedProject}
          onDelete={onDelete}
          isDeselect={{
            deselectRow,
            updateDeselect,
          }}
        />

        <div className="org-add-update">
          <Button
            isDisable={saveButton}
            id="add-project"
            title={
              actionButton === 0
                ? (i18nFields.buttons?.add.translate ?? 'Add')
                : (i18nFields.buttons?.update.translate ?? 'Update')
            }
            color="btn-blue"
            onClick={handleCrudOperation}
          />

          <Button
            isDisable={cancelButton}
            title={i18nFields.buttons?.cancel.translate ?? ''}
            color="btn-transparent"
            onClick={handleClear}
          />
        </div>
      </div>
    </>
  );
}

export default Setting;
