import { env } from 'vscode';
import {
  ApiResponse,
  AssessFilter,
  CommandRequest,
  ConfiguredProject,
  PrimaryConfig,
} from '../../../common/types';
import { localeI18ln } from '../../../l10n';

import {
  getAssessVulnerabiltiesFromCache,
  getBuildNumber,
  getCurrentFileVulForAssess,
  getCustomSessionMetaData,
  getListOfTagsByOrgId,
  getMostRecentMetaData,
  getServerListbyOrgId,
} from '../../api/services/apiService';
import {
  ShowErrorPopup,
  ShowInformationPopup,
} from '../../commands/ui-commands/messageHandler';
import { ContrastPanelInstance } from '../../commands/ui-commands/webviewHandler';
import {
  GetAllConfiguredProjects,
  GetAssessFilter,
  UpdateAssessFilter,
} from '../../persistence/PersistenceConfigSetting';

import { WEBVIEW_COMMANDS, WEBVIEW_SCREENS } from '../constants/commands';
import {
  ActiveFileHightlighting,
  closeActiveFileHightlighting,
  featureController,
  interlockModeSwitch,
  isNotNull,
  slotInstance,
  tabBlocker,
} from '../helper';
import {
  getDataFromCacheAssess,
  getDataOnlyFromCacheAssess,
  refreshCacheAssess,
  updateAccessVulnerabilities,
  updateMarkAsByTraceId,
  updateTagsByTraceId,
} from '../../cache/cacheManager';
import { AssessRequest } from '../../api/model/api.interface';
import { resolveFailure } from '../errorHandling';
import { openVulFile } from '../vulnerabilityDecorator';
import {
  assessBackgroundVulBehaviour,
  updateGlobalWebviewConfig,
} from '../multiInstanceConfigSync';

export const AssessCommandHandler = async (props: CommandRequest) => {
  const { command, payload } = props;
  switch (command) {
    case WEBVIEW_COMMANDS.GET_CONFIGURED_APPLICATIONS: {
      return {
        command: WEBVIEW_COMMANDS.GET_CONFIGURED_APPLICATIONS,
        data: await GetAllConfiguredProjects(),
      };
    }
    case WEBVIEW_COMMANDS.GET_SERVER_LIST_BY_ORG_ID: {
      return {
        command: WEBVIEW_COMMANDS.GET_SERVER_LIST_BY_ORG_ID,
        data: await getServerListbyOrgId(
          payload.organizationId,
          payload.projectId,
          payload
        ),
      };
    }
    case WEBVIEW_COMMANDS.GET_BUILD_NUMBER: {
      return {
        command: WEBVIEW_COMMANDS.GET_BUILD_NUMBER,
        data: await getBuildNumber(
          payload.organizationId,
          payload.projectId,
          payload
        ),
      };
    }
    case WEBVIEW_COMMANDS.GET_CUSTOM_SESSION_METADATA: {
      return {
        command: WEBVIEW_COMMANDS.GET_CUSTOM_SESSION_METADATA,
        data: await getCustomSessionMetaData(
          payload.organizationId,
          payload.projectId,
          payload
        ),
      };
    }
    case WEBVIEW_COMMANDS.GET_MOST_RECENT_METADATA: {
      return {
        command: WEBVIEW_COMMANDS.GET_MOST_RECENT_METADATA,
        data: await getMostRecentMetaData(
          payload.organizationId,
          payload.projectId,
          payload
        ),
      };
    }
    case WEBVIEW_COMMANDS.COMMON_MESSAGE: {
      if (
        [
          'tagAlreadyApplied',
          'tagAlreadyAvailable',
          'tagLengthExceeded',
        ].includes(payload.data)
      ) {
        ShowErrorPopup(
          localeI18ln.getTranslation(
            `persistResponse.${payload.data}`
          ) as string
        );
      }
      switch (payload.data) {
        case 'loadingFilters': {
          ShowInformationPopup(
            localeI18ln.getTranslation(`persistResponse.${payload.data}`)
          );
        }
      }
      return {
        command: WEBVIEW_COMMANDS.COMMON_MESSAGE,
        data: await ShowInformationPopup(''),
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_GET_FILTERS: {
      return {
        command: WEBVIEW_COMMANDS.ASSESS_GET_FILTERS,
        data: await GetAssessFilter(),
      };
    }
    case WEBVIEW_COMMANDS.ASSESS_UPDATE_FILTERS: {
      await updateGlobalWebviewConfig(
        WEBVIEW_SCREENS.SETTING,
        'clearAssessThings',
        'true'
      );
      const data = await UpdateAssessFilter(payload);
      await updateGlobalWebviewConfig(
        WEBVIEW_SCREENS.SETTING,
        'reloadApplications'
      );
      await updateGlobalWebviewConfig(
        WEBVIEW_SCREENS.ASSESS,
        'loadAssessFilter'
      );
      return {
        command: WEBVIEW_COMMANDS.ASSESS_UPDATE_FILTERS,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY: {
      let responseData = null;
      await Promise.all([closeActiveFileHightlighting()]);
      const isModeSwitched = await interlockModeSwitch('assess');
      await assessBackgroundVulBehaviour.disable();
      if (isModeSwitched) {
        featureController.setSlot('assess');
        tabBlocker(false);
        ShowInformationPopup(
          localeI18ln.getTranslation(
            'persistResponse.retrievingVulnerabilities'
          ) + ' - Assess'
        );

        await getDataFromCacheAssess(payload, payload, true);
        responseData = await refreshCacheAssess(payload, payload);
        if (responseData !== undefined && responseData !== null) {
          if (responseData?.code === 200) {
            ShowInformationPopup(responseData.message);
          } else {
            ShowErrorPopup(responseData?.message);
          }
        }
        tabBlocker(true);
        await ActiveFileHightlighting();
      }
      await assessBackgroundVulBehaviour.enable();
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.ASSESS_BACKGROUND_RUNNER,
        data: false,
      });
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.ASSESS_GET_FILTERS,
        data: await GetAssessFilter(),
      });

      return {
        command: WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY,
        data: responseData,
      };
    }
    case WEBVIEW_COMMANDS.ASSESS_GET_INITIAL_ALL_FILES_VULNERABILITY: {
      return {
        command: WEBVIEW_COMMANDS.ASSESS_GET_INITIAL_ALL_FILES_VULNERABILITY,
        data: await getDataOnlyFromCacheAssess(),
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_BACKGROUND_RUNNER: {
      return {
        command: WEBVIEW_COMMANDS.ASSESS_BACKGROUND_RUNNER,
        data: true,
      };
    }
    case WEBVIEW_COMMANDS.ASSESS_REDIRECTION: {
      if ('data' in payload && payload.data.length > 0) {
        env.openExternal(payload.data);
      }
      return {
        command: WEBVIEW_COMMANDS.ASSESS_REDIRECTION,
        data: null,
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_UPDATE_VULNERABILITY: {
      const persist = await GetAssessFilter();
      let finalVul: unknown = null;
      if (
        persist !== null &&
        persist !== undefined &&
        persist.responseData !== null &&
        persist.responseData !== undefined
      ) {
        const persistIns = persist.responseData as AssessFilter;
        const update = await updateAccessVulnerabilities(payload.traceId);
        if (update && persistIns !== undefined) {
          const assess = await getAssessVulnerabiltiesFromCache(
            persistIns as AssessRequest,
            persistIns
          );
          finalVul = assess;
        }
      }
      return {
        command: WEBVIEW_COMMANDS.ASSESS_UPDATE_VULNERABILITY,
        data: finalVul,
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH_BACKGROUND_RUNNER: {
      return {
        command: WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH_BACKGROUND_RUNNER,
        data: true,
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH: {
      let response: ApiResponse | undefined = undefined;
      const isModeSwitched = await interlockModeSwitch('assess');
      if (isModeSwitched) {
        featureController.setSlot('assess');
        const applicationPersist = await GetAssessFilter();
        if (
          isNotNull(applicationPersist) &&
          isNotNull(applicationPersist?.responseData) &&
          applicationPersist.code === 200
        ) {
          ShowInformationPopup(
            localeI18ln.getTranslation(
              'persistResponse.retrievingVulnerabilities'
            ) + ' - Assess'
          );

          await assessBackgroundVulBehaviour.disable();

          await refreshCacheAssess(payload, payload);
          response = await getDataFromCacheAssess(
            applicationPersist.responseData as unknown as AssessRequest,
            applicationPersist.responseData as unknown as PrimaryConfig,
            true
          );

          await assessBackgroundVulBehaviour.enable();
          await ActiveFileHightlighting();
        } else {
          response = await Promise.resolve(
            resolveFailure(
              localeI18ln.getTranslation(
                'persistResponse.applicationNotConfigured'
              ),
              400
            )
          );
        }
      }
      ContrastPanelInstance.postMessage({
        command: WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH_BACKGROUND_RUNNER,
        data: false,
      });

      return {
        command: WEBVIEW_COMMANDS.ASSESS_MANUAL_REFRESH,
        data: response,
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_ADD_MARK: {
      let getMarkAs = null;
      const getFilters = await GetAssessFilter();
      if (
        isNotNull(getFilters) === true &&
        isNotNull(getFilters?.responseData) === true
      ) {
        const addMarkAs = await updateMarkAsByTraceId(payload);
        if (
          isNotNull(addMarkAs) === true &&
          isNotNull(addMarkAs?.responseData) === true
        ) {
          const persistIns = getFilters.responseData as AssessFilter;
          const assess = await getAssessVulnerabiltiesFromCache(
            persistIns as AssessRequest,
            persistIns
          );
          getMarkAs = assess;
        }
      }

      return {
        command: WEBVIEW_COMMANDS.ASSESS_ADD_MARK,
        data: getMarkAs,
      };
    }
    case WEBVIEW_COMMANDS.ASSESS_ORG_TAGS: {
      const getFilters = await GetAssessFilter();
      let getTagsByOrgId = null;
      if (
        getFilters !== null &&
        getFilters !== undefined &&
        getFilters.responseData !== null &&
        getFilters.responseData !== undefined
      ) {
        const filters = getFilters.responseData as ConfiguredProject;

        getTagsByOrgId = await getListOfTagsByOrgId(
          filters.organizationId as string,
          filters
        );
      }
      return {
        command: WEBVIEW_COMMANDS.ASSESS_ORG_TAGS,
        data: getTagsByOrgId,
      };
    }
    case WEBVIEW_COMMANDS.ASSESS_TAG_OK_BEHAVIOUR: {
      let getTagsByOrgId = null;
      const getFilters = await GetAssessFilter();
      if (
        isNotNull(getFilters) === true &&
        isNotNull(getFilters.responseData) === true
      ) {
        const addTags = await updateTagsByTraceId(
          payload.traceId,
          payload.tags,
          payload.tags_remove
        );
        if (
          isNotNull(addTags) === true &&
          isNotNull(addTags?.responseData) === true
        ) {
          const persistIns = getFilters.responseData as AssessFilter;
          const assess = await getAssessVulnerabiltiesFromCache(
            persistIns as AssessRequest,
            persistIns
          );
          getTagsByOrgId = assess;
        }
      }

      return {
        command: WEBVIEW_COMMANDS.ASSESS_TAG_OK_BEHAVIOUR,
        data: getTagsByOrgId,
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_GET_CURRENTFILE_VUL: {
      return {
        command: WEBVIEW_COMMANDS.ASSESS_GET_CURRENTFILE_VUL,
        data: await getCurrentFileVulForAssess(),
      };
    }

    case WEBVIEW_COMMANDS.ASSESS_OPEN_VULNERABILITY_FILE: {
      slotInstance.setSlot(false);
      return {
        command: WEBVIEW_COMMANDS.ASSESS_OPEN_VULNERABILITY_FILE,
        data: openVulFile(payload, 'assess'),
      };
    }
  }
};
