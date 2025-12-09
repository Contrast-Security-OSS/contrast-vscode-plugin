/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { env, Uri, window, workspace } from 'vscode';
import {
  ApiResponse,
  AssessFilter,
  CommandRequest,
  ConfiguredProject,
  LogLevel,
  PrimaryConfig,
  ResponseData,
} from '../../../common/types';
import { localeI18ln } from '../../../l10n';

import {
  getAssessVulnerabiltiesFromCache,
  getAvailableEnvironments,
  getAvailableTags,
  getBuildNumber,
  getCurrentFileVulForAssess,
  getCustomSessionMetaData,
  getLibFilterListByAppId,
  getLibOrgTags,
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

import { ASSESS_KEYS, TOKEN, WEBVIEW_COMMANDS } from '../constants/commands';
import {
  ActiveFileHightlighting,
  closeActiveFileHightlighting,
  featureController,
  getScaFilterFromCache,
  interlockModeSwitch,
  isNotNull,
  libraryPathNavigator,
  slotInstance,
  tabBlocker,
} from '../helper';
import {
  clearCacheByProjectId,
  commonRefreshAssessLibrariesCache,
  getDataFromCacheAssess,
  getDataFromCacheLibrary,
  getDataOnlyFromCacheAssess,
  refreshCacheAssess,
  updateAccessVulnerabilities,
  updateCVEOverview,
  updateLibTagsByHashId,
  updateMarkAsByTraceId,
  updateTagsByTraceId,
  updateUsageDetails,
} from '../../cache/cacheManager';
import { AssessRequest } from '../../api/model/api.interface';
import { resolveFailure } from '../errorHandling';
import { openVulFile } from '../vulnerabilityDecorator';
import { assessBackgroundVulBehaviour } from '../multiInstanceConfigSync';
import { LocaleMemoryCacheInstance } from '../localeMemoryCache';
import { closeStatusBarItem } from '../statusBarSeverity';
import { stopBackgroundTimerAssess } from '../../cache/backgroundRefreshTimerAssess';
import { checkLibraryInLanguage } from '../../../webview/utils/library-path';
import { loggerInstance } from '../../logging/logger';
import { DateTime } from '../commonUtil';

export const AssessCommandHandler = async (props: CommandRequest) => {
  const startTime: string = DateTime();
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
    case WEBVIEW_COMMANDS.GET_ASSESS_ENVIRONMENTS: {
      return {
        command: WEBVIEW_COMMANDS.GET_ASSESS_ENVIRONMENTS,
        data: await getAvailableEnvironments(payload.projectId),
      };
    }

    case WEBVIEW_COMMANDS.GET_ASSESS_TAGS: {
      return {
        command: WEBVIEW_COMMANDS.GET_ASSESS_TAGS,
        data: await getAvailableTags(payload.projectId, payload),
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
        case 'vulnerabilityClear':
          {
            ShowInformationPopup(
              localeI18ln.getTranslation(`persistResponse.${payload.data}`)
            );
          }
          break;
        case 'scaClear': {
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
      const existsFilter = (await LocaleMemoryCacheInstance.getItem(
        TOKEN.ASSESS,
        ASSESS_KEYS.ASSESS_FILTERS
      )) as AssessFilter;
      const notEqualFilter = () => existsFilter !== null && payload !== null;
      if (notEqualFilter() && existsFilter.projectId !== payload.projectId) {
        await Promise.all([
          closeActiveFileHightlighting(),
          closeStatusBarItem(),
          ContrastPanelInstance.resetAssessVulnerabilityRecords(),
          ContrastPanelInstance.clearPrimaryAssessFilter(),
          stopBackgroundTimerAssess(),
          ContrastPanelInstance.clearAssessPersistance(),
          LocaleMemoryCacheInstance.clearStore(TOKEN.ASSESS),
          ContrastPanelInstance.clearPrimaryScaFilter(),
          clearCacheByProjectId(existsFilter?.projectId as string),
        ]);
      }
      const data = await UpdateAssessFilter(payload);
      if (data.code === 200) {
        ShowInformationPopup(
          localeI18ln.getTranslation(
            'persistResponse.applicationFilterUpdatedSuccess'
          )
        );
      }

      return {
        command: WEBVIEW_COMMANDS.ASSESS_UPDATE_FILTERS,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY: {
      let payload: (AssessRequest & ConfiguredProject) | null = null;
      let responseData = null;
      const assessFilter = await GetAssessFilter();
      if (isNotNull(assessFilter) && isNotNull(assessFilter?.responseData)) {
        payload = assessFilter.responseData as AssessRequest &
          ConfiguredProject;
      }
      await Promise.all([closeActiveFileHightlighting()]);
      const isModeSwitched = await interlockModeSwitch('assess');
      await assessBackgroundVulBehaviour.disable();
      if (isModeSwitched) {
        featureController.setSlot('assess');
        tabBlocker(false);
        ShowInformationPopup(
          localeI18ln.getTranslation(
            'persistResponse.assessRetrievingVulnerabilities'
          )
        );

        if (payload !== null) {
          let scaFilters = await getScaFilterFromCache();

          if (scaFilters === null || scaFilters === undefined) {
            await LocaleMemoryCacheInstance.setItem(
              TOKEN.ASSESS,
              ASSESS_KEYS.SCA_FILTERS,
              {
                appId: payload.projectId,
                applicationName: payload.projectName,
              }
            );
            scaFilters = await getScaFilterFromCache();
          }

          const cacheRefreshResponse = await commonRefreshAssessLibrariesCache(
            scaFilters,
            payload,
            payload
          );

          if (
            cacheRefreshResponse !== null &&
            cacheRefreshResponse !== undefined &&
            cacheRefreshResponse.responseData !== null &&
            cacheRefreshResponse.responseData !== undefined
          ) {
            const { assess, library } =
              cacheRefreshResponse.responseData as unknown as {
                assess: ResponseData;
                library: ResponseData;
              };

            if (assess !== undefined) {
              responseData = assess ?? null;
            }

            if (library !== undefined) {
              ContrastPanelInstance.postMessage({
                command: WEBVIEW_COMMANDS.SCA_GET_ALL_FILES_VULNERABILITY,
                data: library ?? null,
              });
            }

            ShowInformationPopup(
              localeI18ln.getTranslation(
                'apiResponse.assessVulnerbilitySuccess'
              )
            );
          } else {
            ShowErrorPopup(cacheRefreshResponse?.message as string);
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
              'persistResponse.assessRetrievingVulnerabilities'
            )
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
      libraryPathNavigator.setSlot(false);
      const data = await openVulFile(payload, 'assess');
      slotInstance.setSlot(true);
      libraryPathNavigator.setSlot(true);
      return {
        command: WEBVIEW_COMMANDS.ASSESS_OPEN_VULNERABILITY_FILE,
        data: data,
      };
    }

    // ------------------ SCA ------------------------------

    case WEBVIEW_COMMANDS.SCA_GET_FILTERS: {
      return {
        command: WEBVIEW_COMMANDS.SCA_GET_FILTERS,
        data: await LocaleMemoryCacheInstance.getItem(
          TOKEN.ASSESS,
          ASSESS_KEYS.SCA_FILTERS
        ),
      };
    }
    case WEBVIEW_COMMANDS.SCA_UPDATE_FILTERS: {
      const data = await LocaleMemoryCacheInstance.setItem(
        TOKEN.ASSESS,
        ASSESS_KEYS.SCA_FILTERS,
        payload
      );
      ShowInformationPopup(
        localeI18ln.getTranslation('persistResponse.scaFilterUpdatedSuccess')
      );
      const logData = `Start Time: ${startTime} | End Time: ${DateTime()} | Message: Update Library Filter - Filters updated successfully \n`;
      void loggerInstance?.logMessage(LogLevel.INFO, logData);
      return {
        command: WEBVIEW_COMMANDS.SCA_UPDATE_FILTERS,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_TAG_LIST: {
      const data = await getLibFilterListByAppId(
        'tags',
        payload.appId,
        payload
      );
      return {
        command: WEBVIEW_COMMANDS.SCA_TAG_LIST,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_QUICKVIEW_LIST: {
      const data = await getLibFilterListByAppId(
        'QUICKFILTER',
        payload.appId,
        payload
      );
      return {
        command: WEBVIEW_COMMANDS.SCA_QUICKVIEW_LIST,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_LIBRARY_USAGE_LIST: {
      const data = await getLibFilterListByAppId(
        'usage',
        payload.appId,
        payload
      );
      return {
        command: WEBVIEW_COMMANDS.SCA_LIBRARY_USAGE_LIST,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_LIBRARY_LICENSES_LIST: {
      const data = await getLibFilterListByAppId(
        'licenses',
        payload.appId,
        payload
      );
      return {
        command: WEBVIEW_COMMANDS.SCA_LIBRARY_LICENSES_LIST,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_ENVIRONMENTS_LIST: {
      const data = await getLibFilterListByAppId(
        'environments',
        payload.appId,
        payload
      );
      return {
        command: WEBVIEW_COMMANDS.SCA_ENVIRONMENTS_LIST,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_SERVERS_LIST: {
      const data = await getLibFilterListByAppId(
        'servers',
        payload.appId,
        payload
      );
      return {
        command: WEBVIEW_COMMANDS.SCA_SERVERS_LIST,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_SEVERITIES: {
      const data = await getLibFilterListByAppId(
        'severities',
        payload.appId,
        payload
      );

      return {
        command: WEBVIEW_COMMANDS.SCA_SEVERITIES,
        data: data,
      };
    }
    case WEBVIEW_COMMANDS.SCA_STATUS: {
      const data = await getLibFilterListByAppId(
        'status',
        payload.appId,
        payload
      );
      return {
        command: WEBVIEW_COMMANDS.SCA_STATUS,
        data: data,
      };
    }

    case WEBVIEW_COMMANDS.SCA_UPDATE_VULNERABILITY_USAGE: {
      let finalVul: unknown = null;
      const hashId = payload?.overview.hash;
      if (hashId !== null && hashId !== undefined) {
        const scaFilter = await getScaFilterFromCache();
        const update = await updateUsageDetails(
          hashId,
          payload.isUnmapped ?? false
        );
        if (update !== null && scaFilter !== null && scaFilter !== undefined) {
          const assess = await getDataFromCacheLibrary(scaFilter);
          finalVul = assess.responseData;
        }
      }
      return {
        command: WEBVIEW_COMMANDS.SCA_UPDATE_VULNERABILITY_USAGE,
        data: {
          status: 'success',
          message: '',
          code: 200,
          responseData: finalVul,
        },
      };
    }

    case WEBVIEW_COMMANDS.SCA_ORG_TAGS: {
      const getFilters = await GetAssessFilter();
      let getTagsByOrgId = null;
      if (
        getFilters !== null &&
        getFilters !== undefined &&
        getFilters.responseData !== null &&
        getFilters.responseData !== undefined
      ) {
        const filters = getFilters.responseData as ConfiguredProject;
        getTagsByOrgId = await getLibOrgTags(filters);
      }
      return {
        command: WEBVIEW_COMMANDS.SCA_ORG_TAGS,
        data: getTagsByOrgId,
      };
    }
    case WEBVIEW_COMMANDS.SCA_TAG_OK_BEHAVIOUR: {
      const scaFilter = await getScaFilterFromCache();
      let finalVul = null;
      const hashId = payload?.uuid;
      if (
        hashId !== null &&
        hashId !== undefined &&
        scaFilter !== null &&
        scaFilter !== undefined
      ) {
        const addTags = await updateLibTagsByHashId(
          hashId,
          payload.tags,
          payload.tags_remove,
          payload.isUnmapped
        );
        if (isNotNull(addTags) === true) {
          const assess = await getDataFromCacheLibrary(scaFilter);
          finalVul = assess.responseData;
        }
      }

      return {
        command: WEBVIEW_COMMANDS.SCA_TAG_OK_BEHAVIOUR,
        data: {
          status: 'success',
          message: '',
          code: 200,
          responseData: finalVul,
        },
      };
    }
    case WEBVIEW_COMMANDS.SCA_UPDATE_CVE_OVERVIEW: {
      const scaFilter = await updateCVEOverview(payload.label ?? '');
      return {
        command: WEBVIEW_COMMANDS.SCA_TAG_OK_BEHAVIOUR,
        data: {
          status: 'success',
          message: '',
          code: 200,
          responseData: scaFilter,
        },
      };
    }
    case WEBVIEW_COMMANDS.SCA_UPDATE_CVE_PATH: {
      let finalVul = undefined;
      const assessFilter = await GetAssessFilter();
      if (isNotNull(assessFilter) && isNotNull(assessFilter?.responseData)) {
        const data = assessFilter.responseData as AssessRequest &
          ConfiguredProject;
        const scaFilter = await checkLibraryInLanguage(
          payload?.overview?.app_language ?? '',
          payload?.label,
          data.appId,
          payload?.overview?.hash,
          payload?.isUnmapped,
          data.projectName,
          payload?.overview?.version ?? ''
        );
        if (scaFilter.code === 200) {
          finalVul = scaFilter.responseData;
        }
      }
      return {
        command: WEBVIEW_COMMANDS.SCA_UPDATE_CVE_PATH,
        data: {
          status: 'success',
          message: '',
          code: 200,
          responseData: finalVul,
        },
      };
    }
    case WEBVIEW_COMMANDS.SCA_LIBRARY_PATH_REDIRECT: {
      if (payload?.link !== undefined && payload.link.length > 0) {
        try {
          libraryPathNavigator.setSlot(false);
          const document = await workspace.openTextDocument(
            Uri.file(payload.link)
          );
          await window.showTextDocument(document);
          libraryPathNavigator.setSlot(true);
          closeStatusBarItem();
        } catch (error) {
          console.error(
            'Error while opening file for SCA path redirect:',
            error
          );
        }
      }
      break;
    }

    case WEBVIEW_COMMANDS.SCA_GET_INITIAL_ALL_FILES_VULNERABILITY: {
      const scaFilter = await getScaFilterFromCache();
      let finalVul: unknown = null;
      if (scaFilter !== null && scaFilter !== undefined) {
        const assess = await getDataFromCacheLibrary(scaFilter);
        finalVul = assess.responseData;
      }
      return {
        command: WEBVIEW_COMMANDS.SCA_GET_INITIAL_ALL_FILES_VULNERABILITY,
        data: {
          status: 'success',
          message: '',
          code: 200,
          responseData: finalVul,
        },
      };
    }
  }
};
