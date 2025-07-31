const axios = require('axios');
const pkg = require('../../../../package.json');
import {
  ApiResponse,
  AssessFilter,
  ConfiguredProject,
  FilterType,
  LibRequestBody,
  libListFilter,
  LogLevel,
  PersistedDTO,
  PrimaryConfig,
  ScaFiltersType,
} from '../../../common/types';
import { authBase64 } from '../../../webview/utils/authBase64';
import { resolveFailure, resolveSuccess } from '../../utils/errorHandling';
import * as vscode from 'vscode';
import { allProjectVul, FilterData } from '../../../webview/utils/constant';
import { PersistenceInstance } from '../../utils/persistanceState';
import {
  SETTING_KEYS,
  TOKEN,
  WEBVIEW_COMMANDS,
} from '../../utils/constants/commands';
import {
  clearCacheByProjectId,
  getAdviceFromCache,
  getDataFromCache,
  getDataFromCacheAssess,
  getDataOnlyFromCache,
  getDataOnlyFromCacheAssess,
  updateAdvice,
} from '../../cache/cacheManager';
import {
  resetBackgroundTimer,
  stopBackgroundTimer,
} from '../../cache/backgroundRefreshTimer';
import {
  AssessRequest,
  HowToFixText,
  addMarkByOrgIdParams,
  Level0Entry,
  Level0Vulnerability,
  Level1Entry,
  Level1Vulnerability,
  Level2Vulnerability,
  ListOfTagsResponse,
  Params,
  ProjectSource,
  ResponseCustomSession,
  SourceJsonVulnerability,
  Story,
  Vulnerability,
  OverviewChapters,
  addMarkByOrgIdReqParams,
  FinalFilter,
  newData,
  LibraryVulnerability,
} from '../model/api.interface';
import { localeI18ln } from '../../../l10n';
import {
  constructFilters,
  DateTime,
  filterCriticalVulnerabilities,
  filterCriticalVulnerabilitiesLineNumber,
  formatString,
  getParseLibVulData,
  groupByFileName,
  handleErrorResponse,
  moveUnmappedVulnerabilities,
  onlyGetOpenedFolderName,
  parseSourceJson,
  validateParams,
} from '../../utils/commonUtil';

import {
  GetAllConfiguredProjects,
  GetAssessFilter,
  GetFilters,
} from '../../persistence/PersistenceConfigSetting';
import {
  ShowErrorPopup,
  ShowInformationPopup,
} from '../../commands/ui-commands/messageHandler';
import { getFilePathuri } from '../../utils/helper';

import axiosRetry from 'axios-retry';
import { loggerInstance } from '../../logging/logger';
import { decrypt } from '../../utils/encryptDecrypt';
import { AxiosInstance } from 'axios';
import { stopBackgroundTimerAssess } from '../../cache/backgroundRefreshTimerAssess';
import { ContrastPanelInstance } from '../../commands/ui-commands/webviewHandler';
import path from 'path';

const os = require('os');

axiosRetry(axios, { retries: 3 });

axiosRetry(axios, {
  retryDelay: () => {
    return 100;
  },
});

axios.defaults.timeout = 100 * 1000;

const headers = {
  'User-Agent': `<${pkg.name}>/<${pkg.version}>(platform=VSCode;version=${os.release()};os=${os.platform()};version=${vscode.version})`,
};
export const axiosController = new AbortController();

function getAxiosClient(contrastURL: string): AxiosInstance {
  const client = axios.create({
    baseURL: `${contrastURL}/Contrast/api`,
    headers,
  });
  axiosRetry(client, { retries: 3 });
  return client;
}

async function getAllProjectList(params: PrimaryConfig): Promise<ApiResponse> {
  const { apiKey, contrastURL, userName, serviceKey, organizationId, source } =
    params;
  if (
    !apiKey ||
    !contrastURL ||
    !userName ||
    !serviceKey ||
    !organizationId ||
    !source
  ) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.missingOneOrMoreError'),
      400
    );
  }

  const baseUrl = source === 'scan' ? 'sast' : 'assess';
  const allProjects: Array<Record<string, string>> = [];
  let page = 0;
  let totalpages = 0;

  ShowInformationPopup(
    localeI18ln.getTranslation('apiResponse.fetchingProjectDetails')
  );
  try {
    do {
      const client = getAxiosClient(contrastURL);
      const response = await client.get(
        `/${baseUrl}/organizations/${organizationId}/projects`,
        {
          headers: {
            'Api-Key': apiKey,
            Authorization: authBase64(userName, serviceKey),
          },
          params: {
            page: page,
            size: 2000,
            archived: false,
          },
        }
      );
      if (response.status === 200) {
        allProjects.push(...response.data.content);
        totalpages = response.data.totalPages;
        page++;
      } else {
        return resolveFailure(
          localeI18ln.getTranslation('apiResponse.badRequest'),
          400
        );
      }
    } while (page < totalpages);

    const uniqueProjects = allProjects.filter(
      (item, index, self) =>
        self.findIndex(
          (t) => t.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        ) === index
    );

    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Projects Fetched Successfully | Total number of Projects : ${uniqueProjects.length} \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);
    ShowInformationPopup(
      localeI18ln.getTranslation('apiResponse.projectsFetchedSuccessful')
    );
    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.projectsFetchedSuccessful'),
      200,
      uniqueProjects
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Retrieve Projects - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
      ShowInformationPopup(
        localeI18ln.getTranslation('apiResponse.authenticationFailure')
      );
    }
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.authenticationFailure'),
      500
    );
  }
}

async function getProjectById(
  params: ConfiguredProject,
  isManual = true
): Promise<boolean> {
  const {
    apiKey,
    userName,
    serviceKey,
    organizationId,
    source,
    projectId,
    contrastURL,
  } = params;
  const baseUrl = source === 'scan' ? 'sast' : 'assess';

  try {
    const client = getAxiosClient(contrastURL);
    const decryptApiKey = isManual ? apiKey : decrypt(apiKey);
    const decryptSecretKey = isManual ? serviceKey : decrypt(serviceKey);

    const response = await client.get(
      `/${baseUrl}/organizations/${organizationId}/projects/${projectId}`,
      {
        headers: {
          'Api-Key': decryptApiKey,
          Authorization: authBase64(userName, decryptSecretKey),
          ...headers,
        },
      }
    );
    if (response.status === 200) {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      return !response.data?.archived as boolean;
    } else {
      return false;
    }
  } catch (err) {
    if (err instanceof Error) {
      void loggerInstance?.logMessage(LogLevel.ERROR, `${err.message} \n`);
    }
    return false;
  }
}

const getCurrentFileVul = async (): Promise<ApiResponse> => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const fileName = await getFilePathuri(editor.document.fileName);

    const response = await getVulnerabilitybyFile(fileName);

    if (response.code === 200) {
      const { child } = response.responseData as Record<string, string>;

      const root = [
        {
          level: 2,
          label: formatString(
            localeI18ln.getTranslation('apiResponse.foundIssues') as string,
            child.length,
            1
          ),
          issuesCount: child.length,
          filesCount: 1,
          child: [response.responseData],
        },
      ];
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.fileDataFetchedSuccess'),
        200,
        root as ProjectSource[]
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('persistResponse.vulnerabilityNotFound'),
        400
      );
    }
  } else {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.noActiveFile'),
      400
    );
  }
};

const getAllFilesVulnerability = () => {
  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.allFillDataFetchedSuccessful'),
    200,
    allProjectVul
  );
};

async function getScanResults(projectId: string): Promise<ApiResponse> {
  let allResults: Vulnerability[] = [];
  const response: ApiResponse = await GetAllConfiguredProjects();
  const configuredProjects: ConfiguredProject[] =
    response.responseData as ConfiguredProject[];

  const project: ConfiguredProject | undefined = configuredProjects?.find(
    (project: ConfiguredProject) => project.projectId === projectId
  );
  if (project === undefined || project === null) {
    await stopBackgroundTimer();
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  const isProjectActive = await getProjectById(project);

  if (!isProjectActive) {
    ShowErrorPopup(
      localeI18ln.getTranslation('apiResponse.ARCHIVED') as string
    );
    await stopBackgroundTimer();
    await clearCacheByProjectId(projectId);

    ContrastPanelInstance.postMessage({
      command: WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY,
      data: null,
    });

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.ARCHIVED'),
      400
    );
  }

  let filter: FilterType = FilterData;

  const getFilters = await GetFilters();
  if (getFilters.responseData !== null) {
    filter = getFilters.responseData as FilterType;
  }
  const filters = constructFilters(filter);
  const { apiKey, userName, serviceKey, organizationId, source, contrastURL } =
    project;

  const baseUrl = source === 'scan' ? 'sast' : 'assess';

  try {
    let currentPage = 0;
    let totalPages = 6;
    const maximumPages = 6;

    while (
      currentPage < (totalPages < maximumPages ? totalPages : maximumPages)
    ) {
      const params: Params = {
        page: currentPage,
        size: 2000,
        archived: false,
      };

      if (
        filters.status !== undefined &&
        filters.status !== null &&
        filters.status.length > 0
      ) {
        params.status = filters.status;
      }

      if (
        filters.severity !== undefined &&
        filters.severity !== null &&
        filters.severity.length > 0
      ) {
        params.severity = filters.severity;
      }

      const client = getAxiosClient(contrastURL);

      const response = await client.get(
        `/${baseUrl}/organizations/${organizationId}/projects/${projectId}/results/info`,
        {
          headers: {
            'Api-Key': apiKey,
            Authorization: authBase64(userName, serviceKey),
            ...headers,
          },
          params,
        }
      );
      if (response.status === 200) {
        allResults = allResults.concat(response.data.content);
        totalPages = response.data.totalPages;
        currentPage++;
      } else {
        return resolveFailure(
          localeI18ln.getTranslation('apiResponse.failedToFecthScanResult'),
          400
        );
      }
    }
    const parsedJson = parseSourceJson(allResults);

    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: ${formatString(
      'Found {0} issues in {1} files(s)',
      parsedJson.issuesCount,
      parsedJson.filesCount
    )}
    `;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    if (totalPages > maximumPages) {
      ShowInformationPopup(
        localeI18ln.getTranslation('apiResponse.refineFilter')
      );
    }
    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.scanFetchedSuccessful'),
      200,
      parsedJson
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Unable to retrieve the project as it has been deleted from the organization table. \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.errorFetchingScanResult'),
      500
    );
  }
}

async function getProjectVulnerabilties(): Promise<ApiResponse | undefined> {
  const projectVulnerabilities: ApiResponse = await getDataFromCache();
  const vulnerabilities = projectVulnerabilities?.responseData as ProjectSource;
  if (vulnerabilities?.issuesCount > 15000) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.configureFilter'),
      400
    );
  }
  if (projectVulnerabilities.code === 200) {
    ShowInformationPopup(projectVulnerabilities.message);
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Vulnerabilities Retrieved from Cache \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);
    return projectVulnerabilities;
  } else {
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Unable to retrieve vulnerabilities from Cache \n`;
    void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    ShowErrorPopup(projectVulnerabilities.message);
  }
}

async function getVulnerabilitybyFile(
  fileName: string | undefined
): Promise<ApiResponse> {
  const fileData: ApiResponse = await getDataOnlyFromCache();
  const vulnerabilityByFile = fileData.responseData as ProjectSource;
  const file = vulnerabilityByFile?.child?.find(
    (o: Level1Entry) => o.filePath === fileName
  );
  if (file === undefined || file === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.fileNotFound'),
      400
    );
  }

  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.projectsFetchedSuccessful'),
    200,
    file
  );
}

async function getVulnerabilitybyCriticality(
  severity: string
): Promise<ApiResponse> {
  const fileData: ApiResponse = await getDataFromCache();
  let vulnerabilitybyCriticality = fileData.responseData as ProjectSource;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vulnerabilitybyCriticality = filterCriticalVulnerabilities(
    vulnerabilitybyCriticality,
    severity
  );

  return fileData;
}

async function getVulnerabilitybyLineNumber(
  fileName: string,
  lineNumber: number
): Promise<ApiResponse> {
  const fileData: ApiResponse = await getDataFromCache();
  const vulnerabilitybyLineNumber = fileData.responseData as ProjectSource;

  const file = vulnerabilitybyLineNumber?.child?.find(
    (o: Level1Entry) => o.label === fileName
  );
  if (file === undefined || file === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.fileNotFound'),
      400
    );
  }
  const vulnerabilitiesAtLine = file.child.filter(
    (o: Level0Entry) => o.lineNumber === lineNumber
  );
  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.vulnerabilityByLineSuccess'),
    200,
    vulnerabilitiesAtLine
  );
}

async function getFirstVulnerabilitybyLineNumber(
  fileName: string,
  lineNumber: number
): Promise<ApiResponse> {
  const fileData: ApiResponse = await getDataFromCache();
  let firstVulnerabilitybyLineNumber = fileData.responseData as ProjectSource;
  firstVulnerabilitybyLineNumber = filterCriticalVulnerabilitiesLineNumber(
    firstVulnerabilitybyLineNumber,
    'CRITICAL',
    fileName,
    lineNumber
  );

  const file = firstVulnerabilitybyLineNumber?.child?.find(
    (o: Level1Entry) => o.label === fileName
  );

  if (file === undefined || file === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.fileNotFound'),
      400
    );
  }
  const result = file.child.filter(
    (o: Level0Entry) => o.lineNumber === lineNumber
  );

  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.firstVulnerabilityByLineSuccess'),
    200,
    result.length > 0 ? result[0] : result
  );
}

async function resetTimer(): Promise<ApiResponse> {
  const projectName = onlyGetOpenedFolderName();
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];

  const project = persistedData?.find(
    (project: ConfiguredProject) =>
      project.projectName === projectName && project.source === 'scan'
  );
  if (project === undefined || project === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }
  await resetBackgroundTimer(project.projectId as string);
  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.successfullyResetTimer'),
    200,
    null
  );
}

async function getAllScans(params: ConfiguredProject): Promise<ApiResponse> {
  const {
    apiKey,
    userName,
    serviceKey,
    organizationId,
    projectId,
    source,
    contrastURL,
  } = params;
  const baseUrl = source === 'scan' ? 'sast' : 'assess';
  const allScans: Array<Record<string, string>> = [];
  let page = 0;
  let totalPages = 0;

  try {
    do {
      const client = getAxiosClient(contrastURL);

      const response = await client.get(
        `/${baseUrl}/organizations/${organizationId}/projects/${projectId}/scans`,
        {
          headers: {
            'Api-Key': apiKey,
            Authorization: authBase64(userName, serviceKey),
            ...headers,
          },
          params: {
            page: page,
          },
        }
      );

      if (response.status === 200) {
        allScans.push(...response.data.content);
        totalPages = response.data.totalPages;
        page++;
      } else {
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Failed to retrieve scans \n`;
        void loggerInstance?.logMessage(LogLevel.ERROR, logData);
        return resolveFailure(
          localeI18ln.getTranslation('apiResponse.failedToRetrieveScan'),
          400
        );
      }
    } while (page <= totalPages);
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Scans Retrieved Successfully \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);
    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.scanRetrievedSuccessful'),
      200,
      allScans
    );
  } catch (err) {
    if (err instanceof Error) {
      await loggerInstance?.logMessage(LogLevel.ERROR, `${err.message} \n`);
    }
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.errorFetchingScanResult'),
      500
    );
  }
}

async function getScanById(
  params: ConfiguredProject,
  scanId: string
): Promise<ApiResponse> {
  const {
    apiKey,
    userName,
    serviceKey,
    organizationId,
    projectId,
    source,
    contrastURL,
  } = params;

  const baseUrl = source === 'scan' ? 'sast' : 'assess';

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/${baseUrl}/organizations/${organizationId}/projects/${projectId}/scans/${scanId}`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.scanRetrievedByIdSuccessful'),
        200,
        response.data
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.failedToRetrieveScanById'),
        400
      );
    }
  } catch (err) {
    if (err instanceof Error) {
      void loggerInstance?.logMessage(LogLevel.ERROR, `${err.message} \n`);
    }
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.errorFetchingScanById'),
      500
    );
  }
}

const getOrganisationName = async (ConfigData: ConfiguredProject) => {
  const { apiKey, serviceKey, userName, organizationId, contrastURL } =
    ConfigData;
  try {
    const client = getAxiosClient(contrastURL);
    const res = await client.get(
      `/ng/profile/organizations/${organizationId}`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );
    if (res.status === 200) {
      return res.data.organization.name;
    }
    return false;
  } catch (error) {
    if (error instanceof Error) {
      void loggerInstance?.logMessage(
        LogLevel.ERROR,
        `Organisation Validation:  ${error.message} \n`
      );
    }
    return false;
  }
};

async function getPackageInformation(): Promise<ApiResponse> {
  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.packageInfoSuccess'),
    200,
    {
      name: pkg.name,
      displayName: pkg.displayName,
      version: pkg.version,
      description: pkg.description,
      aboutPage: {
        title: pkg.aboutPage.title,
        content: pkg.aboutPage.content,
      },
      osWithVersion: os.platform() + '-' + os.release(),
      IDEVersion: vscode.version,
      platform: 'VSCode',
    }
  );
}

async function getScanResultById(scanId: string): Promise<ApiResponse> {
  const projectName = await onlyGetOpenedFolderName();

  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];
  const project = persistedData?.find(
    (project: ConfiguredProject) =>
      project.projectName === projectName && project.source === 'scan'
  );
  if (project === undefined || project === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }
  try {
    const advise = await getAdviceFromCache(scanId);
    if (advise) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.scanRetrievedByIdSuccessful'),
        200,
        advise
      );
    } else {
      const baseUrl = project.source === 'scan' ? 'sast' : 'assess';
      const client = getAxiosClient(project.contrastURL);

      const response = await client.get(
        `/${baseUrl}/organizations/${project.organizationId}/projects/${project.projectId}/results/${scanId}`,
        {
          headers: {
            'Api-Key': decrypt(project.apiKey),
            Authorization: authBase64(
              project.userName,
              decrypt(project.serviceKey)
            ),
            ...headers,
          },
        }
      );

      if (response.status === 200) {
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Scans Retrieved Successfully \n`;
        void loggerInstance?.logMessage(LogLevel.INFO, logData);
        await updateAdvice(scanId, response.data.risk);

        return resolveSuccess(
          localeI18ln.getTranslation('apiResponse.scanRetrievedByIdSuccessful'),
          200,
          response.data.risk
        );
      } else {
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Failed to retrieve scans \n`;
        void loggerInstance?.logMessage(LogLevel.ERROR, logData);
        return resolveFailure(
          localeI18ln.getTranslation('apiResponse.failedToRetrieveScanById'),
          400
        );
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      void loggerInstance?.logMessage(LogLevel.ERROR, `${err.message} \n`);
    }
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.errorFetchingScanById'),
      500
    );
  }
}

// asses code goes here
async function getAllApplicationsByOrgId(
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult; // If validation failed, return error
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;

  const allApplications: Array<Record<string, string>> = [];
  ShowInformationPopup(
    localeI18ln.getTranslation('apiResponse.fecthingApplication')
  );

  try {
    const client = getAxiosClient(contrastURL);
    const quickFilterCondition: 'LICENSED' | 'ARCHIVED' = 'LICENSED';
    const requestpayload = {
      quickFilter:
        quickFilterCondition === 'LICENSED' ? 'LICENSED' : 'ARCHIVED',
      filterTechs: [],
      filterLanguages: [],
      filterTags: [],
      scoreLetterGrades: [],
      filterServers: [],
      filterCompliance: [],
      filterVulnSeverities: [],
      environment: [],
      appImportances: [],
      metadataFilters: [],
    };

    const response = await client.post(
      `/ng/${organizationId}/applications/filter`,
      JSON.stringify(requestpayload),
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          'Content-Type': 'application/json',
          ...headers,
        },
        params: {
          archived: true,
        },
      }
    );

    if (
      response.data.applications.filter(
        (x: Record<string, string>) => x.archived
      )?.length > 0
    ) {
      ShowInformationPopup(
        localeI18ln.getTranslation('apiResponse.ASSESSARCHIVED')
      );
      await stopBackgroundTimerAssess();
      response?.data.applications.map(async (app: Record<string, string>) => {
        await clearCacheByProjectId(app.appId);
      });

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.ASSESSARCHIVED'),
        400
      );
    }

    if (response.status === 200) {
      allApplications.push(
        ...response.data.applications.map((item: Record<string, string>) => ({
          id: item.app_id,
          name: item.name,
        }))
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.badRequest'),
        400
      );
    }

    const uniqueApplications = allApplications.filter(
      (item, index, self) =>
        self.findIndex(
          (t) => t.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        ) === index
    );

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Applications fetched successfully \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    ShowInformationPopup(
      localeI18ln.getTranslation('apiResponse.fechedSuccess')
    );

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.fechedSuccess'),
      200,
      uniqueApplications
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving applications - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      ShowErrorPopup(
        localeI18ln.getTranslation(
          'apiResponse.authenticationFailure'
        ) as string
      );

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getApplicationById(
  applicationId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult; // If validation failed, return error
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;

  let allApplication: newData = {
    id: '',
    name: '',
    archieve: false,
  };

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${organizationId}/applications/${applicationId}`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      allApplication = {
        id: response.data.application.app_id,
        name: response.data.application.name,
        archieve: response.data.application.archived,
      };
    } else {
      return resolveFailure('Bad request', 400);
    }

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Applications fetched successfully | Total applications: ${allApplication.length} \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.fechedSuccess'),
      200,
      allApplication
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving applications - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getServerListbyOrgId(
  orgId: string,
  appId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult; // If validation failed, return error
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  const allServerList: Array<Record<string, string>> = [];

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(`/ng/${orgId}/servers/filter`, {
      headers: {
        'Api-Key': apiKey,
        Authorization: authBase64(userName, serviceKey),
        ...headers,
      },
      params: {
        applicationsIds: appId,
      },
    });

    if (response.status === 200) {
      allServerList.push(
        ...response.data.servers.map((item: Record<string, string>) => ({
          server_id: item.server_id,
          name: item.name,
        }))
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
        400
      );
    }

    const uniqueServerList = allServerList.filter(
      (item, index, self) =>
        self.findIndex(
          (t) => t.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        ) === index
    );

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: ServerList fetched successfully | Total ServerList: ${uniqueServerList.length} \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.serverListFetched'),
      200,
      uniqueServerList
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getBuildNumber(
  orgId: string,
  appId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult; // If validation failed, return error
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  const allBuildNumber: Array<Record<string, string>> = [];

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${orgId}/traces/${appId}/filter/appversiontags/listing`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      allBuildNumber.push(
        ...response.data.filters.map((item: Record<string, string>) => ({
          keycode: item.keycode,
          label: item.label,
        }))
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
        400
      );
    }

    const uniqueBuildNumber = allBuildNumber.filter(
      (item, index, self) =>
        self.findIndex(
          (t) =>
            t.label.trim().toLowerCase() === item.label.trim().toLowerCase()
        ) === index
    );

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: BuildNumber fetched successfully | Total BuildNumber: ${uniqueBuildNumber.length} \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.buildnumberFetched'),
      200,
      uniqueBuildNumber
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving BuildNumber - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getCustomSessionMetaData(
  orgId: string,
  appId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  const CustomSessionMetaData: ResponseCustomSession[] = [];

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${orgId}/metadata/session/${appId}/filters`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      CustomSessionMetaData.push(
        ...response.data.filters.map((item: ResponseCustomSession) => ({
          id: item.id,
          label: item.label,
          values: item.values.map((val) => ({
            value: val.value,
            count: val.count,
          })),
        }))
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
        400
      );
    }

    const uniqueCustomSessionMetaData = CustomSessionMetaData.filter(
      (item, index, self) =>
        self.findIndex(
          (t) =>
            t.label.trim().toLowerCase() === item.label.trim().toLowerCase()
        ) === index
    );

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: CustomSessionMetaData fetched successfully | Total applications: ${uniqueCustomSessionMetaData.length} \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.customSessionMetaDataFetched'),
      200,
      uniqueCustomSessionMetaData
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving CustomSessionMetaData - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getMostRecentMetaData(
  orgId: string,
  appId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  let allMostRecentMetaData: Array<Record<string, string>> = [];

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/organizations/${orgId}/applications/${appId}/agent-sessions/latest`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      if ('agentSession' in response.data) {
        allMostRecentMetaData = [
          {
            agentSessionId: response.data.agentSession.agentSessionId,
          },
        ];
      }
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
        400
      );
    }

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: MostRecentMetaData fetched successfully | Total MostRecentMetaData: ${allMostRecentMetaData.length} \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.MostRecentMetaDataFetched'),
      200,
      allMostRecentMetaData
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving MostRecentMetaData - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getListOfTagsByOrgId(
  orgId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  let allListOfTagsByOrgId: ListOfTagsResponse[] = [];

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(`/ng/${orgId}/tags/traces`, {
      headers: {
        'Api-Key': apiKey,
        Authorization: authBase64(userName, serviceKey),
        ...headers,
      },
    });

    if (response.status === 200) {
      allListOfTagsByOrgId = response.data.tags.map(
        (tags: string, index: number) => ({
          id: index + 1,
          label: tags,
        })
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
        400
      );
    }

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: allListOfTagsByOrgId fetched successfully | Total allListOfTagsByOrgId: ${allListOfTagsByOrgId.length} \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.getAllTags'),
      200,
      allListOfTagsByOrgId
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving allListOfTagsByOrgId - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function addTagsByOrgId(
  orgId: string,
  traceId: string[],
  tags: string[],
  tags_remove: string[],
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  try {
    const requestpayload = {
      traces_uuid: traceId,
      tags: tags,
      tags_remove: tags_remove,
    };
    const client = getAxiosClient(contrastURL);

    const response = await client.put(
      `/ng/${orgId}/tags/traces/bulk`,
      JSON.stringify(requestpayload),
      {
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.vulnerabilitysuccessfully'),
        200,
        null
      );
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
        400
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving alladdTagsByOrgId - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getScanVulnerabilityResults(
  appId: string
): Promise<ApiResponse> {
  let allResults: ProjectSource[] = [];
  const response: ApiResponse = await GetAllConfiguredProjects();
  const configuredProjects: ConfiguredProject[] =
    response.responseData as ConfiguredProject[];

  const project: ConfiguredProject | undefined = configuredProjects?.find(
    (project: ConfiguredProject) => project.projectId === appId
  );
  if (project === undefined || project === null) {
    await stopBackgroundTimer();
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  const applicationResponse = await getApplicationById(
    project.projectId as string,
    project
  );

  if (applicationResponse.code !== 200) {
    return response;
  }

  const applicationData = applicationResponse.responseData as newData;

  const isApplicatonArchieve = applicationData?.archieve;

  if (isApplicatonArchieve) {
    ShowErrorPopup(
      localeI18ln.getTranslation('apiResponse.ASSESSARCHIVED') as string
    );
    await stopBackgroundTimerAssess();
    await stopBackgroundTimer();
    await clearCacheByProjectId('assess-' + appId);

    ContrastPanelInstance.postMessage({
      command: WEBVIEW_COMMANDS.ASSESS_GET_ALL_FILES_VULNERABILITY,
      data: null,
    });

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.ASSESSARCHIVED'),
      400
    );
  }

  const filters = await getAllAssessFilters();

  const { apiKey, userName, serviceKey, organizationId, contrastURL } = project;

  try {
    const params: Params & { limit: number } = {
      archived: false,
      page: 0,
      size: 0,
      limit: 2000,
      expand: 'vulnerability_instances',
    };

    let body: FinalFilter = {};

    if (filters !== undefined) {
      body = filters as FinalFilter;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach((item) =>
      searchParams.append(item[0], item[1])
    );

    const client = getAxiosClient(contrastURL);

    const response = await client.post(
      `/ng/${organizationId}/traces/${appId}/filter`,
      body,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
        params: searchParams,
      }
    );

    if (response.status === 200) {
      allResults = allResults.concat(response.data.traces);
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.failedToFecthScanResult'),
        400
      );
    }

    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: ${formatString(
      'Found {0} issues in {1} files(s)',
      5,
      10
    )}
    `;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.tracesFetched'),
      200,
      allResults
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Unable to retrieve the project as it has been deleted from the organization table. \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.somethingWentWrong'),
      500
    );
  }
}

async function getVulnerabilityLineNumberandFileName(
  orgId: string,
  traceId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(`/ng/${orgId}/traces/${traceId}/story`, {
      headers: {
        'Api-Key': apiKey,
        Authorization: authBase64(userName, serviceKey),
        ...headers,
      },
    });

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.storyResult'),
        200,
        response.data.story
      );
    } else {
      return handleErrorResponse('apiResponse.somethingWentWrong', 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function getVulnerabilityIntroTextandRisk(
  orgId: string,
  traceId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${orgId}/traces/${traceId}/story/?expand=skip_links`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.storyText'),
        200,
        response.data.story
      );
    } else {
      return handleErrorResponse('apiResponse.somethingWentWrong', 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function getVulnerabilityRecommendation(
  orgId: string,
  traceId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${orgId}/traces/${traceId}/recommendation`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.recommendationText'),
        200,
        response.data
      );
    } else {
      return handleErrorResponse('apiResponse.somethingWentWrong', 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function addMarkByOrgId(
  addparams: addMarkByOrgIdParams,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;

  try {
    const requestpayload: addMarkByOrgIdReqParams = {
      traces: addparams.traceId,
      status: addparams.status,
      note: addparams.note,
    };

    if (addparams.substatus !== null && addparams.substatus !== undefined) {
      requestpayload.substatus = addparams.substatus;
    }

    const client = getAxiosClient(contrastURL);

    const response = await client.put(
      `/ng/${addparams.orgId}/orgtraces/mark`,
      JSON.stringify(requestpayload),
      {
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.addVulnerabilitySuccessfully'),
        200,
        null
      );
    } else {
      return handleErrorResponse('apiResponse.somethingWentWrong', 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving addMarkByOrgId - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function getVulnerabilityEvents(
  orgId: string,
  traceId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;
  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${orgId}/traces/${traceId}/events/summary`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.eventsResult'),
        200,
        response.data.events
      );
    } else {
      return handleErrorResponse('apiResponse.somethingWentWrong', 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function getVulnerabilityHttps(
  orgId: string,
  traceId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey } =
    validationResult.validParams;
  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${orgId}/traces/${traceId}/httprequest`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.httpsResult'),
        200,
        response.data.http_request
      );
    } else {
      return handleErrorResponse('apiResponse.somethingWentWrong', 400);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function getAssessVulnerabilities(
  requestParams: AssessRequest,
  params: PrimaryConfig
): Promise<ApiResponse> {
  try {
    const level0Vulnerabilities: Level0Vulnerability[] = [];

    const response = await getScanVulnerabilityResults(requestParams.appId);

    if (response.code !== 200) {
      return response;
    }

    const vulnerabilitiesData =
      response.responseData as SourceJsonVulnerability[];

    if (response.status === 'success') {
      await Promise.all(
        vulnerabilitiesData.map(async (level0Item) => {
          const level0FileDetailResponse =
            await getVulnerabilityLineNumberandFileName(
              requestParams.orgId,
              level0Item.uuid,
              params
            );
          const level0Recommendation = await getVulnerabilityRecommendation(
            requestParams.orgId,
            level0Item.uuid,
            params
          );
          const level0FileDetailResponseData =
            level0FileDetailResponse.responseData as Story;
          const level0RecommendationResponseData =
            level0Recommendation.responseData as HowToFixText;

          const lastDetectedDate = level0Item.last_time_seen
            ? new Date(level0Item.last_time_seen).toLocaleString()
            : 'N/A';

          const firstDetectedDate = level0Item.first_time_seen
            ? new Date(level0Item.first_time_seen).toLocaleString()
            : 'N/A';

          let title = 'Un mapped vulnerabilities';
          let filePath = 'Un mapped vulnerabilities';
          let fileFullPath = 'Un mapped vulnerabilities';
          let lineNumber = 0;
          const chapter = level0FileDetailResponseData?.chapters.find(
            (x) => x.type === 'location'
          );

          if (chapter) {
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            title = chapter.bodyFormatVariables?.className
              ? chapter.bodyFormatVariables?.className.split('.').pop() +
                '.java'
              : // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                chapter.bodyFormatVariables?.fileName
                ? chapter.bodyFormatVariables?.fileName
                    .split('.')
                    .slice(-2)
                    .join('.')
                : 'Un mapped vulnerabilities';

            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            filePath = chapter.bodyFormatVariables?.className
              ? chapter.bodyFormatVariables?.className.split('.').pop() +
                '.java'
              : // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                chapter.bodyFormatVariables?.fileName
                ? chapter.bodyFormatVariables?.fileName
                    .split('.')
                    .slice(-2)
                    .join('.')
                : 'Un mapped vulnerabilities';

            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            fileFullPath = chapter.bodyFormatVariables?.className
              ? chapter.bodyFormatVariables?.className + '.java'
              : // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                chapter.bodyFormatVariables?.fileName
                ? chapter.bodyFormatVariables?.fileName
                    .split('.')
                    .slice(-2)
                    .join('.')
                : 'Un mapped vulnerabilities';
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            lineNumber = chapter.bodyFormatVariables?.lineNumber || 0;
          }
          const chaptersList: OverviewChapters[] = [];
          level0FileDetailResponseData?.chapters.forEach((chapter) => {
            chaptersList.push({
              introText: chapter.introText,
              type: chapter.type,
              body: chapter.body,
            });
          });

          const vulnerabilityTags = level0Item.tags?.map(
            (tags: string, index: number) => ({
              id: index + 1,
              label: tags,
            })
          );

          const item: Level0Vulnerability = {
            level: 0,
            traceId: level0Item.uuid,
            label: level0Item.title,
            labelForMapping: title,
            language: level0Item.language,
            popupMessage: {
              lastDetected_date: lastDetectedDate,
              status: level0Item.status,
              firstDetected_date: firstDetectedDate,
              link: `${params?.contrastURL}/Contrast/static/ng/index.html#/${params.organizationId}/applications/${requestParams.appId}/vulns/${level0Item.uuid}`,
            },
            Substatus_keycode: level0Item.substatus_keycode,
            severity: level0Item.severity,
            lineNumber: lineNumber,
            fileName: title,
            filePath: filePath,
            fileFullPath: fileFullPath,
            overview: {
              chapters: chaptersList,
              risk: {
                text: level0FileDetailResponseData?.risk.formattedText,
              },
            },
            howToFix: {
              recommendation: {
                formattedText:
                  level0RecommendationResponseData?.recommendation
                    ?.formattedText,
              },
              custom_recommendation: {
                text: level0RecommendationResponseData?.custom_recommendation
                  ?.text,
              },
              owasp: level0RecommendationResponseData?.owasp,
              cwe: level0RecommendationResponseData?.cwe,
              rule_references: {
                text: level0RecommendationResponseData?.rule_references?.text,
              },
              custom_rule_references: {
                text: level0RecommendationResponseData?.custom_rule_references
                  ?.text,
              },
            },
            events: {
              data: [
                {
                  label: 'Events',
                  isRoot: true,
                  child: [],
                },
              ],
            },
            tags: vulnerabilityTags,
            isUnmapped: title === 'Un mapped vulnerabilities',
          };

          level0Vulnerabilities.push(item);
        })
      );

      const groupedItems = groupByFileName(level0Vulnerabilities);
      const level1Vulnerabilities: Level1Vulnerability[] = [];
      for (const [key, value] of Object.entries(groupedItems)) {
        const items = value as Level0Vulnerability[];
        level1Vulnerabilities.push({
          level: 1,
          label: key,
          isUnmapped: key === 'Un mapped vulnerabilities',
          filePath: items[0].filePath,
          fileType: items[0].language,
          child: items,
          issuesCount: items.length,
        });
      }

      const level1VulnerabilitiesWithUnmapped = moveUnmappedVulnerabilities(
        level1Vulnerabilities,
        'Un mapped vulnerabilities'
      );

      const responseResult: Level2Vulnerability = {
        level: 2,
        label: `found ${vulnerabilitiesData.length} of ${level1VulnerabilitiesWithUnmapped.length} files`,
        issuesCount: vulnerabilitiesData.length,
        filesCount: level1VulnerabilitiesWithUnmapped.length,
        child: level1VulnerabilitiesWithUnmapped,
        isUnmapped: true,
      };
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.assessVulnerbilitySuccess'),
        200,
        responseResult
      );
    }

    throw new Error('Failed to retrieve vulnerabilities');
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving AssessVulnerabilities - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return resolveFailure(
        localeI18ln.getTranslation('apiResponse.authenticationFailure'),
        500
      );
    }

    return resolveFailure('Unknown error occurred', 500);
  }
}

export const getAllAssessFilters = async (): Promise<
  FinalFilter | undefined
> => {
  const payload: FinalFilter = {
    severities: ['CRITICAL', 'HIGH', 'MEDIUM'],
    status: ['REPORTED', 'CONFIRMED', 'SUSPICIOUS'],
  };

  const alterStatus = (status: string) => {
    let str = status;
    if (str.includes('NOT_A_PROBLEM')) {
      str = str.replace('NOT_A_PROBLEM', 'NotAProblem');
    }
    return str;
  };

  const getWorkspaceFilter = await GetAssessFilter();
  if (
    getWorkspaceFilter !== null &&
    getWorkspaceFilter !== undefined &&
    getWorkspaceFilter.responseData !== null &&
    getWorkspaceFilter.responseData !== undefined
  ) {
    const isIn = (item: keyof AssessFilter) =>
      item in (getWorkspaceFilter.responseData as AssessFilter);

    const isNotNull = (item: unknown) => item !== null && item !== undefined;
    const {
      servers,
      appVersionTags,
      severities,
      status,
      startDate,
      endDate,
      agentSessionId,
      metadataFilters,
      applicationTags,
      environments,
    } = getWorkspaceFilter.responseData as AssessFilter;

    if (isIn('servers') && isNotNull(servers)) {
      const server = servers;
      payload.servers = server as Array<string>;
    }
    if (isIn('appVersionTags') && isNotNull(appVersionTags)) {
      const appVersionTag = appVersionTags;
      payload.appVersionTags = appVersionTag as Array<string>;
    }
    if (isIn('severities') && isNotNull(severities) && severities.length > 0) {
      payload.severities = severities.split(',') as unknown as Array<string>;
    } else {
      delete payload['severities'];
    }

    if (isIn('status') && isNotNull(status) && status.length > 0) {
      payload.status = alterStatus(status).split(
        ','
      ) as unknown as Array<string>;
    } else {
      delete payload['status'];
    }

    if (isIn('startDate') && isNotNull(startDate?.timeStamp)) {
      payload.startDate = startDate.timeStamp;
    }

    if (isIn('endDate') && isNotNull(endDate?.timeStamp)) {
      payload.endDate = endDate.timeStamp;
    }

    if (isIn('agentSessionId') && isNotNull(agentSessionId)) {
      payload.agentSessionId = agentSessionId;
    }

    if (isIn('metadataFilters') && isNotNull(metadataFilters)) {
      payload.metadataFilters = metadataFilters;
    }

    if (isIn('applicationTags') && isNotNull(applicationTags)) {
      payload.applicationTags = applicationTags;
    }

    if (isIn('environments') && isNotNull(environments)) {
      payload.environments = environments;
    }

    return payload;
  }
};

async function getAssessVulnerabiltiesFromCache(
  requestParams: AssessRequest,
  params: PrimaryConfig
): Promise<ApiResponse | undefined> {
  const projectVulnerabilities: ApiResponse = await getDataFromCacheAssess(
    requestParams,
    params
  );

  const vulnerabilities =
    projectVulnerabilities.responseData as Level2Vulnerability;
  if (vulnerabilities?.issuesCount > 15000) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.configureFilter'),
      400
    );
  }
  if (projectVulnerabilities.code === 200) {
    // ShowInformationPopup(projectVulnerabilities.message);
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Vulnerabilities Retrieved from Cache \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);
    return projectVulnerabilities;
  } else {
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Unable to retrieve vulnerabilities from Cache \n`;
    void loggerInstance?.logMessage(LogLevel.ERROR, logData);
    // ShowErrorPopup(projectVulnerabilities.message);
    return projectVulnerabilities;
  }
}

export async function getAssessVulnerabilitybyFile(
  fileName: string | undefined
): Promise<ApiResponse> {
  const fileData: ApiResponse = await getDataOnlyFromCacheAssess();
  const vulnerabilityByFile = fileData.responseData as Level2Vulnerability;
  const file = vulnerabilityByFile?.child?.find(
    (o: Level1Vulnerability) => o.label === fileName
  );
  if (file === undefined || file === null) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.fileNotFound'),
      400
    );
  }

  return resolveSuccess(
    localeI18ln.getTranslation('apiResponse.projectsFetchedSuccessful'),
    200,
    file
  );
}

async function getCurrentFileVulForAssess(): Promise<ApiResponse> {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const filePath = await getFilePathuri(editor.document.fileName);

    if (filePath !== undefined) {
      const fileName = path.basename(filePath);
      const response = await getAssessVulnerabilitybyFile(fileName);

      if (response.code === 200) {
        const { child } = response.responseData as Record<string, string>;

        const root = [
          {
            level: 2,
            label: formatString(
              localeI18ln.getTranslation('apiResponse.foundIssues') as string,
              child.length,
              1
            ),
            issuesCount: child.length,
            filesCount: 1,
            child: [response.responseData],
          },
        ];
        return resolveSuccess(
          localeI18ln.getTranslation('apiResponse.fileDataFetchedSuccess'),
          200,
          root as Level2Vulnerability[]
        );
      } else {
        return resolveFailure(
          localeI18ln.getTranslation('persistResponse.vulnerabilityNotFound'),
          400
        );
      }
    } else {
      return resolveFailure(
        localeI18ln.getTranslation('persistResponse.vulnerabilityNotFound'),
        400
      );
    }
  } else {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.noActiveFile'),
      400
    );
  }
}

async function getVulnerabilityByTraceId(
  traceId: string
): Promise<ApiResponse | undefined> {
  const fileData: ApiResponse = await getDataOnlyFromCacheAssess();
  const vulnerabilityByFile = fileData.responseData as Level2Vulnerability;
  for (const file of vulnerabilityByFile.child) {
    for (const issue of file.child) {
      if (issue.traceId === traceId) {
        return resolveSuccess(
          localeI18ln.getTranslation('apiResponse.assessVulnerbilitySuccess'),
          200,
          issue
        );
      }
    }
  }
  return undefined;
}

/* getLibraryVulnerabilities: A method to retrieve library Vulnerabilities with the selected filters based on appId */
async function getLibraryVulnerabilities(
  requestBody: ScaFiltersType
): Promise<ApiResponse> {
  const response: ApiResponse = await GetAllConfiguredProjects();
  const configuredProjects: ConfiguredProject[] =
    response.responseData as ConfiguredProject[];

  const project: ConfiguredProject | undefined = configuredProjects?.find(
    (project: ConfiguredProject) =>
      project.projectId === requestBody.appId && project.source === 'assess'
  );

  if (!project) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  const body: LibRequestBody = {
    apps: [requestBody?.appId ?? ''],
    includeUnused: Array.isArray(requestBody?.usage)
      ? requestBody.usage.includes('unused')
      : false,
    includeUsed: Array.isArray(requestBody?.usage)
      ? requestBody.usage.includes('used')
      : false,
    severities: requestBody?.severity ?? [],
    tags: requestBody?.tags ?? [],
    grades: requestBody?.grades ?? [],
    usage: requestBody?.usage ?? [],
    licenses: requestBody?.licenses ?? [],
    environments: requestBody?.environments ?? [],
    servers: requestBody?.servers ?? [],
    quickFilter:
      requestBody?.quickView !== undefined && requestBody?.quickView.length > 0
        ? requestBody?.quickView
        : 'ALL',
    status: requestBody?.status ?? [],
  };

  const { apiKey, contrastURL, userName, serviceKey, organizationId } = project;

  try {
    const client = getAxiosClient(contrastURL);
    const limit = 50;
    let offset = 0;
    let allLibraries: LibraryVulnerability[] = [];

    const initialResponse = await client.post(
      `/ng/${organizationId}/libraries/filter?expand=skip_links,apps,quickFilters,vulns,status,usage_counts`,
      body,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
        params: {
          sort: requestBody?.sort ?? '',
          limit,
          offset,
        },
      }
    );
    if (initialResponse.status !== 200) {
      return handleErrorResponse('apiResponse.somethingWentWrong', 400);
    }

    const totalCount = initialResponse.data.count ?? 0;
    allLibraries = initialResponse.data.libraries ?? [];

    const totalCalls = Math.ceil(totalCount / limit);

    for (let i = 1; i < totalCalls; i++) {
      offset = i * limit;

      const pagedResponse = await client.post(
        `/ng/${organizationId}/libraries/filter?expand=skip_links,apps,quickFilters,vulns,status,usage_counts`,
        body,
        {
          headers: {
            'Api-Key': apiKey,
            Authorization: authBase64(userName, serviceKey),
            ...headers,
          },
          params: {
            sort: requestBody?.sort ?? '',
            limit,
            offset,
          },
        }
      );

      if (pagedResponse.status === 200) {
        const moreLibraries = pagedResponse.data.libraries ?? [];
        allLibraries = [...allLibraries, ...moreLibraries];
      } else {
        throw new Error(
          `${pagedResponse.status}: ${pagedResponse.data.message}`
        );
      }
    }

    const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Library Vulnerabilities fetched successfully \n`;
    void loggerInstance?.logMessage(LogLevel.INFO, logData);

    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.libraryFetchSuccessfully'),
      200,
      getParseLibVulData(allLibraries, project, requestBody?.appId ?? '')
    );
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

/* getLibFilterListByAppId: A method to retrieve library filters list based on appId */
async function getLibFilterListByAppId(
  list:
    | 'tags'
    | 'licenses'
    | 'grades'
    | 'environments'
    | 'servers'
    | 'usage'
    | 'severities'
    | 'status'
    | 'QUICKFILTER',
  appId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;
  try {
    const client = getAxiosClient(contrastURL);

    const body: libListFilter = {
      quickFilter: list === 'QUICKFILTER' ? 'ALL' : 'VULNERABLE',
      apps: [appId],
    };

    const url =
      list === 'QUICKFILTER'
        ? `/ng/${organizationId}/libraries/filter?expand=quickFilters&offset=0&limit=1&sort=score`
        : `/ng/${organizationId}/libraries/filters/${list}/listing`;
    const response = await client.post(url, body, {
      headers: {
        'Api-Key': apiKey,
        Authorization: authBase64(userName, serviceKey),
        ...headers,
      },
    });

    if (response.status === 200) {
      return resolveSuccess(
        `${list} ${localeI18ln.getTranslation('apiResponse.libraryFilterLists')}`,
        200,
        list === 'QUICKFILTER'
          ? response.data.quickFilters
          : response.data.filters
      );
    } else {
      throw new Error(`${response.status}: ${response.data.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

/* getAvailableEnvironments: A method to retrieve environments for assess based on appId */
async function getAvailableEnvironments(appId: string): Promise<ApiResponse> {
  const response: ApiResponse = await GetAllConfiguredProjects();
  const configuredProjects: ConfiguredProject[] =
    response.responseData as ConfiguredProject[];

  const project: ConfiguredProject | undefined = configuredProjects?.find(
    (project: ConfiguredProject) =>
      project.projectId === appId && project.source === 'assess'
  );

  if (!project) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } = project;
  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.post(
      `/ng/${organizationId}/orgtraces/filter/servers-environment/listing?expand=skip_links`,
      {
        quickFilter: 'OPEN',
        modules: [appId],
      },
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation(`apiResponse.assessEnvironments`),
        200,
        response.data.filters
      );
    } else {
      throw new Error(`${response.status}: ${response.data.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

/* getAvailableTags: A method to retrieve tags for the assess based on the appId */
async function getAvailableTags(
  appId: string,
  params: PrimaryConfig
): Promise<ApiResponse> {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;
  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${organizationId}/tags/application/list/${appId}?expand=skip_links`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );

    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation(`apiResponse.assessTags`),
        200,
        Array.isArray(response.data.tags) && response.data.tags.length > 0
          ? response.data.tags.map((val: string) => {
              return {
                keycode: val,
                label: val,
              };
            })
          : []
      );
    } else {
      throw new Error(`${response.status}: ${response.data.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

/* getUsageForLibVul: A method to retrieve usage details based on the appId and hashID */
async function getUsageForLibVul(
  appId: string | undefined,
  hashId: string,
  params: PrimaryConfig
) {
  if (appId === undefined) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.projectNotFound'),
      400
    );
  }

  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/organizations/${organizationId}/applications/${appId}/libraries/${hashId}/reports/library-usage`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );
    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.libUsage'),
        200,
        response.data
      );
    } else {
      throw new Error(`${response.status}: ${response.data.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function getLibOrgTags(params: PrimaryConfig) {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/${organizationId}/tags/libraries/list?expand=skip_links`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );
    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.libTags'),
        200,
        response.data.tags
      );
    } else {
      throw new Error(`${response.status}: ${response.data.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function updateLibTags(
  params: PrimaryConfig,
  hashId: string,
  tags: Array<string>,
  tags_remove: Array<string>
) {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;

  const requestBody = {
    library_hashes: [hashId],
    tags: tags,
    tags_remove: tags_remove,
  };

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.put(
      `/ng/${organizationId}/tags/libraries/bulk?expand=skip_links`,
      requestBody,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );
    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.libTagsUpdate'),
        200,
        response.data.messages
      );
    } else {
      throw new Error(`${response.status}: ${response.data.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}

async function getCVEOverview(cve: string, params: PrimaryConfig) {
  const validationResult = validateParams(params);

  if ('code' in validationResult) {
    return validationResult;
  }

  const { apiKey, contrastURL, userName, serviceKey, organizationId } =
    validationResult.validParams;

  try {
    const client = getAxiosClient(contrastURL);

    const response = await client.get(
      `/ng/organizations/${organizationId}/cves/${cve}`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
          ...headers,
        },
      }
    );
    if (response.status === 200) {
      return resolveSuccess(
        localeI18ln.getTranslation('apiResponse.cveretrieved'),
        200,
        response.data
      );
    } else {
      throw new Error(`${response.status}: ${response.data.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const logData = `Start Time: ${new Date().toISOString()} | End Time: ${new Date().toISOString()} | Message: Error retrieving ServerList - ${error.message} \n`;
      void loggerInstance?.logMessage(LogLevel.ERROR, logData);

      return handleErrorResponse('apiResponse.authenticationFailure', 500);
    }

    return handleErrorResponse('apiResponse.somethingWentWrong', 500);
  }
}
export {
  getAllProjectList,
  getProjectById,
  getCurrentFileVul,
  getAllFilesVulnerability,
  getScanResults,
  getAllScans,
  getScanById,
  getProjectVulnerabilties,
  getVulnerabilitybyFile,
  getVulnerabilitybyCriticality,
  getVulnerabilitybyLineNumber,
  getFirstVulnerabilitybyLineNumber,
  resetTimer,
  getOrganisationName,
  getPackageInformation,
  getAxiosClient,
  getScanResultById,
  getAllApplicationsByOrgId,
  getApplicationById,
  getServerListbyOrgId,
  getBuildNumber,
  getCustomSessionMetaData,
  getMostRecentMetaData,
  getListOfTagsByOrgId,
  addTagsByOrgId,
  getScanVulnerabilityResults,
  getAssessVulnerabilities,
  getVulnerabilityLineNumberandFileName,
  getVulnerabilityIntroTextandRisk,
  getVulnerabilityRecommendation,
  getVulnerabilityEvents,
  getAssessVulnerabiltiesFromCache,
  addMarkByOrgId,
  getCurrentFileVulForAssess,
  getVulnerabilityByTraceId,
  getVulnerabilityHttps,
  getLibraryVulnerabilities,
  getAvailableEnvironments,
  getLibFilterListByAppId,
  getAvailableTags,
  getUsageForLibVul,
  getLibOrgTags,
  updateLibTags,
  getCVEOverview,
};
