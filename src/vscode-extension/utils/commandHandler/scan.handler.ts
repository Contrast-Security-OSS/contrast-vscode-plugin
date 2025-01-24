import { window } from 'vscode';
import {
  ApiResponse,
  CommandRequest,
  CustomFileVulnerability,
} from '../../../common/types';
import {
  getCurrentFileVul,
  getVulnerabilitybyFile,
} from '../../api/services/apiService';
import {
  getDataFromCache,
  getDataOnlyFromCache,
  refreshCache,
} from '../../cache/cacheManager';
import {
  GetFilters,
  UpdateFilters,
} from '../../persistence/PersistenceConfigSetting';
import { getOpenedFolderName } from '../commonUtil';
import { WEBVIEW_COMMANDS } from '../constants/commands';
import { resolveFailure } from '../errorHandling';
import { getFilePathuri, getProjectIdByName, slotInstance } from '../helper';
import { openVulFile } from '../vulnerabilityDecorator';
import { localeI18ln } from '../../../l10n';

export const ScanCommandHandler = async (props: CommandRequest) => {
  const { command, payload } = props;
  switch (command) {
    case WEBVIEW_COMMANDS.SCAN_OPEN_VULNERABILITY_FILE: {
      slotInstance.setSlot(false);
      return {
        command: WEBVIEW_COMMANDS.SCAN_OPEN_VULNERABILITY_FILE,
        data: openVulFile(payload),
      };
    }
    case WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_GET_CURRENTFILE_VUL,
        data: await getCurrentFileVul(),
      };
    }
    case WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_GET_ALL_FILES_VULNERABILITY,
        data: await getDataOnlyFromCache(),
      };
    }

    case WEBVIEW_COMMANDS.SCAN_GET_FILTERS: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_GET_FILTERS,
        data: await GetFilters(),
      };
    }
    case WEBVIEW_COMMANDS.SCAN_UPDATE_FILTERS: {
      return {
        command: WEBVIEW_COMMANDS.SCAN_UPDATE_FILTERS,
        data: await UpdateFilters(payload),
      };
    }
    case WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH: {
      const project = getProjectIdByName(getOpenedFolderName() as string);
      let response: ApiResponse = await Promise.resolve(
        resolveFailure(
          localeI18ln.getTranslation('persistResponse.projectNotConfigured'),
          400
        )
      );
      if (project) {
        await refreshCache(project.projectId as string);
        response = await getDataFromCache();
        const activeTextEditor = window.activeTextEditor;
        if (activeTextEditor) {
          const filePath = getFilePathuri(activeTextEditor.document.fileName);
          if (filePath !== null) {
            const fileVulnerability = await getVulnerabilitybyFile(filePath);
            if (fileVulnerability.code === 200) {
              await openVulFile(
                fileVulnerability.responseData as CustomFileVulnerability
              );
            } else {
              await openVulFile({ level: 1, child: [], filePath });
            }
          }
        }
      }
      return {
        command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
        data: response,
      };
    }
    default:
      break;
  }
};
