const axios = require('axios');
const pkg = require('../../../../package.json');
import {
  ApiResponse,
  ConfiguredProject,
  FilterType,
  LogLevel,
  PersistedDTO,
  PrimaryConfig,
} from '../../../common/types';
import { authBase64 } from '../../../webview/utils/authBase64';
import { resolveFailure, resolveSuccess } from '../../utils/errorHandling';
import * as vscode from 'vscode';
import { allProjectVul, FilterData } from '../../../webview/utils/constant';
import { PersistenceInstance } from '../../utils/persistanceState';
import { SETTING_KEYS, TOKEN } from '../../utils/constants/commands';
import {
  getAdviceFromCache,
  getDataFromCache,
  getDataOnlyFromCache,
  updateAdvice,
} from '../../cache/cacheManager';
import {
  resetBackgroundTimer,
  stopBackgroundTimer,
} from '../../cache/backgroundRefreshTimer';
import {
  Level0Entry,
  Level1Entry,
  Params,
  ProjectSource,
  Vulnerability,
} from '../model/api.interface';
import { localeI18ln } from '../../../l10n';
import {
  constructFilters,
  DateTime,
  filterCriticalVulnerabilities,
  filterCriticalVulnerabilitiesLineNumber,
  formatString,
  getOpenedFolderName,
  parseSourceJson,
} from '../../utils/commonUtil';

import {
  GetAllConfiguredProjects,
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
      void loggerInstance.logMessage(LogLevel.ERROR, logData);
      console.error('error', error);
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

async function getProjectById(params: ConfiguredProject): Promise<boolean> {
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

    const response = await client.get(
      `/${baseUrl}/organizations/${organizationId}/projects/${projectId}`,
      {
        headers: {
          'Api-Key': apiKey,
          Authorization: authBase64(userName, serviceKey),
        },
      }
    );
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    if (err instanceof Error) {
      void loggerInstance.logMessage(LogLevel.ERROR, `${err.message} \n`);
    }
    return false;
  }
}

const getCurrentFileVul = async (): Promise<ApiResponse> => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const fileName = getFilePathuri(editor.document.fileName);

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

      if (filters.status !== undefined) {
        params.status = filters.status;
      }

      if (filters.severity !== undefined) {
        params.severity = filters.severity;
      }

      const client = getAxiosClient(contrastURL);

      const response = await client.get(
        `/${baseUrl}/organizations/${organizationId}/projects/${projectId}/results/info`,
        {
          headers: {
            'Api-Key': apiKey,
            Authorization: authBase64(userName, serviceKey),
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
    void loggerInstance.logMessage(LogLevel.INFO, logData);

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
      void loggerInstance.logMessage(LogLevel.ERROR, logData);
    }

    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.errorFetchingScanResult'),
      500
    );
  }
}

async function getProjectVulnerabilties(): Promise<ApiResponse | undefined> {
  const projectVulnerabilities: ApiResponse = await getDataFromCache();
  const vulnerabilities = projectVulnerabilities.responseData as ProjectSource;
  if (vulnerabilities?.issuesCount > 15000) {
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.configureFilter'),
      400
    );
  }
  if (projectVulnerabilities.code === 200) {
    ShowInformationPopup(projectVulnerabilities.message);
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Vulnerabilities Retrieved from Cache \n`;
    void loggerInstance.logMessage(LogLevel.INFO, logData);
    return projectVulnerabilities;
  } else {
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Unable to retrieve vulnerabilities from Cache \n`;
    void loggerInstance.logMessage(LogLevel.ERROR, logData);
    ShowErrorPopup(projectVulnerabilities.message);
  }
}

async function getVulnerabilitybyFile(
  fileName: string | undefined
): Promise<ApiResponse> {
  const fileData: ApiResponse = await getDataOnlyFromCache();
  const vulnerabilityByFile = fileData.responseData as ProjectSource;
  const file = vulnerabilityByFile?.child?.find(
    (o: Level1Entry) => o.label === fileName
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
  const projectName = getOpenedFolderName();
  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];

  const project = persistedData?.find(
    (project: ConfiguredProject) => project.projectName === projectName
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
        void loggerInstance.logMessage(LogLevel.ERROR, logData);
        return resolveFailure(
          localeI18ln.getTranslation('apiResponse.failedToRetrieveScan'),
          400
        );
      }
    } while (page <= totalPages);
    const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Scans Retrieved Successfully \n`;
    void loggerInstance.logMessage(LogLevel.INFO, logData);
    return resolveSuccess(
      localeI18ln.getTranslation('apiResponse.scanRetrievedSuccessful'),
      200,
      allScans
    );
  } catch (err) {
    if (err instanceof Error) {
      await loggerInstance.logMessage(LogLevel.ERROR, `${err.message} \n`);
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
      void loggerInstance.logMessage(LogLevel.ERROR, `${err.message} \n`);
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
        },
      }
    );
    if (res.status === 200) {
      return res.data.organization.name;
    }
    return false;
  } catch (error) {
    if (error instanceof Error) {
      void loggerInstance.logMessage(
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
  const projectName = getOpenedFolderName();

  const persistedData = PersistenceInstance.getByKey(
    TOKEN.SETTING,
    SETTING_KEYS.CONFIGPROJECT as keyof PersistedDTO
  ) as ConfiguredProject[];
  const project = persistedData?.find(
    (project: ConfiguredProject) => project.projectName === projectName
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
          },
        }
      );

      if (response.status === 200) {
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Scans Retrieved Successfully \n`;
        void loggerInstance.logMessage(LogLevel.INFO, logData);
        await updateAdvice(scanId, response.data.risk);

        return resolveSuccess(
          localeI18ln.getTranslation('apiResponse.scanRetrievedByIdSuccessful'),
          200,
          response.data.risk
        );
      } else {
        const logData = `Start Time: ${DateTime} | End Time: ${DateTime} | Message: Failed to retrieve scans \n`;
        void loggerInstance.logMessage(LogLevel.ERROR, logData);
        return resolveFailure(
          localeI18ln.getTranslation('apiResponse.failedToRetrieveScanById'),
          400
        );
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      void loggerInstance.logMessage(LogLevel.ERROR, `${err.message} \n`);
    }
    return resolveFailure(
      localeI18ln.getTranslation('apiResponse.errorFetchingScanById'),
      500
    );
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
};
