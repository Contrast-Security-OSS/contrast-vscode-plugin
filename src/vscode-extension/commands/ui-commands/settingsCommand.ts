import * as vscode from 'vscode';
import { ContrastPanelInstance } from './webviewHandler';
import { toggleContrastPanel } from '../../utils/toggleContrastPanel';
import {
  CONSTRAST_SETTING,
  EXTENTION_COMMANDS,
} from '../../utils/constants/commands';
import { aboutWebviewPanelInstance } from './aboutWebviewHandler';

const registerSettingsCommand = vscode.commands.registerCommand(
  CONSTRAST_SETTING,
  () => {
    toggleContrastPanel();
    ContrastPanelInstance.onChangeScreen(EXTENTION_COMMANDS.SETTING_SCREEN);
    aboutWebviewPanelInstance.dispose();
  }
);

export { registerSettingsCommand };
