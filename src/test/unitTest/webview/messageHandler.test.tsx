import * as vscode from 'vscode';
import {
  messageHandler,
  ShowErrorPopup,
  ShowInformationPopup,
  ShowInformationPopupWithOptions,
} from '../../../vscode-extension/commands/ui-commands/messageHandler';

import { CommandResponse } from '../../../common/types';
import { WEBVIEW_COMMANDS } from '../../../vscode-extension/utils/constants/commands';

jest.mock('vscode', () => ({
  window: {
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
  },
}));

// Mock the translations and other imported functionalities
jest.mock('../../../l10n', () => ({
  localeI18ln: {
    getTranslation: jest
      .fn()
      .mockReturnValue('No vulnerabilities found for the selected filters'),
  },
}));

describe('UI Commands - messageHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show error popup when command response is failure', () => {
    const res: CommandResponse = {
      command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
      data: {
        status: 'failure',
        message: 'Scan failed',
      },
    };

    messageHandler(res);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Scan failed');
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  it('should show information popup with translated message when command response is success and no vulnerabilities found', () => {
    const res: CommandResponse = {
      command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
      data: {
        status: 'success',
        message: 'Scan successful',
        code: 200,
        responseData: {
          child: [], // Empty responseData array signifies no vulnerabilities found
        },
      },
    };

    messageHandler(res);

    // Check if the translated message for "No vulnerabilities found" is shown
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'No vulnerabilities found for the selected filters'
    );
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
  });

  it('should show information popup when command response is success and vulnerabilities are found', () => {
    const res: CommandResponse = {
      command: WEBVIEW_COMMANDS.SCAN_MANUAL_REFRESH,
      data: {
        status: 'success',
        message: 'Scan successful',
        code: 200,
        responseData: {
          child: [{}, {}, {}], // Non-empty array signifies vulnerabilities found
        },
      },
    };

    messageHandler(res);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'Scan successful'
    );
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
  });

  it('should not show error or info when command is not in messageCommands list', () => {
    const res: CommandResponse = {
      command: 'UNKNOWN_COMMAND',
      data: {
        status: 'success',
        message: 'This should not be handled',
      },
    };

    const result = messageHandler(res);

    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should show information popup with options when ShowInformationPopupWithOptions is called', () => {
    const message = 'Do you want to continue?';

    ShowInformationPopupWithOptions(message);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      message,
      'Yes',
      'no'
    );
  });

  it('should show error popup correctly when ShowErrorPopup is called', () => {
    const message = 'An error occurred!';

    ShowErrorPopup(message);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message);
  });

  it('should show information popup correctly when ShowInformationPopup is called', () => {
    const message = 'Operation successful!';

    ShowInformationPopup(message);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message);
  });
});
