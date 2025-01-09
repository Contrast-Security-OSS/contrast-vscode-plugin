import * as vscode from 'vscode';

import { WEBVIEW_COMMANDS } from '../../utils/constants/commands';
import {
  ApiResponse,
  CommandResponse,
  LocaleJson,
} from '../../../common/types';
import { localeI18ln } from '../../../l10n';

function ShowErrorPopup(message: string) {
  vscode.window.showErrorMessage(message);
}

function ShowInformationPopup(message: string | undefined) {
  return vscode.window.showInformationMessage(
    message !== null && message !== undefined ? message : ''
  );
}

function ShowInformationPopupWithOptions(message: string) {
  return vscode.window.showInformationMessage(message, 'Yes', 'no');
}

function messageHandler(res: CommandResponse) {
  const messageCommands = [
    WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
    WEBVIEW_COMMANDS.SETTING_ADD_PROJECT_TO_CONFIGURE,
    WEBVIEW_COMMANDS.SETTING_GET_ALL_PROJECTS,
    WEBVIEW_COMMANDS.SETTING_UPDATE_CONFIGURE_PROJECT,
    WEBVIEW_COMMANDS.SCAN_UPDATE_FILTERS,
    WEBVIEW_COMMANDS.SETTING_DELETE_CONFIGURE_PROJECT,
  ];
  if (
    messageCommands.includes(res.command as WEBVIEW_COMMANDS) &&
    isApiResponse(res.data)
  ) {
    if (res.data.status === 'failure') {
      ShowErrorPopup(res.data.message);
      return true;
    } else {
      const { responseData, code } = res.data;
      const response = responseData as { child: Array<Object> };
      if (
        res.command === WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH &&
        code === 200 &&
        responseData !== null &&
        responseData !== undefined &&
        response.child.length === 0
      ) {
        ShowInformationPopup(
          localeI18ln.getTranslation(
            'persistResponse.vulnerabilityNotFoundForFilters'
          )
        );
        return true;
      }
      ShowInformationPopup(res.data.message);
    }
  }
  return true;
}

// Type guard function to check if data is ApiResponse
function isApiResponse(
  data: ApiResponse | LocaleJson | null | {} | undefined
): data is ApiResponse {
  return (data as ApiResponse)?.message !== undefined;
}

export {
  messageHandler,
  ShowInformationPopup,
  ShowInformationPopupWithOptions,
  ShowErrorPopup,
};
